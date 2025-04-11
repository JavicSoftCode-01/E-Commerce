// BackEnd/src/services/ProductoService.js
import {IndexedDB} from '../database/indexdDB.js';
import {Validar} from '../utils/validar.js';
import {Producto} from '../models/Producto.js';
import GoogleSheetSync from '../database/syncGoogleSheet.js';
import GoogleSheetReader from '../database/GoogleSheetReader.js';

class ProductoService extends IndexedDB {
  static googleSheetSyncProducto = new GoogleSheetSync('https://script.google.com/macros/s/AKfycby9BqUbllpMKAJ4-iryf47VEM76lAtLt6oRRq4R64QDZnhECmbuXsCm7jinDL146jGo/exec');
  static googleSheetReaderProducto = new GoogleSheetReader('https://script.google.com/macros/s/AKfycby9BqUbllpMKAJ4-iryf47VEM76lAtLt6oRRq4R64QDZnhECmbuXsCm7jinDL146jGo/exec');
  static SYNC_INTERVAL = 3000; // 3 seconds

  constructor(categoriaService, marcaService, proveedorService) {
    super('mydb', 'productos');
    this.categoriaService = categoriaService;
    this.marcaService = marcaService;
    this.proveedorService = proveedorService;
    console.log('ProductoService - Dependencias:', {
      categoriaService: this.categoriaService,
      marcaService: this.marcaService,
      proveedorService: this.proveedorService
    });
    this.lastSyncTime = null;
    this.startPeriodicSync();
    this.googleSheetReaderProducto = new GoogleSheetReader('https://script.google.com/macros/s/AKfycby9BqUbllpMKAJ4-iryf47VEM76lAtLt6oRRq4R64QDZnhECmbuXsCm7jinDL146jGo/exec');

  }

  startPeriodicSync() {
    this.syncWithGoogleSheets();
    setInterval(() => this.syncWithGoogleSheets(), ProductoService.SYNC_INTERVAL);
  }

  // Método para forzar sincronización
  async forceSyncNow() {
    return await this.syncWithGoogleSheets();
  }

async syncWithGoogleSheets() {
  try {
    console.log('[SYNC] Iniciando sincronización de productos...');
    const productosData = await this.googleSheetReaderProducto.getData('Producto');

    // --- Validaciones iniciales ---
    if (!productosData) {
      console.warn('[SYNC] getData devolvió null/undefined.');
      return false;
    }
    if (!Array.isArray(productosData)) {
      console.warn('[SYNC] getData no devolvió un Array:', productosData);
      return false;
    }
    if (productosData.length === 0) {
      console.info('[SYNC] No se encontraron datos en Google Sheet.');
      await this.clearAll();
      this.lastSyncTime = new Date();
      return true;
    }
    console.log('[SYNC] Datos crudos recibidos:', productosData);

    // --- Mapeo y Parseo ---
    const productosInstancias = productosData.map((pData, rowIndex) => {
      console.log(`[SYNC ROW ${rowIndex}] Datos crudos:`, pData);
      try {
        const parseToIntOrNull = (value) => {
          if (value === undefined || value === null || String(value).trim() === '') {
            return null;
          }
          const strValue = String(value).trim();
          if (!/^\d+$/.test(strValue)) {
            console.error(`[SYNC ROW ${rowIndex}] Valor no es un entero válido: "${strValue}"`);
            return null;
          }
          const num = parseInt(strValue, 10);
          return !isNaN(num) ? num : null;
        };
        const parseToFloatOrNull = (value) => {
          if (value === undefined || value === null || String(value).trim() === '') {
            return null;
          }
          const strValue = String(value).trim().replace(',', '.');
          if (!/^\d*\.?\d*$/.test(strValue)) {
            console.error(`[SYNC ROW ${rowIndex}] Valor no es un número válido: "${strValue}"`);
            return null;
          }
          const num = parseFloat(strValue);
          return !isNaN(num) ? parseFloat(num.toFixed(2)) : null;
        };
        const parseToString = (value) => {
          return (value === undefined || value === null) ? "" : String(value).trim();
        };

        // Usar claves en minúsculas, ya que doGet las normaliza
        const id = parseToIntOrNull(pData.id);
        const categoriaId = parseToIntOrNull(pData.categoriaid);
        const marcaId = parseToIntOrNull(pData.marcaid);
        const proveedorId = parseToIntOrNull(pData.proveedorid);
        const cantidad = parseToIntOrNull(pData.cantidad) ?? 0;
        const stock = parseToIntOrNull(pData.stock) ?? cantidad;
        const precio = parseToFloatOrNull(pData.precio) ?? 0;
        const pvp = parseToFloatOrNull(pData.pvp) ?? 0;
        const nombre = parseToString(pData.nombre);
        const categoriaNombre = parseToString(pData.categorianombre);
        const marcaNombre = parseToString(pData.marcanombre);
        const proveedorNombre = parseToString(pData.proveedornombre);
        const descripcion = parseToString(pData.descripcion);
        const imagen = parseToString(pData.imagen);

        let estado = false;
        const estadoRaw = pData.estado;
        if (typeof estadoRaw === 'boolean') {
          estado = estadoRaw;
        } else if (typeof estadoRaw === 'string') {
          estado = estadoRaw.trim().toUpperCase() === 'TRUE' || estadoRaw.trim() === '1' || estadoRaw.trim().toUpperCase() === 'VERDADERO';
        } else if (typeof estadoRaw === 'number') {
          estado = estadoRaw === 1;
        }

        const parseToISODateString = (value) => {
          if (!value) return new Date().toISOString();
          try {
            const d = new Date(value);
            return !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
          } catch (e) {
            console.warn(`[SYNC ROW ${rowIndex}] Error parseando fecha: ${value}`, e);
            return new Date().toISOString();
          }
        };
        const fechaCreacion = parseToISODateString(pData["fechaCreacion"]);
        const fechaActualizacion = parseToISODateString(pData["fechaActualizacion"]);

        if (id === null) {
          console.warn(`[SYNC ROW ${rowIndex}] ID inválido (${pData.id}). Generando ID temporal...`);
          return null;
        }
        if (nombre === "") {
          console.warn(`[SYNC ROW ${rowIndex}] (ID: ${id}): Nombre vacío tras parseo.`);
        }

        const instancia = new Producto(
          nombre, estado, fechaCreacion, fechaActualizacion,
          categoriaId,
          (categoriaNombre === "" && categoriaId !== null) ? 'Sin categoría' : categoriaNombre,
          marcaId,
          (marcaNombre === "" && marcaId !== null) ? 'Sin marca' : marcaNombre,
          proveedorId,
          (proveedorNombre === "" && proveedorId !== null) ? 'Sin proveedor' : proveedorNombre,
          precio, pvp, cantidad, descripcion, imagen
        );
        instancia.id = id;
        instancia.stock = stock;

        console.log(`[SYNC ROW ${rowIndex}] Producto parseado:`, instancia);
        return instancia;

      } catch (parseError) {
        console.error(`[SYNC ROW ${rowIndex}] Error CRÍTICO parseando:`, pData, parseError);
        return null;
      }
    }).filter(p => p !== null);

    console.log(`[SYNC] Parseados ${productosInstancias.length} productos válidos localmente.`);

    // ---- Actualización de IndexedDB ----
    try {
      await this.clearAll();
      const db = await this.dbPromise;
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      let addedCount = 0;
      for (const producto of productosInstancias) {
        if (producto.id === null || isNaN(producto.id)) {
          console.warn("[SYNC-DB] Omitiendo guardar producto con ID inválido:", producto);
          continue;
        }
        try {
          await store.put(producto);
          addedCount++;
        } catch (dbWriteError) {
          console.error("[SYNC-DB] Error escritura IndexedDB:", producto, dbWriteError);
        }
      }
      await transaction.done;
      this.lastSyncTime = new Date();
      console.info(`[SYNC] Sincronización con IndexedDB completa: ${addedCount}/${productosInstancias.length} productos procesados a las ${this.lastSyncTime.toLocaleTimeString()}`);
      return true;
    } catch (dbError) {
      console.error('[SYNC-DB] Error transacción IndexedDB:', dbError);
      return false;
    }

  } catch (error) {
    console.error('[SYNC] Error GENERAL en sincronización:', error);
    return false;
  }
}

  async agregarProducto(producto) {
    try {
      console.log('Datos recibidos para agregar producto:', producto);
  
      await this.forceSyncNow();
      const nombreValidado = await Validar.nombreBM(producto.nombre, this);
      if (!nombreValidado) {
        console.error('Nombre no válido:', producto.nombre);
        return null;
      }
  
      const categoriaValida = await this.categoriaService.obtenerCategoriaPorId(producto.categoriaId);
      const marcaValida = await this.marcaService.obtenerMarcaPorId(producto.marcaId);
      const proveedorValido = await this.proveedorService.obtenerProveedorPorId(producto.proveedorId);
      const precioValidado = Validar.precio(producto.precio);
      const pvpValidado = Validar.precio(producto.pvp);
      const cantidadValidada = Validar.cantidadStock(producto.cantidad);
      const descripcionValidada = Validar.descripcion(producto.descripcion);
  
      console.log('Valores validados:', {
        precio: precioValidado,
        pvp: pvpValidado,
        cantidad: cantidadValidada,
        stockInicial: cantidadValidada
      });
  
      if (!categoriaValida || !marcaValida || !proveedorValido || !precioValidado || !pvpValidado || !cantidadValidada || !descripcionValidada) {
        console.error('Validación fallida:', {
          categoria: !!categoriaValida,
          marca: !!marcaValida,
          proveedor: !!proveedorValido,
          precio: !!precioValidado,
          pvp: !!pvpValidado,
          cantidad: !!cantidadValidada,
          descripcion: !!descripcionValidada
        });
        return null;
      }
  
      const lastId = await this.getAll().then(productos => productos.length === 0 ? 0 : Math.max(...productos.map(p => p.id)));
      const nextId = lastId + 1;
  
      const nuevoProducto = new Producto(
        nombreValidado,
        true,
        new Date(),
        new Date(),
        categoriaValida.id,
        categoriaValida.nombre,
        marcaValida.id,
        marcaValida.nombre,
        proveedorValido.id,
        proveedorValido.nombre,
        precioValidado,
        pvpValidado,
        cantidadValidada,
        descripcionValidada,
        producto.imagen
      );
      nuevoProducto.id = nextId;
      nuevoProducto.stock = cantidadValidada; // Inicializar stock con la cantidad original
  
      console.log('Producto creado antes de guardar:', nuevoProducto);
  
      await super.add(nuevoProducto);
      await ProductoService.googleSheetSyncProducto.sync("create", nuevoProducto);
      await this.forceSyncNow();
  
      console.log('Producto guardado y sincronizado:', nuevoProducto);
      return nuevoProducto;
    } catch (error) {
      console.error('Error adding product:', error);
      return null;
    }
  }
  async actualizarProducto(id, datosActualizados) {
    try {
      await this.forceSyncNow();
      const productoExistente = await this.obtenerProductoPorId(id);
      if (!productoExistente) return null;

      let nombreValidado = datosActualizados.nombre !== undefined ? await Validar.nombreBM(datosActualizados.nombre, this, id) : productoExistente.nombre;
      if (datosActualizados.nombre !== undefined && !nombreValidado) return null;

      let categoriaValida = datosActualizados.categoriaId !== undefined ? await this.categoriaService.obtenerCategoriaPorId(datosActualizados.categoriaId) : await this.categoriaService.obtenerCategoriaPorId(productoExistente.categoriaId);
      if (datosActualizados.categoriaId !== undefined && !categoriaValida) return null;

      let marcaValida = datosActualizados.marcaId !== undefined ? await this.marcaService.obtenerMarcaPorId(datosActualizados.marcaId) : await this.marcaService.obtenerMarcaPorId(productoExistente.marcaId);
      if (datosActualizados.marcaId !== undefined && !marcaValida) return null;

      let proveedorValido = datosActualizados.proveedorId !== undefined ? await this.proveedorService.obtenerProveedorPorId(datosActualizados.proveedorId) : await this.proveedorService.obtenerProveedorPorId(productoExistente.proveedorId);
      if (datosActualizados.proveedorId !== undefined && !proveedorValido) return null;

      let precioValidado = datosActualizados.precio !== undefined ? Validar.precio(datosActualizados.precio) : productoExistente.precio;
      let pvpValidado = datosActualizados.pvp !== undefined ? Validar.precio(datosActualizados.pvp) : productoExistente.pvp;
      let cantidadValidada = datosActualizados.cantidad !== undefined ? Validar.cantidadStock(datosActualizados.cantidad) : productoExistente.cantidad;
      let descripcionValidada = datosActualizados.descripcion !== undefined ? Validar.descripcion(datosActualizados.descripcion) : productoExistente.descripcion;

      let huboCambios = false;
      if (nombreValidado !== productoExistente.nombre) {
        productoExistente.nombre = nombreValidado;
        huboCambios = true;
      }
      if (categoriaValida.id !== productoExistente.categoriaId) {
        productoExistente.categoriaId = categoriaValida.id;
        productoExistente.categoriaNombre = categoriaValida.nombre;
        huboCambios = true;
      }
      if (marcaValida.id !== productoExistente.marcaId) {
        productoExistente.marcaId = marcaValida.id;
        productoExistente.marcaNombre = marcaValida.nombre;
        huboCambios = true;
      }
      if (proveedorValido.id !== productoExistente.proveedorId) {
        productoExistente.proveedorId = proveedorValido.id;
        productoExistente.proveedorNombre = proveedorValido.nombre;
        huboCambios = true;
      }
      if (precioValidado !== productoExistente.precio) {
        productoExistente.precio = precioValidado;
        huboCambios = true;
      }
      if (pvpValidado !== productoExistente.pvp) {
        productoExistente.pvp = pvpValidado;
        huboCambios = true;
      }
      if (cantidadValidada !== productoExistente.cantidad) {
        productoExistente.cantidad = cantidadValidada;
        productoExistente.stock = cantidadValidada; // Actualizar stock si cantidad cambia
        huboCambios = true;
      }
      if (descripcionValidada !== productoExistente.descripcion) {
        productoExistente.descripcion = descripcionValidada;
        huboCambios = true;
      }
      if (datosActualizados.imagen !== undefined && datosActualizados.imagen !== productoExistente.imagen) {
        productoExistente.imagen = datosActualizados.imagen;
        huboCambios = true;
      }
      if (datosActualizados.estado !== undefined && productoExistente.estado !== datosActualizados.estado) {
        productoExistente.estado = datosActualizados.estado;
        huboCambios = true;
      }

      if (huboCambios) {
        productoExistente.prepareForUpdate();
        await super.update(id, productoExistente);
        await ProductoService.googleSheetSyncProducto.sync("update", productoExistente);
        await this.forceSyncNow();
        return productoExistente;
      }
      return productoExistente;
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      return null;
    }
  }

  async eliminarProducto(id) {
    try {
      await this.forceSyncNow();
      await super.delete(id);
      await ProductoService.googleSheetSyncProducto.sync("delete", {id});
      await this.forceSyncNow();
      return true;
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      return null;
    }
  }

  async obtenerProductos(filtros = {}) {
    try {
      if (!this.lastSyncTime || (new Date() - this.lastSyncTime) > ProductoService.SYNC_INTERVAL) {
        await this.syncWithGoogleSheets();
      }
      let productos = await super.getAll();
      if (filtros.categoria) productos = productos.filter(p => p.categoriaId === parseInt(filtros.categoria));
      if (filtros.marca) productos = productos.filter(p => p.marcaId === parseInt(filtros.marca));
      if (filtros.search) {
        const searchLower = filtros.search.toLowerCase();
        productos = productos.filter(p => p.nombre.toLowerCase().includes(searchLower) || (p.descripcion && p.descripcion.toLowerCase().includes(searchLower)));
      }
      if (filtros.sort) {
        switch (filtros.sort) {
          case 'price-asc':
            productos.sort((a, b) => a.pvp - b.pvp);
            break;
          case 'price-desc':
            productos.sort((a, b) => b.pvp - a.pvp);
            break;
          case 'name-asc':
            productos.sort((a, b) => a.nombre.localeCompare(b.nombre));
            break;
          case 'name-desc':
            productos.sort((a, b) => b.nombre.localeCompare(a.nombre));
            break;
        }
      }
      return productos;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  async obtenerProductoPorId(id) {
    try {
      const dbId = parseInt(id, 10);
      if (isNaN(dbId)) {
        console.error('ID inválido para obtenerProductoPorId:', id);
        return null;
      }

      const productoData = await super.getById(dbId);
      if (!productoData) {
        console.warn(`Producto con ID ${dbId} no encontrado inicialmente. Forzando sincronización...`);
        await this.forceSyncNow();
        const productoDataSynced = await super.getById(dbId);
        if (!productoDataSynced) {
          console.error(`Producto con ID ${dbId} no encontrado incluso después de sincronizar.`);
          return null;
        }
        const mappedProducto = this.mapDataToProductoInstance(productoDataSynced);
        console.log(`Producto mapeado después de sincronización (ID: ${dbId}):`, mappedProducto);
        return mappedProducto;
      } else {
        const mappedProducto = this.mapDataToProductoInstance(productoData);
        console.log(`Producto mapeado directamente (ID: ${dbId}):`, mappedProducto);
        return mappedProducto;
      }
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      return null;
    }
  }

  async mapDataToProductoInstance(productoData) {
    if (!productoData) return null;

    let categoriaNombre = productoData.categoriaNombre || 'Sin categoría';
    let marcaNombre = productoData.marcaNombre || 'Sin marca';
    let proveedorNombre = productoData.proveedorNombre || 'Sin proveedor';

    const producto = new Producto(
      productoData.nombre || '',
      productoData.estado || false,
      productoData.fechaCreacion || new Date().toISOString(),
      productoData.fechaActualizacion || new Date().toISOString(),
      productoData.categoriaId || null,
      categoriaNombre,
      productoData.marcaId || null,
      marcaNombre,
      productoData.proveedorId || null,
      proveedorNombre,
      productoData.precio || 0,
      productoData.pvp || 0,
      productoData.cantidad || 0, // Cantidad original
      productoData.descripcion || '',
      productoData.imagen || ''
    );
    producto.id = productoData.id;
    producto.stock = productoData.stock !== undefined ? productoData.stock : productoData.cantidad || 0; // Usar stock si existe, sino usar cantidad como valor inicial
    return producto;
  }

  async clearAll() {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.clear();
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
    }
  }

  async verificarDependencias(tipo, id) {
    try {
      const productos = await this.obtenerProductos();
      let dependencias = [];
      switch (tipo) {
        case 'categoria':
          dependencias = productos.filter(p => p.categoriaId === id);
          break;
        case 'marca':
          dependencias = productos.filter(p => p.marcaId === id);
          break;
        case 'proveedor':
          dependencias = productos.filter(p => p.proveedorId === id);
          break;
      }
      return {hasDependencies: dependencias.length > 0, count: dependencias.length, productos: dependencias};
    } catch (error) {
      console.error(`Error checking dependencies for ${tipo} ${id}:`, error);
      return null;
    }
  }

  async actualizarStock(productoId, cantidad) {
    try {
      const producto = await this.obtenerProductoPorId(productoId);
      if (!producto) {
        console.error(`No se encontró el producto con ID ${productoId}`);
        return null;
      }

      if (cantidad < 0 && Math.abs(cantidad) > producto.stock) {
        console.error(`Stock insuficiente. Stock actual: ${producto.stock}, Cantidad solicitada: ${Math.abs(cantidad)}`);
        return null;
      }

      const nuevoStock = producto.stock + cantidad;
      producto.stock = nuevoStock; // Solo actualizamos stock, no cantidad

      if (producto.stock < 0) {
        console.error("El stock no puede ser negativo");
        return null;
      }

      const actualizado = await super.update(productoId, producto);
      if (!actualizado) {
        console.error(`Error al actualizar el producto ${productoId} en IndexedDB`);
        return null;
      }

      // Enviar solo el ID y el stock para actualizar en Google Sheets
      const stockUpdateData = {
        id: productoId,
        stock: nuevoStock
      };
      try {
        await ProductoService.googleSheetSyncProducto.sync("updateStock", stockUpdateData);
        console.info(`Stock sincronizado con Google Sheets para producto ${productoId}. Nuevo stock: ${nuevoStock}`);
      } catch (syncError) {
        console.error(`Error al sincronizar stock con Google Sheets para producto ${productoId}:`, syncError);
        producto.stock -= cantidad; // Revertir el cambio
        await super.update(productoId, producto);
        return null;
      }

      await this.forceSyncNow();

      console.info(`Stock actualizado para producto ${productoId}. Nuevo stock: ${nuevoStock}`);
      return true;

    } catch (error) {
      console.error("Error al actualizar el stock:", error);
      return null;
    }
  }
}

export {ProductoService};
