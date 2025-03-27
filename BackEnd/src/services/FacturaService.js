// BackEnd/src/services/FacturaService.js
import { IndexedDB } from '../database/indexdDB.js';
import { Factura, DetalleFactura } from '../models/Factura.js'; //  ¡Importante!

class FacturaService extends IndexedDB {
    constructor(productoService, clienteService, idGeneratorService) {
        super('mydb', 'facturas');
        this.productoService = productoService;
        this.clienteService = clienteService;
        this.idGeneratorService = idGeneratorService;
    }

async generarFactura(cliente, carrito) {
    try {
        console.log('Cliente recibido en generarFactura:', cliente); // Debug

        // Validar cliente
        if (!cliente || !cliente.id) {
            console.error('Cliente inválido:', cliente);
            throw new Error('Cliente no válido');
        }

        // Validar carrito
        if (!carrito || !carrito.items || carrito.items.length === 0) {
            throw new Error('Carrito vacío');
        }

        // Verificar stock antes de procesar
        for (const item of carrito.items) {
            const producto = await this.productoService.obtenerProductoPorId(item.productoId);
            if (!producto) {
                throw new Error(`Producto ${item.productoId} no encontrado`);
            }
            if (producto.stock < item.cantidad) {
                throw new Error(`Stock insuficiente para ${producto.nombre}`);
            }
        }

        // Crear detalles y actualizar stock
        const detalles = [];
        for (const item of carrito.items) {
            const stockActualizado = await this.productoService.actualizarStock(
                item.productoId,
                -item.cantidad
            );

            if (!stockActualizado) {
                throw new Error(`Error al actualizar stock del producto ${item.productoId}`);
            }

            detalles.push(new DetalleFactura(
                item.productoId,
                item.nombre,
                item.precio,
                item.cantidad
            ));
        }

        // Crear y guardar la factura
        const factura = new Factura(cliente.id, detalles);
        const idFactura = await this.add(factura);

        if (!idFactura) {
            throw new Error('Error al guardar la factura');
        }

        console.log('Factura generada exitosamente:', factura); // Debug
        return factura;

    } catch (error) {
        console.error('Error en generarFactura:', error);
        throw error;
    }
}
    async obtenerFacturas() {
        try {
            const facturas = await super.getAll();
            console.info('Facturas obtenidas:', facturas);
            return facturas;
        } catch (error) {
            console.error('Error al obtener facturas:', error);
            return []; // Devuelve un array vacío en caso de error.
        }
    }

    /**
     * Obtiene una factura por su ID.
     * @param {number} id - ID de la factura a obtener.
     * @returns {Promise<Factura|null>} - La factura encontrada o null si no se encuentra.
     */
    async obtenerFacturaPorId(id) {
        try {
            const factura = await super.getById(id); // Utiliza el método getById
            if (factura) {
                console.info(`Factura con ID ${id} obtenida:`, factura);
                return factura;
            } else {
                console.warn(`No se encontró ninguna factura con ID ${id}.`);
                return null; // Retorna null si no se encuentra la factura.
            }
        } catch (error) {
            console.error(`Error al obtener factura con ID ${id}:`, error);
            return null;
        }
    }
}
export { FacturaService };