// BackEnd/src/models/Factura.js

/**
 *  🔰🔰Clase que representa el detalle de una factura de venta (un ítem de la factura).🔰🔰
 */
class DetalleFactura {

  /**
   * Crea una instancia de DetalleFactura.
   * @param {Producto} producto - El producto.
   * @param {number} cantidad - Cantidad del producto.
   */
  constructor(producto, cantidad) {
    this.producto = producto;
    this.cantidad = cantidad;
    this.precio = producto.pvp;  // Precio de venta del producto.
    this.subtotal = this.precio * this.cantidad;
  }
}


/**
 * 🔰🔰Clase que representa una factura de venta.🔰🔰
 */
class Factura   {

  /**
   * Crea una instancia de Factura.
   * @param {number} clienteId - ID del cliente.
   * @param {Array<DetalleFactura>} [detalles=[]] - Array de objetos DetalleFactura (los ítems de la factura).
   * @param {Date} [fecha=new Date()] - Fecha de la factura.
   */
  constructor(clienteId, detalles = [], fecha = new Date()) {
    this.id = null; // Se asigna al guardar.
    this.cliente = clienteId;
    this.detalles = detalles;
    this.fecha = fecha;
    this.total = this.calcularTotalFactura();  // Calcular al crear la factura
  }

  /**
   * Calcula el total de la factura sumando los subtotales de cada detalle (ítem).
   * @returns {number} Total de la factura.
   */
  calcularTotalFactura() {
    const total = this.detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0);
    console.info(`Total de la factura recalculado: ${total}`);
    return total;
  }
}

export {Factura, DetalleFactura};