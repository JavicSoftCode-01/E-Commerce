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
            const facturas = await this.getAll();
            const lastId = facturas.length > 0 
                ? Math.max(...facturas.map(f => f.id))
                : 0;
            const nextId = lastId + 1;
    
            // 4. Crear detalles y actualizar stock
            const detalles = [];
            for (const item of carrito.items) {
                const stockActualizado = await this.productoService.actualizarStock(
                    item.productoId,
                    -item.cantidad
                );
    
                if (!stockActualizado) {
                    throw new Error(`Error al actualizar stock del producto ${item.productoId}`);
                }
    
                const detalle = new DetalleFactura(
                    item.productoId,
                    item.nombre,
                    item.precio,
                    item.cantidad
                );
                
                // Agregar imagen si existe
                if (item.imagen) {
                    detalle.imagen = item.imagen;
                }
    
                detalles.push(detalle);
            }
    
            // 5. Crear factura con todos los datos necesarios
            const factura = new Factura(cliente.id, detalles);
            factura.id = nextId;
            factura.fecha = new Date().toISOString();
            factura.total = carrito.calcularTotalCarrito();
            factura.clienteNombre = cliente.nombre;
            factura.estado = 'completada';
    
            // 6. Guardar la factura
            await super.add(factura);
    
            console.log('Factura generada exitosamente:', factura);
            return factura;
    
        } catch (error) {
            console.error('Error en generarFactura:', error);
            // Aquí podrías implementar un rollback del stock si algo falla
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