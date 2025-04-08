// BackEnd/src/services/ProductoService.js
import { IndexedDB } from '../database/indexdDB.js';
import { Validar } from '../utils/validar.js';
import { Producto } from '../models/Producto.js';
import GoogleSheetSync from '../database/syncGoogleSheet.js';
import GoogleSheetReader from '../database/GoogleSheetReader.js';

class ProductoService extends IndexedDB {
  static googleSheetSyncProducto = new GoogleSheetSync('https://script.google.com/macros/s/AKfycbzUbjRtK4pXL3c9oJaBAA_tuXkxD5mUw3LpWy2bbmCszwuIeYM0Nisx7Mt3zVNU86so/exec');
  static googleSheetReaderProducto = new GoogleSheetReader('https://script.google.com/macros/s/AKfycbzUbjRtK4pXL3c9oJaBAA_tuXkxD5mUw3LpWy2bbmCszwuIeYM0Nisx7Mt3zVNU86so/exec');
  static SYNC_INTERVAL = 3000; // 3 seconds

  constructor(categoriaService, marcaService, proveedorService) {
    super('mydb', 'productos');
    this.categoriaService = categoriaService;
    this.marcaService = marcaService;
    this.proveedorService = proveedorService;
    this.lastSyncTime = null;
    this.startPeriodicSync();
  }

  startPeriodicSync() {
    this.syncWithGoogleSheets();
    setInterval(() => this.syncWithGoogleSheets(), ProductoService.SYNC_INTERVAL);
  }

  async syncWithGoogleSheets() {
    try {
      console.log('Synchronizing with Google Sheets...');
      const productosData = await ProductoService.googleSheetReaderProducto.getData('Producto');
      const productosInstancias = productosData.map(pData => {
        const instancia = new Producto(
          pData.nombre,
          pData.estado,
          pData.fechaCreacion,
          pData.fechaActualizacion,
          pData.categoriaId,
          pData.categoriaNombre,
          pData.marcaId,
          pData.marcaNombre,
          pData.proveedorId,
          pData.proveedorNombre,
          pData.precio,
          pData.pvp,
          pData.cantidad,
          pData.descripcion,
          pData.imagen
        );
        instancia.id = pData.id;
        instancia.stock = pData.cantidad;
        return instancia;
      });
      await this.clearAll();
      for (const producto of productosInstancias) {
        await super.add(producto);
      }
      this.lastSyncTime = new Date();
      console.info(`Sync successful: ${productosInstancias.length} products at ${this.lastSyncTime}`);
      return true;
    } catch (error) {
      console.error('Sync error:', error);
      return false;
    }
  }

  async forceSyncNow() {
    this.lastSyncTime = null;
    return await this.syncWithGoogleSheets();
  }

  async agregarProducto(producto) {
    try {
      await this.forceSyncNow();
      const nombreValidado = await Validar.nombreBM(producto.nombre, this);
      if (!nombreValidado) return null;

      const categoriaValida = await this.categoriaService.obtenerCategoriaPorId(producto.categoriaId);
      const marcaValida = await this.marcaService.obtenerMarcaPorId(producto.marcaId);
      const proveedorValido = await this.proveedorService.obtenerProveedorPorId(producto.proveedorId);
      const precioValidado = Validar.precio(producto.precio);
      const pvpValidado = Validar.precio(producto.pvp);
      const cantidadValidada = Validar.cantidadStock(producto.cantidad);
      const descripcionValidada = Validar.descripcion(producto.descripcion);

      if (!categoriaValida || !marcaValida || !proveedorValido || !precioValidado || !pvpValidado || !cantidadValidada || !descripcionValidada) {
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
      nuevoProducto.stock = cantidadValidada;

      await super.add(nuevoProducto);
      await ProductoService.googleSheetSyncProducto.sync("create", nuevoProducto);
      await this.forceSyncNow();
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
      if (nombreValidado !== productoExistente.nombre) { productoExistente.nombre = nombreValidado; huboCambios = true; }
      if (categoriaValida.id !== productoExistente.categoriaId) { productoExistente.categoriaId = categoriaValida.id; productoExistente.categoriaNombre = categoriaValida.nombre; huboCambios = true; }
      if (marcaValida.id !== productoExistente.marcaId) { productoExistente.marcaId = marcaValida.id; productoExistente.marcaNombre = marcaValida.nombre; huboCambios = true; }
      if (proveedorValido.id !== productoExistente.proveedorId) { productoExistente.proveedorId = proveedorValido.id; productoExistente.proveedorNombre = proveedorValido.nombre; huboCambios = true; }
      if (precioValidado !== productoExistente.precio) { productoExistente.precio = precioValidado; huboCambios = true; }
      if (pvpValidado !== productoExistente.pvp) { productoExistente.pvp = pvpValidado; huboCambios = true; }
      if (cantidadValidada !== productoExistente.cantidad) { productoExistente.cantidad = cantidadValidada; productoExistente.stock = cantidadValidada; huboCambios = true; }
      if (descripcionValidada !== productoExistente.descripcion) { productoExistente.descripcion = descripcionValidada; huboCambios = true; }
      if (datosActualizados.imagen !== undefined && datosActualizados.imagen !== productoExistente.imagen) { productoExistente.imagen = datosActualizados.imagen; huboCambios = true; }
      if (datosActualizados.estado !== undefined && productoExistente.estado !== datosActualizados.estado) { productoExistente.estado = datosActualizados.estado; huboCambios = true; }

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
      await ProductoService.googleSheetSyncProducto.sync("delete", { id });
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
          case 'price-asc': productos.sort((a, b) => a.pvp - b.pvp); break;
          case 'price-desc': productos.sort((a, b) => b.pvp - a.pvp); break;
          case 'name-asc': productos.sort((a, b) => a.nombre.localeCompare(b.nombre)); break;
          case 'name-desc': productos.sort((a, b) => b.nombre.localeCompare(a.nombre)); break;
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
      if (!this.lastSyncTime || (new Date() - this.lastSyncTime) > ProductoService.SYNC_INTERVAL) {
        await this.syncWithGoogleSheets();
      }
      const productoData = await super.getById(id);
      if (productoData) {
        const producto = new Producto(
          productoData.nombre,
          productoData.estado,
          productoData.fechaCreacion,
          productoData.fechaActualizacion,
          productoData.categoriaId,
          productoData.categoriaNombre,
          productoData.marcaId,
          productoData.marcaNombre,
          productoData.proveedorId,
          productoData.proveedorNombre,
          productoData.precio,
          productoData.pvp,
          productoData.cantidad,
          productoData.descripcion,
          productoData.imagen
        );
        producto.id = productoData.id;
        producto.stock = productoData.cantidad;
        return producto;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      return null;
    }
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
        case 'categoria': dependencias = productos.filter(p => p.categoriaId === id); break;
        case 'marca': dependencias = productos.filter(p => p.marcaId === id); break;
        case 'proveedor': dependencias = productos.filter(p => p.proveedorId === id); break;
      }
      return { hasDependencies: dependencias.length > 0, count: dependencias.length, productos: dependencias };
    } catch (error) {
      console.error(`Error checking dependencies for ${tipo} ${id}:`, error);
      return null;
    }
  }
}

export { ProductoService };