// BackEnd/src/models/Carrito.js
//  Ya no necesitamos DetalleFactura aquí, lo simplificamos.
// import { DetalleFactura } from './Factura.js';  <-  ELIMINAR

class Carrito {
    constructor() {
        this.items = [];
        this.total = 0;
    }

    agregarItemAlCarrito(producto, cantidad = 1) {
        const itemExistente = this.items.find(item => item.productoId === producto.id); //  Usar producto.id

        if (itemExistente) {
            itemExistente.cantidad += cantidad;
            itemExistente.subtotal = itemExistente.precio * itemExistente.cantidad; //  Usar precio del item
        } else {
            //  CREAR UNA COPIA de los datos relevantes del producto:
            const newItem = {
                productoId: producto.id,
                nombre: producto.nombre,
                precio: producto.pvp, //  Usar el precio de venta (pvp)
                cantidad: cantidad,
                subtotal: producto.pvp * cantidad,
            };
            this.items.push(newItem);
        }
        this.calcularTotalCarrito();
    }

    eliminarItemDelCarrito(productoId) {
        const initialLength = this.items.length;
        this.items = this.items.filter(item => item.productoId !== productoId);
        if (this.items.length < initialLength) {
            console.info(`Producto con ID ${productoId} eliminado del carrito.`);
        } else {
            console.warn(`Producto con ID ${productoId} no encontrado en el carrito.`);
        }
        this.calcularTotalCarrito();
    }

    vaciarCarrito() {
        this.items = [];
        this.total = 0;
        console.info('Carrito vaciado.');
    }

    calcularTotalCarrito() {
        this.total = this.items.reduce((sum, item) => sum + item.subtotal, 0);
        console.info(`Total del carrito: ${this.total}`);
        return this.total;
    }

    obtenerCantidadTotalItems() {
        const cantidad = this.items.reduce((sum, item) => sum + item.cantidad, 0);
        console.info(`Cantidad total de ítems en el carrito: ${cantidad}`);
        return cantidad;
    }
}

export { Carrito };