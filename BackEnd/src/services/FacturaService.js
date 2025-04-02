// BackEnd/src/services/FacturaService.js
import { IndexedDB } from '../database/indexdDB.js';
import { InvoiceTemplate } from '../../../FrontEnd/public/ui/controllers/InvoicePlantilla.js';
import { Factura, DetalleFactura } from '../models/Factura.js';

class FacturaService extends IndexedDB {
  constructor(productoService, clienteService, idGeneratorService) {
    super('mydb', 'facturas');
    this.productoService = productoService;
    this.clienteService = clienteService;
    this.idGeneratorService = idGeneratorService;
  }

  async generarFactura(cliente, carrito, facturaTemp) {
    try {
      if (!cliente?.id) throw new Error('Cliente no válido');
      if (!carrito?.items?.length) throw new Error('Carrito vacío');

      // Verificar stock
      for (const item of carrito.items) {
        const producto = await this.productoService.obtenerProductoPorId(item.productoId);
        if (!producto || producto.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para ${producto?.nombre || item.productoId}`);
        }
      }

      // Generar ID
      const facturas = await this.getAll();
      const nextId = facturas.length ? Math.max(...facturas.map(f => f.id)) + 1 : 1;

      // Crear detalles
      const detalles = carrito.items.map(item => new DetalleFactura(
        item.productoId,
        item.nombre,
        item.precio,
        item.cantidad
      ));

      // Actualizar stock
      for (const item of carrito.items) {
        await this.productoService.actualizarStock(item.productoId, -item.cantidad);
      }

      const facturaData = await InvoiceTemplate.generarNumeroFactura();
      const factura = new Factura(cliente.id, detalles);
      Object.assign(factura, {
        id: nextId,
        numeroFactura: facturaData.numero,
        fecha: facturaData.fecha.toISOString(),
        clienteNombre: cliente.nombre,
        clienteTelefono: cliente.telefono,
        clienteDireccion: cliente.direccion
      });
      factura.calcularTotales();

      await super.add(factura);
      return factura;
    } catch (error) {
      console.error('Error en generarFactura:', error);
      // Revertir stock en caso de error
      for (const item of carrito.items) {
        await this.productoService.actualizarStock(item.productoId, item.cantidad).catch(err =>
          console.error('Error al revertir stock:', err)
        );
      }
      throw error;
    }
  }

  async obtenerFacturas() {
    try {
      return await super.getAll();
    } catch (error) {
      console.error('Error al obtener facturas:', error);
      return [];
    }
  }

  async actualizarFactura(id, datosActualizados) {
    try {
      const factura = await this.obtenerFacturaPorId(id);
      if (!factura) return null;

      const oldEstado = factura.estado;
      if (datosActualizados.estado && datosActualizados.estado !== oldEstado) {
        factura.estado = datosActualizados.estado;
        factura.fechaActualizacion = new Date().toISOString();

        // Ajustar stock según cambio de estado
        if (oldEstado !== 'denegado' && factura.estado === 'denegado') {
          for (const detalle of factura.detalles) {
            await this.productoService.actualizarStock(detalle.productoId, detalle.cantidad);
          }
        } else if (oldEstado === 'denegado' && (factura.estado === 'pendiente' || factura.estado === 'completado')) {
          for (const detalle of factura.detalles) {
            await this.productoService.actualizarStock(detalle.productoId, -detalle.cantidad);
          }
        }

        await super.update(id, factura);
        return id;
      }
      return id; // Sin cambios
    } catch (error) {
      console.error(`Error al actualizar factura ${id}:`, error);
      return null;
    }
  }

  async obtenerFacturaPorId(id) {
    try {
      const facturaData = await super.getById(id);
      if (!facturaData) return null;

      // Convertir los detalles en instancias de DetalleFactura
      const detalles = facturaData.detalles.map(detalle => new DetalleFactura(
        detalle.productoId,
        detalle.nombre,
        detalle.precio,
        detalle.cantidad
      ));

      // Crear una nueva instancia de Factura con los detalles convertidos
      const factura = new Factura(facturaData.clienteId, detalles);
      Object.assign(factura, {
        id: facturaData.id,
        numeroFactura: facturaData.numeroFactura,
        fecha: facturaData.fecha,
        clienteNombre: facturaData.clienteNombre,
        clienteTelefono: facturaData.clienteTelefono,
        clienteDireccion: facturaData.clienteDireccion,
        subtotal: facturaData.subtotal,
        envio: facturaData.envio,
        total: facturaData.total,
        estado: facturaData.estado,
        fechaActualizacion: facturaData.fechaActualizacion
      });

      return factura;
    } catch (error) {
      console.error(`Error al obtener factura ${id}:`, error);
      return null;
    }
  }
}

export { FacturaService };