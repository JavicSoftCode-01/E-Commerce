// BackEnd/src/models/Factura.js
//  Modificar DetalleFactura para que funcione con la nueva estructura del Carrito:

class DetalleFactura {
    constructor(productoId, nombre, precio, cantidad) {
        this.productoId = productoId; //  Guardar solo el ID
        this.nombre = nombre;
        this.precio = precio;
        this.cantidad = cantidad;
        this.subtotal = this.precio * this.cantidad;
    }
}

class Factura {
    constructor(clienteId, detalles = [], fecha = new Date()) {
        this.cliente = clienteId;
        this.detalles = detalles;
        this.fecha = fecha;
        this.total = this.calcularTotalFactura();
    }

    calcularTotalFactura() {
        return this.detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0);
    }
}
export { Factura, DetalleFactura };