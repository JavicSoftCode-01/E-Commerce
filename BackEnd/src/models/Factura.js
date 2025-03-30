class DetalleFactura {
  constructor(productoId, nombre, precio, cantidad) {
    this.productoId = productoId;
    this.nombre = nombre;
    this.precio = precio;
    this.cantidad = cantidad;
    this.subtotal = this.precio * this.cantidad;
  }
}

class Factura {
  constructor(clienteId, detalles) {
    this.id = null; // Será asignado por FacturaService
    this.clienteId = clienteId;
    this.numeroFactura = null; // Será asignado usando InvoiceTemplate
    this.fecha = new Date().toISOString();

    this.detalles = detalles || [];
    this.total = 0;
    this.subtotal = 0;
    this.envio = 0;
    this.estado = 'pendiente';
    this.clienteNombre = '';
    this.clienteTelefono = '';
    this.clienteDireccion = '';
  }

  calcularTotalFactura() {
    return this.detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0);
  }

  static formatEcuadorDateTime(dateValue) {
    // Si no hay valor, retorna un placeholder
    if (!dateValue) {
      return 'N/A';
    }

    try {
      // Convierte a objeto Date (maneja strings ISO o timestamps)
      const dateObject = new Date(dateValue);

      // Verifica si la conversión resultó en una fecha válida
      if (isNaN(dateObject.getTime())) {
        return 'Fecha inválida';
      }

      // Opciones para el formateador Intl.DateTimeFormat
      const options = {
        timeZone: 'America/Guayaquil', // Zona horaria principal de Ecuador Continental (UTC-5)
        year: 'numeric',    // Ejemplo: 2024
        month: '2-digit',   // Ejemplo: 03 (para Marzo)
        day: '2-digit',     // Ejemplo: 29
        hour: '2-digit',    // Ejemplo: 06 (para 6 PM si hour12 es true)
        minute: '2-digit',  // Ejemplo: 52
        // second: '2-digit', // Descomenta si necesitas los segundos
        hour12: true        // Usar formato AM/PM (true) o 24 horas (false)
      };

      // Crea el formateador y formatea la fecha
      const formatter = new Intl.DateTimeFormat('es-EC', options); // 'es-EC' para formato Español Ecuador
      return formatter.format(dateObject);

    } catch (error) {
      console.error("Error formateando fecha:", dateValue, error);
      return 'Error formato'; // Placeholder en caso de error inesperado
    }
  }

}

export {Factura, DetalleFactura};