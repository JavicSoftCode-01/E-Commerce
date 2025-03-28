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
    constructor(clienteId, detalles = [], fecha = new Date()) {
        this.id = null; // Para IndexedDB
        this.cliente = clienteId;
        this.clienteNombre = ''; // Para mostrar en la factura
        this.detalles = detalles;
        this.fecha = fecha;
        this.estado = 'pendiente'; // Control de estado de la factura
        this.total = this.calcularTotalFactura();
    }

    calcularTotalFactura() {
        return this.detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0);
    }
}

export { Factura, DetalleFactura };