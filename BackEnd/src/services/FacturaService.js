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

    async generarFactura(clienteId, carrito) {
        try {
            const cliente = await this.clienteService.obtenerClientePorId(clienteId);
            if (!cliente) {
                console.warn(`No se encontró un cliente con ID ${clienteId}.`);
                return null;
            }

            // 1. Verificar el stock *antes* de hacer cualquier otra cosa.
            for (const item of carrito.items) {
                const producto = await this.productoService.obtenerProductoPorId(item.productoId);
                if (!producto || producto.stock < item.cantidad) {
                    console.error(`No hay suficiente stock para ${producto ? producto.nombre : 'un producto'}. Stock actual: ${producto ? producto.stock : 'N/A'}, Cantidad requerida: ${item.cantidad}`);
                    return null; //  ¡Importante! Salir si no hay stock.
                }
            }


            const detallesFactura = [];
            for (const item of carrito.items) {
                //  2.  *Ahora* reducir el stock, DESPUÉS de la verificación.
                const resultadoActualizacion = await this.productoService.actualizarStock(item.productoId, -item.cantidad);
                if (!resultadoActualizacion) {
                    console.error('Error al actualizar el stock.');
                    return null;
                }

                //  3.  Crear DetalleFactura con la información *copiada* del carrito.

                detallesFactura.push(new DetalleFactura(item.productoId, item.nombre, item.precio, item.cantidad));
            }

            const factura = new Factura(clienteId, detallesFactura);
            factura.id = await this.idGeneratorService.getLastId('Factura');
            factura.id++;
            await this.idGeneratorService.setLastId('Factura', factura.id);

            const idFactura = await this.add(factura);
            if (!idFactura) {
                console.error('Error al agregar la factura.');
                return null;
            }
            console.info(`Factura generada con ID: ${idFactura}:`, factura);
            return factura;

        } catch (error) {
            console.error("Error al generar la factura:", error);
            return null;
        }
    }
    // ... (resto de FacturaService: obtenerFacturas, obtenerFacturaPorId - sin cambios)
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