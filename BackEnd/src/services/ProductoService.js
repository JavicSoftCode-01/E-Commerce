// BackEnd/src/services/ProductoService.js
import {IndexedDB} from '../database/indexdDB.js';
import {Validar} from '../utils/validar.js';
import {Producto} from '../models/Producto.js';

/**
 * 🔰🔰Servicio para la gestión de productos.
 *  Extiende de IndexedDB para interactuar con la base de datos.🔰🔰
 */
class ProductoService extends IndexedDB {
  /**
   * Constructor del servicio de Producto.
   * @param {CategoriaService} categoriaService - Instancia del servicio de Categoría.
   * @param {MarcaService} marcaService - Instancia del servicio de Marca.
   * @param {ProveedorService} proveedorService - Instancia del servicio de Proveedor.
   */
  constructor(categoriaService, marcaService, proveedorService) {
    super('mydb', 'productos');
    this.categoriaService = categoriaService;
    this.marcaService = marcaService;
    this.proveedorService = proveedorService;
  }

  /**
   * Agrega un nuevo producto a la base de datos.
   * @param {Producto} producto - Objeto producto a agregar.
   * @returns {Promise<number|null>} - El ID del producto agregado o null si falla.
   */
  async agregarProducto(producto) {
    try {
      // Validaciones
      const nombreValidado = await Validar.nombreBM(producto.nombre, this);
  
      if (!producto.categoriaId || !producto.marcaId || !producto.proveedorId) {
        console.error("Error: categoriaId, marcaId o proveedorId son nulos o no definidos.", producto);
        return null;
      }
  
      const categoriaValida = await this.categoriaService.obtenerCategoriaPorId(producto.categoriaId);
      const marcaValida = await this.marcaService.obtenerMarcaPorId(producto.marcaId);
      const proveedorValido = await this.proveedorService.obtenerProveedorPorId(producto.proveedorId);
      const precioValidado = Validar.precio(producto.precio);
      const pvpValidado = Validar.precio(producto.pvp);
      const cantidadValidada = Validar.cantidadStock(producto.cantidad);
      const descripcionValidada = Validar.descripcion(producto.descripcion);
  
      if (!nombreValidado || !categoriaValida || !marcaValida || !proveedorValido ||
          !precioValidado || !pvpValidado || !cantidadValidada || !descripcionValidada) {
        console.error("Error: Alguna validación falló.", {
          nombreValidado,
          categoriaValida,
          marcaValida,
          proveedorValido,
          precioValidado,
          pvpValidado,
          cantidadValidada,
          descripcionValidada
        });
        return null;
      }
  
      // Obtener el último ID y generar el siguiente
      const productos = await this.obtenerProductos();
      const lastId = productos.length > 0 ? Math.max(...productos.map(p => p.id)) : 0;
      const nextId = lastId + 1;
  
      // Crear nueva instancia del producto con ID usando el orden correcto
      const nuevoProducto = new Producto(
        nombreValidado,          // nombre
        true,                    // estado
        new Date(),              // fechaCreacion
        new Date(),              // fechaActualizacion
        categoriaValida.id,      // categoriaId
        categoriaValida.nombre,  // categoriaNombre
        marcaValida.id,          // marcaId
        marcaValida.nombre,      // marcaNombre
        proveedorValido.id,      // proveedorId
        proveedorValido.nombre,  // proveedorNombre
        precioValidado,          // precio
        pvpValidado,             // pvp
        cantidadValidada,        // cantidad
        descripcionValidada,     // descripcion
        producto.imagen          // imagen
      );
  
      // Asignar el ID antes de guardar
      nuevoProducto.id = nextId;
  
      // Guardar el producto
      await super.add(nuevoProducto);
      console.info(`Producto agregado con ID: ${nextId}`);
      return nextId;
  
    } catch (error) {
      console.error('Error al agregar producto:', error);
      return null;
    }
  }
  
  async actualizarProducto(id, productoActualizado) {
    try {
      // 1. Obtener la instancia actual del producto desde la BD
      const productoExistente = await this.obtenerProductoPorId(id);
      if (!productoExistente) {
        console.warn(`Producto con ID ${id} no encontrado.`);
        return null;
      }
      
      // 2. Validar y obtener valores, usando los enviados o los actuales si no se modifican
  
      // Validar o conservar el nombre
      let nombreValidado;
      if (productoActualizado.nombre !== undefined) {
        nombreValidado = await Validar.nombreBM(productoActualizado.nombre, this, id);
        if (!nombreValidado) return null;
      } else {
        nombreValidado = productoExistente.nombre;
      }
  
      // Para campos foráneos: si se envían se buscan, si no se usan los actuales
      let categoriaValida;
      if (productoActualizado.categoriaId !== undefined) {
        categoriaValida = await this.categoriaService.obtenerCategoriaPorId(productoActualizado.categoriaId);
        if (!categoriaValida) return null;
      } else {
        categoriaValida = await this.categoriaService.obtenerCategoriaPorId(productoExistente.categoriaId);
      }
  
      let marcaValida;
      if (productoActualizado.marcaId !== undefined) {
        marcaValida = await this.marcaService.obtenerMarcaPorId(productoActualizado.marcaId);
        if (!marcaValida) return null;
      } else {
        marcaValida = await this.marcaService.obtenerMarcaPorId(productoExistente.marcaId);
      }
  
      let proveedorValido;
      if (productoActualizado.proveedorId !== undefined) {
        proveedorValido = await this.proveedorService.obtenerProveedorPorId(productoActualizado.proveedorId);
        if (!proveedorValido) return null;
      } else {
        proveedorValido = await this.proveedorService.obtenerProveedorPorId(productoExistente.proveedorId);
      }
  
      // Validar o conservar el precio
      let precioValidado;
      if (productoActualizado.precio !== undefined) {
        precioValidado = Validar.precio(productoActualizado.precio);
        if (!precioValidado) return null;
      } else {
        precioValidado = productoExistente.precio;
      }
  
      // Validar o conservar el pvp
      let pvpValidado;
      if (productoActualizado.pvp !== undefined) {
        pvpValidado = Validar.precio(productoActualizado.pvp);
        if (!pvpValidado) return null;
      } else {
        pvpValidado = productoExistente.pvp;
      }
  
      // Validar o conservar el stock
      let cantidadValidada;
      if (productoActualizado.stock !== undefined) {
        cantidadValidada = Validar.cantidadStock(productoActualizado.stock);
        if (!cantidadValidada) return null;
      } else {
        cantidadValidada = productoExistente.stock;
      }
  
      // Validar o conservar la descripción
      let descripcionValidada;
      if (productoActualizado.descripcion !== undefined) {
        descripcionValidada = Validar.descripcion(productoActualizado.descripcion);
        if (!descripcionValidada) return null;
      } else {
        descripcionValidada = productoExistente.descripcion;
      }
      
      // 3. Comparar campo por campo para detectar cambios
      let huboCambios = false;
  
      // Estado (por ejemplo, el toggle)
      if (productoActualizado.estado !== undefined && productoExistente.estado !== productoActualizado.estado) {
        productoExistente.estado = productoActualizado.estado;
        huboCambios = true;
      }
  
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
      if (cantidadValidada !== productoExistente.stock) {
        productoExistente.stock = cantidadValidada;
        huboCambios = true;
      }
      if (descripcionValidada !== productoExistente.descripcion) {
        productoExistente.descripcion = descripcionValidada;
        huboCambios = true;
      }
      // Actualizar la imagen solo si se envía y es diferente
      if (productoActualizado.imagen !== undefined && productoActualizado.imagen !== productoExistente.imagen) {
        productoExistente.imagen = productoActualizado.imagen;
        huboCambios = true;
      }
  
      // 4. Si hubo cambios, actualizar el timestamp y guardar en la BD
      if (huboCambios) {
        productoExistente.prepareForUpdate();
        const updatedId = await super.update(id, productoExistente);
        console.info(`Producto con ID ${id} actualizado correctamente.`);
        // Sincroniza el carrito si es necesario
        if (window.app && window.app.carritoController) {
          await window.app.carritoController.sincronizarCarrito();
        }
        return updatedId;
      } else {
        console.info(`Producto con ID ${id} no tuvo cambios detectados.`);
        return id;
      }
      
    } catch (error) {
      console.error(`Error al actualizar producto con ID ${id}:`, error);
      return null;
    }
  }
  

  async obtenerProductoPorId(id) {
    try {
      const productoData = await super.getById(id); // Obtiene datos crudos de IndexedDB
  
      if (productoData) {
        // Crear una NUEVA INSTANCIA de Producto usando los datos recuperados.
        const instanciaProducto = new Producto(
          productoData.nombre,
          productoData.estado,             // Para BaseModel e iconTrueFalse
          productoData.fechaCreacion,      // Para BaseModel
          productoData.fechaActualizacion, // Para BaseModel
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
        instanciaProducto.id = productoData.id; // Asignar el ID a la instancia
        // Si deseas conservar el stock actual en lugar de derivarlo de cantidad:
        instanciaProducto.stock = productoData.stock;
  
        return instanciaProducto; // Devuelve la instancia correctamente configurada
      } else {
        console.warn(`No se encontró ningún producto con ID ${id}.`);
        return null;
      }
    } catch (error) {
      console.error(`Error al obtener producto con ID ${id}:`, error);
      return null;
    }
  }
  

  async obtenerProductos(filtros = {}) {
    try {
      let productos = await super.getAll();
      // Filtro por categoría (usando el ID)
      if (filtros.categoria) {
        productos = productos.filter(producto => producto.categoriaId === filtros.categoria);
      }
      // Filtro por marca (usando el ID)
      if (filtros.marca) {
        productos = productos.filter(producto => producto.marcaId === filtros.marca);
      }
      // Filtro por texto
      if (filtros.search) {
        const busqueda = filtros.search.toLowerCase();
        productos = productos.filter(producto =>
          producto.nombre.toLowerCase().includes(busqueda) ||
          (producto.descripcion && producto.descripcion.toLowerCase().includes(busqueda))
        );
      }
      // Ordenamiento
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
      console.info('Productos obtenidos:', productos);
      return productos;
    } catch (error) {
      console.error('Error al obtener productos:', error);
      return []; // Devuelve un array vacío
    }
  }


  /**
   * Actualiza el stock de un producto, ya sea por venta o reposición.
   * @param {number} productoId - ID del producto a actualizar.
   * @param {number} cantidad - Cantidad a sumar o restar del stock (puede ser negativo para una venta).
   * @returns {Promise<boolean>} -  True si fue exitoso o null si ocurrio un error.
   */
  async actualizarStock(productoId, cantidad) {
    try {
      const producto = await this.obtenerProductoPorId(productoId);
      if (!producto) {
        console.error(`No se encontró el producto con ID ${productoId}`);
        return null;
      }

      // Si es una venta (cantidad negativa), validar que haya suficiente stock
      if (cantidad < 0 && Math.abs(cantidad) > producto.stock) {
        console.error(`Stock insuficiente. Stock actual: ${producto.stock}, Cantidad solicitada: ${Math.abs(cantidad)}`);
        return null;
      }

      // Actualizar el stock
      producto.stock += cantidad; // Si cantidad es negativa, restará del stock

      // Validar que el stock no sea negativo después de la operación
      if (producto.stock < 0) {
        console.error("El stock no puede ser negativo");
        return null;
      }

      const actualizado = await super.update(productoId, producto);
      if (actualizado) {
        console.info(`Stock actualizado para producto ${productoId}. Nuevo stock: ${producto.stock}`);
        return true;
      }
      return null;

    } catch (error) {
      console.error("Error al actualizar el stock:", error);
      return null;
    }
  }

  // Primero, agreguemos un método al ProductoService para verificar dependencias

// En ProductoService.js, añade esta función:
async verificarDependencias(tipo, id) {
  try {
    const productos = await this.obtenerProductos();
    let dependencias = [];
    
    switch(tipo) {
      case 'categoria':
        dependencias = productos.filter(producto => producto.categoriaId === id);
        break;
      case 'marca':
        dependencias = productos.filter(producto => producto.marcaId === id);
        break;
      case 'proveedor':
        dependencias = productos.filter(producto => producto.proveedorId === id);
        break;
      default:
        console.error(`Tipo de dependencia desconocido: ${tipo}`);
        return null;
    }
    
    return {
      hasDependencies: dependencias.length > 0,
      count: dependencias.length,
      productos: dependencias
    };
  } catch (error) {
    console.error(`Error al verificar dependencias de ${tipo} con ID ${id}:`, error);
    return null;
  }
}

  /**
   * Elimina un producto por su ID.
   * @param {number} id - ID del producto a eliminar.
   * @returns {Promise<void>} - Devuelve void si fue eliminado con exito, o null si falla la eliminación..
   */
  async eliminarProducto(id) {
    try {
      console.info(`Producto con ID ${id} eliminado correctamente.`);
      await super.delete(id);
    } catch (error) {
      console.error(`Error al eliminar Producto con ID ${id}:`, error);
      return null;
    }
  }
}

export {ProductoService};