// BackEnd/src/services/FacturaService.js
import { IndexedDB } from '../database/indexdDB.js';
import { InvoiceTemplate } from '../../../FrontEnd/public/ui/controllers/InvoicePlantilla.js';
import { Factura, DetalleFactura } from '../models/Factura.js'; //  ¡Importante!

class FacturaService extends IndexedDB {
    constructor(productoService, clienteService, idGeneratorService) {
        super('mydb', 'facturas');
        this.productoService = productoService;
        this.clienteService = clienteService;
        this.idGeneratorService = idGeneratorService;
    }

    async generarFactura(cliente, carrito, facturaTemp) {
        try {
            console.log('Cliente recibido en generarFactura:', cliente);

            // 1. Validaciones iniciales
            if (!cliente || !cliente.id) {
                console.error('Cliente inválido:', cliente);
                throw new Error('Cliente no válido');
            }

            if (!carrito || !carrito.items || carrito.items.length === 0) {
                throw new Error('Carrito vacío');
            }

            // 2. Verificar stock antes de procesar
            for (const item of carrito.items) {
                const producto = await this.productoService.obtenerProductoPorId(item.productoId);
                if (!producto) {
                    throw new Error(`Producto ${item.productoId} no encontrado`);
                }
                if (producto.stock < item.cantidad) {
                    throw new Error(`Stock insuficiente para ${producto.nombre}`);
                }
            }

            // 3. Generar ID para la nueva factura
            // Generar ID para la nueva factura
            const facturas = await this.getAll();
            const lastId = facturas.length > 0
                ? Math.max(...facturas.map(f => f.id))
                : 0;
            const nextId = lastId + 1;

            // Crear detalles
            const detalles = [];
            for (const item of carrito.items) {
                // Verificar stock
                const producto = await this.productoService.obtenerProductoPorId(item.productoId);
                if (!producto || producto.stock < item.cantidad) {
                    throw new Error(`Stock insuficiente para ${producto?.nombre || item.productoId}`);
                }

                // Actualizar stock
                await this.productoService.actualizarStock(item.productoId, -item.cantidad);

                // Crear detalle
                const detalle = {
                    productoId: item.productoId,
                    nombre: item.nombre,
                    precio: item.precio,
                    cantidad: item.cantidad,
                    imagen: item.imagen
                };
                detalles.push(detalle);
            }

            // Generar número de factura
            const numeroFactura = await InvoiceTemplate.generarNumeroFactura();

            // Crear y configurar la factura
            const factura = {
                id: nextId,
                numeroFactura: facturaTemp.numeroFactura,
                fecha: facturaTemp.fecha.toISOString(),
                hora: facturaTemp.hora,
                clienteId: cliente.id,
                clienteNombre: cliente.nombre,
                clienteTelefono: cliente.telefono,
                clienteDireccion: cliente.direccion,
                detalles: detalles,
                subtotal: carrito.calcularTotalCarrito(),
                envio: 0,
                total: carrito.calcularTotalCarrito(),
                estado: 'completada'
            };
    
            await super.add(factura);
            return factura;

        } catch (error) {
            console.error('Error en generarFactura:', error);
            // Intentar revertir los cambios de stock en caso de error
            try {
                for (const item of carrito.items) {
                    await this.productoService.actualizarStock(item.productoId, item.cantidad);
                }
            } catch (rollbackError) {
                console.error('Error al revertir cambios de stock:', rollbackError);
            }
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