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
      // Validaciones iniciales
      if (!productoActualizado.categoriaId || !productoActualizado.marcaId || !productoActualizado.proveedorId) {
        console.error("Error: categoriaId, marcaId o proveedorId son nulos o no definidos.", productoActualizado);
        return null;
      }
      const nombreValidado = await Validar.nombreBM(productoActualizado.nombre, this, id);
      const categoriaValida = await this.categoriaService.obtenerCategoriaPorId(productoActualizado.categoriaId);
      const marcaValida = await this.marcaService.obtenerMarcaPorId(productoActualizado.marcaId);
      const proveedorValido = await this.proveedorService.obtenerProveedorPorId(productoActualizado.proveedorId);
      const precioValidado = Validar.precio(productoActualizado.precio);
      const pvpValidado = Validar.precio(productoActualizado.pvp);
      // Se corrigió la validación: ahora se usa stock para validar cantidad
      const cantidadValidada = Validar.cantidadStock(productoActualizado.stock);
      const descripcionValidada = Validar.descripcion(productoActualizado.descripcion);
  
      // Comprobación de todas las validaciones
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
  
      // Asigna datos validados
      productoActualizado.nombre = nombreValidado;
      productoActualizado.categoriaId = categoriaValida.id;
      productoActualizado.categoriaNombre = categoriaValida.nombre;
      productoActualizado.marcaId = marcaValida.id;
      productoActualizado.marcaNombre = marcaValida.nombre;
      productoActualizado.proveedorId = proveedorValido.id;
      productoActualizado.proveedorNombre = proveedorValido.nombre;
      productoActualizado.precio = precioValidado;
      productoActualizado.pvp = pvpValidado;
      productoActualizado.stock = cantidadValidada;
      productoActualizado.descripcion = descripcionValidada;
  
      // Reconstruir el objeto Producto respetando el orden del constructor:
      const nuevoProducto = new Producto(
        nombreValidado,                         // nombre
        productoActualizado.estado,             // estado (mantiene el actual)
        productoActualizado.fechaCreacion,      // fechaCreacion (se conserva)
        new Date(),                             // fechaActualizacion (actualizada)
        categoriaValida.id,                     // categoriaId
        categoriaValida.nombre,                 // categoriaNombre
        marcaValida.id,                         // marcaId
        marcaValida.nombre,                     // marcaNombre
        proveedorValido.id,                     // proveedorId
        proveedorValido.nombre,                 // proveedorNombre
        precioValidado,                         // precio
        pvpValidado,                            // pvp
        cantidadValidada,                       // cantidad
        descripcionValidada,                    // descripcion
        productoActualizado.imagen              // imagen
      );
  
      nuevoProducto.id = id;
      const updatedId = await super.update(id, nuevoProducto);
  
      // Sincronizar el carrito inmediatamente después de la actualización, si aplica
      if (window.app && window.app.carritoController) {
        await window.app.carritoController.sincronizarCarrito();
      }
  
      console.info(`Producto con ID ${id} actualizado correctamente.`);
      return updatedId;
  
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