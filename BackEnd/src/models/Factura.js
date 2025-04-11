
class DetalleFactura {
  constructor(productoId, nombre, precio, cantidad, imagen = '') {
    this.productoId = productoId;
    this.nombre = nombre;
    this.precio = parseFloat(precio) || 0;
    this.cantidad = parseInt(cantidad, 10) || 0;
    this.imagen = imagen; // Añadir imagen como propiedad
    this.subtotal = this.calcularSubtotal();
  }

  calcularSubtotal() {
    return this.precio * this.cantidad;
  }
}

class Factura {
  constructor(clienteId, detalles) {
    this.id = null;
    this.clienteId = clienteId;
    this.numeroFactura = null;
    this.fecha = new Date().toISOString();
    this.detalles = detalles || [];
    this.total = 0;
    this.subtotal = 0;
    this.envio = 0;
    this.estado = 'pendiente';
    this.clienteNombre = '';
    this.clienteTelefono = '';
    this.clienteDireccion = '';
    this.fechaActualizacion = this.fecha;
    this.calcularTotales();
  }

  calcularTotales() {
    this.subtotal = this.detalles.reduce((sum, detalle) => sum + detalle.calcularSubtotal(), 0);
    this.total = this.subtotal + this.envio;
  }

  static formatEcuadorDateTime(dateValue) {
    if (!dateValue) return 'N/A';
    try {
      const dateObject = new Date(dateValue);
      if (isNaN(dateObject.getTime())) return 'Fecha inválida';
      const options = {
        timeZone: 'America/Guayaquil',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      return new Intl.DateTimeFormat('es-EC', options).format(dateObject);
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Error formato';
    }
  }
}

export { Factura, DetalleFactura };