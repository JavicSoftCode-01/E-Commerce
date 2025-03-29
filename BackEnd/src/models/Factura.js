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
}

export { Factura, DetalleFactura };