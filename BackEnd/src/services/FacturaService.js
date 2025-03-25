// BackEnd/src/services/FacturaService.js
import {IndexedDB} from '../database/indexdDB.js';
import {Factura, DetalleFactura} from '../models/Factura.js';

/**
 * 🔰🔰Servicio para la gestión de facturas.
 *  Extiende de IndexedDB para interactuar con la base de datos.🔰🔰
 */
class FacturaService extends IndexedDB {
  /**
   * Constructor del servicio de Factura.
   * @param {ProductoService} productoService - Instancia del servicio de Producto.
   * @param {ClienteService} clienteService - Instancia del servicio de Cliente.
   * @param {IdGenerator} idGeneratorService - Instancia del servicio IdGenerator.
   */
  constructor(productoService, clienteService, idGeneratorService) {
    super('mydb', 'facturas');
    this.productoService = productoService;
    this.clienteService = clienteService;
    this.idGeneratorService = idGeneratorService;
  }

  /**
   * Genera una nueva factura en la base de datos.
   * @param {number} clienteId - ID del cliente asociado a la factura.
   * @param {Carrito} carrito - Carrito de compras con los productos a facturar.
   * @returns {Promise<Factura|null>} - La factura generada o null si falla.
   */
  // async generarFactura(clienteId, carrito) {
  //   try {
  //     const cliente = await this.clienteService.obtenerClientePorId(clienteId);
  //     if (!cliente) {
  //       console.warn(`No se encontró un cliente con ID ${clienteId}.`);
  //       return null;
  //     }
  //     // Verificar stock de todos los productos *antes* de actualizar nada.
  //     for (const item of carrito.items) {
  //       const producto = await this.productoService.obtenerProductoPorId(item.producto.id);
  //       if (!producto || producto.stock < item.cantidad) {
  //         console.error(`No hay suficiente stock para ${producto ? producto.nombre : 'un producto'}. Stock actual: ${producto ? producto.stock : 'N/A'}, Cantidad requerida: ${item.cantidad}`);
  //         return null;
  //       }
  //     }
  //     // Actualizar stock y crear detalles de factura *después* de verificar.
  //     const detallesFactura = [];
  //     for (const item of carrito.items) {
  //       const resultadoActualizacion = await this.productoService.actualizarStock(item.producto.id, item.cantidad);
  //       if (!resultadoActualizacion) { // Si actualizarStock Devuelve false
  //         console.error(`Error: No se pudo actualizar el stock correctamente.`);
  //         return null; //  No se continua el proceso.
  //       }
  //       const productoActualizado = await this.productoService.obtenerProductoPorId(item.producto.id);
  //       detallesFactura.push(new DetalleFactura(productoActualizado, item.cantidad));
  //     }
  //     // Crear y guardar la factura
  //     const factura = new Factura(clienteId, detallesFactura);
  //     factura.id = await Model.generateId('Factura', this.idGeneratorService);
  //     const idFactura = await this.add(factura); // Guarda la factura
  //     if (!idFactura) {
  //       console.error(`Error: No se pudo agregar correctamente la factura a la base de datos.`);
  //       return null
  //     }
  //     console.info(`Factura generada con ID: ${idFactura}:`, factura);
  //     return factura;
  //   } catch (error) {
  //     console.error("Error al generar la factura:", error);
  //     return null;
  //   }
  // }
  async generarFactura(clienteId, carrito) {
    try {
      const cliente = await this.clienteService.obtenerClientePorId(clienteId);
      if (!cliente) {
        console.warn(`No se encontró un cliente con ID ${clienteId}.`);
        return null;
      }

      for (const item of carrito.items) {
        const producto = await this.productoService.obtenerProductoPorId(item.producto.id);
        if (!producto || producto.stock < item.cantidad) {
          console.error(`No hay suficiente stock para ${producto ? producto.nombre : 'un producto'}.  Stock actual: ${producto ? producto.stock : 'N/A'}, Cantidad requerida: ${item.cantidad}`);
          return null;
        }
      }

      const detallesFactura = [];
      for (const item of carrito.items) {
        const resultadoActualizacion = await this.productoService.actualizarStock(item.producto.id, item.cantidad);
        if (!resultadoActualizacion) {
          console.error(`Error: No se pudo actualizar el stock correctamente.`);
          return null;
        }
        const productoActualizado = await this.productoService.obtenerProductoPorId(item.producto.id);
        detallesFactura.push(new DetalleFactura(productoActualizado, item.cantidad));
      }

      const factura = new Factura(clienteId, detallesFactura);
      //  CORRECCIÓN:  Usar idGeneratorService directamente
      factura.id = await this.idGeneratorService.getLastId('Factura');
      factura.id++;
      await this.idGeneratorService.setLastId('Factura', factura.id);

      const idFactura = await this.add(factura);
      if (!idFactura) {
        console.error(`Error: No se pudo agregar correctamente la factura a la base de datos.`);
        return null;
      }
      console.info(`Factura generada con ID: ${idFactura}:`, factura);
      return factura;
    } catch (error) {
      console.error("Error al generar la factura:", error);
      return null;
    }
  }

  /**
   * Obtiene todas las facturas.
   * @returns {Promise<Array<Factura>>} - Un array con todas las facturas o un array vacío en caso de falla.
   */
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
      return null
    }
  }

  /**
   * Elimina una factura por su ID.
   * @param {number} id - ID de la factura a eliminar.
   * @returns {Promise<void|null>} - Devuelve void si fue eliminado, null si falla
   */
  // async eliminarFactura(id) {
  //   try {
  //     await super.delete(id);
  //     console.info(`Factura con ID ${id} eliminada correctamente.`);
  //   } catch (error) {
  //     console.error(`Error al eliminar la factura con ID ${id}:`, error);
  //     return null;
  //   }
  // }
}

export {FacturaService};