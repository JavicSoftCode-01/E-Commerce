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
      const categoriaValida = await this.categoriaService.obtenerCategoriaPorId(producto.categoriaId);
      const marcaValida = await this.marcaService.obtenerMarcaPorId(producto.marcaId);
      const proveedorValido = await this.proveedorService.obtenerProveedorPorId(producto.proveedorId);
      const precioValidado = Validar.precio(producto.precio);
      const pvpValidado = Validar.precio(producto.pvp);
      const cantidadValidada = Validar.cantidadStock(producto.cantidad);
      const descripcionValidada = Validar.descripcion(producto.descripcion);
      if (!nombreValidado || !categoriaValida || !marcaValida || !proveedorValido ||
        !precioValidado || !pvpValidado || !cantidadValidada || !descripcionValidada) {
        return null; // Alguna validación falló. Los mensajes ya se habrán mostrado.
      }
      // Actualiza el producto con los valores validos
      producto.nombre = nombreValidado;
      producto.categoriaNombre = categoriaValida.nombre;
      producto.marcaNombre = marcaValida.nombre;
      producto.proveedorNombre = proveedorValido.nombre;
      producto.precio = precioValidado;
      producto.pvp = pvpValidado;
      producto.cantidad = cantidadValidada;
      producto.stock = producto.cantidad; // Inicializa
      producto.descripcion = descripcionValidada;
      const id = await super.add(producto);
      console.info(`Producto agregado con ID: ${id}`);
      return id;
    } catch (error) {
      console.error('Error al agregar producto:', error);
      return null;
    }
  }

  /**
   * Actualiza un producto existente en la base de datos.
   * @param {number} id - ID del producto a actualizar.
   * @param {Producto} productoActualizado - Objeto producto con los datos actualizados.
   * @returns {Promise<number|null>} - El ID del producto actualizado o null si falla.
   */
  async actualizarProducto(id, productoActualizado) {
    try {
      const nombreValidado = await Validar.nombreBM(productoActualizado.nombre, this, id);
      const categoriaValida = await this.categoriaService.obtenerCategoriaPorId(productoActualizado.categoriaId);
      const marcaValida = await this.marcaService.obtenerMarcaPorId(productoActualizado.marcaId);
      const proveedorValido = await this.proveedorService.obtenerProveedorPorId(productoActualizado.proveedorId);
      const precioValidado = Validar.precio(productoActualizado.precio);
      const pvpValidado = Validar.precio(productoActualizado.pvp);
      const cantidadValidada = Validar.cantidadStock(productoActualizado.cantidad);
      const descripcionValidada = Validar.descripcion(productoActualizado.descripcion);
      //No se debe poder cambiar el stock directamente, se usa el metodo updateStock
      if (productoActualizado.hasOwnProperty('stock')) {
        console.warn('Advertencia: El stock no se puede actualizar directamente aquí. Utiliza la función para actualizar el Stock.');
        delete productoActualizado.stock;
      }
      if (!nombreValidado || !categoriaValida || !marcaValida || !proveedorValido ||
        !precioValidado || !pvpValidado || !cantidadValidada || !descripcionValidada) {
        return null; // Alguna validación falló. Los mensajes ya se habrán mostrado.
      }
      //Asigna datos validos
      productoActualizado.nombre = nombreValidado;
      productoActualizado.categoriaNombre = categoriaValida.nombre;
      productoActualizado.marcaNombre = marcaValida.nombre;
      productoActualizado.proveedorNombre = proveedorValido.nombre;
      productoActualizado.precio = precioValidado;
      productoActualizado.pvp = pvpValidado;
      productoActualizado.cantidad = cantidadValidada;
      productoActualizado.descripcion = descripcionValidada;
      const updatedId = await super.update(id, productoActualizado);
      console.info(`Producto con ID ${id} actualizado correctamente.`);
      return updatedId;
    } catch (error) {
      console.error(`Error al actualizar producto con ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Obtiene productos filtrados y ordenados.
   * @param {Object} [filtros={}] - Objeto con los filtros a aplicar.
   * @param {number} [filtros.categoria] - ID de la categoría para filtrar.
   * @param {number} [filtros.marca] - ID de la marca para filtrar.
   * @param {string} [filtros.search] - Texto de búsqueda.
   * @param {string} [filtros.sort] - Criterio de ordenamiento ('price-asc', 'price-desc', 'name-asc', 'name-desc').
   * @returns {Promise<Array<Producto>>} - Un array con los productos filtrados y ordenados, o un array vacío si falla.
   */
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
   * Obtiene un producto por su ID.
   * @param {number} id - ID del producto a obtener.
   * @returns {Promise<Producto|null>} - El producto encontrado o null si no se encuentra o falla.
   */
  async obtenerProductoPorId(id) {
    try {
      const producto = await super.getById(id);
      if (producto) {
        console.info(`Producto con ID ${id} obtenido:`, producto);
        return producto;
      } else {
        console.warn(`No se encontró ningún producto con ID ${id}.`);
        return null;
      }
    } catch (error) {
      console.error(`Error al obtener producto con ID ${id}:`, error);
      return null;
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
      const producto = await this.obtenerProductoPorId(productoId); //Obtener el producto
      if (!producto) {
        return null // Ya se registró un mensaje de advertencia.
      }
      const cantidadValidada = Validar.cantidadStock(cantidad); // Validar
      if (cantidadValidada === null) return null // Si hay error
      // Verifica que el stock no se vuelva negativo
      if (producto.stock + cantidadValidada < 0) { // Verifica si la operacion resulta en un stock negativo
        console.error("Error: No se puede reducir el stock por debajo de cero.");
        return null;
      }
      // Actualiza
      producto.stock += cantidadValidada; // Incrementa/Reduce el stock con la validación
      const updatedId = await super.update(productoId, producto);
      if (updatedId !== undefined) { // Comprobar si se actualizó
        console.info(`Stock del producto con ID ${productoId} actualizado. Nuevo stock: ${producto.stock}`);
        return true; // Éxito
      } else {
        console.error(`Error al actualizar el stock del producto con ID ${productoId}.`);
        return null;
      }
    } catch (error) {
      console.error("Error al actualizar el stock:", error);
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
      await super.delete(id);
      console.info(`Producto con ID ${id} eliminado correctamente.`);
    } catch (error) {
      console.error(`Error al eliminar Producto con ID ${id}:`, error);
      return null;
    }
  }
}

export {ProductoService};