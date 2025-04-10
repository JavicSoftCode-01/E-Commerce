// // BackEnd/src/services/FacturaService.js
import { IndexedDB } from '../database/indexdDB.js';
import { InvoiceTemplate } from '../../../FrontEnd/public/ui/controllers/InvoicePlantilla.js';
import { DetalleFactura, Factura } from '../models/Factura.js';

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

      // Verificar stock disponible
      for (const item of carrito.items) {
        const producto = await this.productoService.obtenerProductoPorId(item.productoId);
        if (!producto || producto.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para ${producto?.nombre || item.productoId}. Disponible: ${producto?.stock || 0}`);
        }
      }

      // Generar ID
      const facturas = await this.getAll();
      const nextId = facturas.length ? Math.max(...facturas.map(f => f.id)) + 1 : 1;

      // Crear detalles incluyendo la imagen desde el carrito
      const detalles = carrito.items.map(item => {
        const detalle = new DetalleFactura(
          item.productoId,
          item.nombre,
          item.precio,
          item.cantidad
        );
        detalle.imagen = item.imagen; // Asegurar que la imagen se pase explícitamente
        return detalle;
      });

      // Reducir stock
      for (const item of carrito.items) {
        const nuevoStock = await this.productoService.actualizarStock(item.productoId, -item.cantidad);
        if (nuevoStock === null) {
          throw new Error(`Error al reducir stock para ${item.nombre}`);
        }
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
      console.log(`Factura ${factura.numeroFactura} generada con éxito`);
      return factura;
    } catch (error) {
      console.error('Error en generarFactura:', error);
      for (const item of carrito.items) {
        await this.productoService.actualizarStock(item.productoId, item.cantidad).catch(err =>
          console.error(`Error al revertir stock para ${item.productoId}:`, err)
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
      if (!factura) {
        console.error(`Factura con ID ${id} no encontrada`);
        return null;
      }

      const oldEstado = factura.estado;
      if (datosActualizados.estado && datosActualizados.estado !== oldEstado) {
        factura.estado = datosActualizados.estado;
        factura.fechaActualizacion = new Date().toISOString();

        for (const detalle of factura.detalles) {
          const producto = await this.productoService.obtenerProductoPorId(detalle.productoId);
          if (!producto) {
            console.error(`Producto ${detalle.productoId} no encontrado para ajuste de stock`);
            continue;
          }

          if (oldEstado !== 'denegado' && factura.estado === 'denegado') {
            const nuevoStock = await this.productoService.actualizarStock(detalle.productoId, detalle.cantidad);
            if (nuevoStock === null) {
              throw new Error(`Error al devolver stock para ${detalle.nombre}`);
            }
            console.log(`Stock devuelto: ${detalle.cantidad} unidades de ${detalle.nombre}`);
          } else if (oldEstado === 'denegado' && (factura.estado === 'pendiente' || factura.estado === 'completado')) {
            if (producto.stock < detalle.cantidad) {
              throw new Error(`Stock insuficiente para ${detalle.nombre}. Disponible: ${producto.stock}, Requerido: ${detalle.cantidad}`);
            }
            const nuevoStock = await this.productoService.actualizarStock(detalle.productoId, -detalle.cantidad);
            if (nuevoStock === null) {
              throw new Error(`Error al reducir stock para ${detalle.nombre}`);
            }
            console.log(`Stock reducido: ${detalle.cantidad} unidades de ${detalle.nombre}`);
          }
        }

        await super.update(id, factura);
        console.log(`Factura ${factura.numeroFactura} actualizada a estado "${factura.estado}"`);
        return id;
      }
      return id;
    } catch (error) {
      console.error(`Error al actualizar factura ${id}:`, error);
      return null;
    }
  }

  async obtenerFacturaPorId(id) {
    try {
      const facturaData = await super.getById(id);
      if (!facturaData) return null;

      // Reconstruir detalles asegurando que incluyan la imagen
      const detalles = facturaData.detalles.map(detalle => {
        const detalleFactura = new DetalleFactura(
          detalle.productoId,
          detalle.nombre,
          detalle.precio,
          detalle.cantidad
        );
        detalleFactura.imagen = detalle.imagen || ''; // Usar la imagen almacenada, o vacío si no existe
        return detalleFactura;
      });

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