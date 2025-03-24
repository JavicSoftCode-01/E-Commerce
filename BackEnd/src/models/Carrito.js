// BackEnd/src/models/Carrito.js
import {DetalleFactura} from './Factura.js';

/**
 * 🔰🔰Clase que representa un carrito de compras.🔰🔰
 */
class Carrito {
  constructor() {
    this.items = [];
    this.total = 0;
  }

  /**
   * Agrega un ítem (producto y cantidad) al carrito.
   * Si el producto ya existe, incrementa la cantidad.  Si no, lo añade como nuevo.
   * @param {Producto} producto - El producto a agregar (instancia de la clase Producto).
   * @param {number} [cantidad=1] - Cantidad a agregar.
   */
  agregarItemAlCarrito(producto, cantidad = 1) {
    const itemExistente = this.items.find(item => item.producto.id === producto.id);
    if (itemExistente) {
      itemExistente.cantidad += cantidad;
      itemExistente.subtotal = itemExistente.precio * itemExistente.cantidad;
      console.info(`Cantidad de producto con ID ${producto.id} incrementada en el carrito.`);
    } else {
      // Usamos DetalleFactura para mantener consistencia con Factura.
      this.items.push(new DetalleFactura(producto, cantidad));
      console.info(`Nuevo producto con ID ${producto.id} agregado al carrito.`);
    }
    this.calcularTotalCarrito(); // Más descriptivo
  }

  /**
   * Elimina un ítem (producto) del carrito por su ID.
   * @param {number} productoId - ID del producto a eliminar.
   */
  eliminarItemDelCarrito(productoId) {
    const initialLength = this.items.length;
    this.items = this.items.filter(item => item.producto.id !== productoId);
    if (this.items.length < initialLength) {
      console.info(`Producto con ID ${productoId} eliminado del carrito.`);
    } else {
      console.warn(`Producto con ID ${productoId} no encontrado en el carrito.  No se eliminó ningún ítem.`);
    }
    this.calcularTotalCarrito(); // Recalcular después de eliminar
  }

  /**
   * Vacía completamente el carrito, eliminando todos los ítems.
   */
  vaciarCarrito() {
    if (this.items.length > 0) {
      this.items = [];
      this.total = 0;
      console.info('Carrito vaciado.');
    } else {
      console.info('El carrito ya está vacío.');
    }
  }

  /**
   * Calcula el total del carrito sumando los subtotales de todos los ítems.
   * @returns {number} El total del carrito.
   */
  calcularTotalCarrito() {
    this.total = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    console.info(`Total del carrito recalculado: ${this.total}`);
    return this.total;
  }

  /**
   * Obtiene la cantidad total de ítems (unidades, no productos distintos) en el carrito.
   * @returns {number} Cantidad total de ítems.
   */
  obtenerCantidadTotalItems() {
    const cantidad = this.items.reduce((sum, item) => sum + item.cantidad, 0);
    console.info(`Cantidad total de ítems en el carrito: ${cantidad}`);
    return cantidad;
  }
}

export {Carrito};