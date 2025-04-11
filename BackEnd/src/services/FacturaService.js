// // BackEnd/src/services/FacturaService.js
import { IndexedDB } from '../database/indexdDB.js';
import { InvoiceTemplate } from '../../../FrontEnd/public/ui/controllers/InvoicePlantilla.js';
import { DetalleFactura, Factura } from '../models/Factura.js';
import GoogleSheetSync from '../database/syncGoogleSheet.js'; // Importar
// import GoogleSheetReader from '../database/GoogleSheetReader.js'; // Opcional si lees

class FacturaService extends IndexedDB {
  // URL del script (puede ser la misma si manejas diferentes acciones/sheets)
  static googleSheetSyncFactura = new GoogleSheetSync('https://script.google.com/macros/s/AKfycbzgVAW5grnwMRFR8tbJnyFNUbq6tXtjyhdzFpAOIeyY4e_9DREN_U2n7pFkwVAXJvgA/exec');
  // static googleSheetReaderFactura = new GoogleSheetReader('URL_SCRIPT_AQUI'); // Opcional

  constructor(productoService, clienteService, idGeneratorService) {
    super('mydb', 'facturas');
    this.productoService = productoService;
    this.clienteService = clienteService;
    this.idGeneratorService = idGeneratorService;
    // No es común una sincronización periódica *hacia* la app para facturas,
    // así que omitimos startPeriodicSync por ahora.
    // Considera añadir un forceSyncNow si es necesario antes de operaciones críticas.
  }

  async generarFactura(cliente, carrito, facturaTemp) {
    let facturaGuardada = null;
    try {
      // ... (inicio de tu lógica existente: validaciones, ID, etc.) ...
      if (!cliente?.id) throw new Error('Cliente no válido');
      if (!carrito?.items?.length) throw new Error('Carrito vacío');

      // Verificar stock
      for (const item of carrito.items) {
          const producto = await this.productoService.obtenerProductoPorId(item.productoId);
          if (!producto || producto.stock < item.cantidad) {
            throw new Error(`Stock insuficiente para ${producto?.nombre || 'producto desconocido'} (${item.productoId}). Disp: ${producto?.stock || 0}, Req: ${item.cantidad}`);
          }
      }

      // Generar ID para la factura
      const facturas = await super.getAll(); // Usamos super.getAll() aquí
      const nextId = facturas.length ? Math.max(...facturas.map(f => f.id || 0)) + 1 : 1;


      // Crear detalles incluyendo la imagen desde el carrito
      const detalles = carrito.items.map(item => {
        const detalle = new DetalleFactura(
          item.productoId,
          item.nombre,
          item.precio,
          item.cantidad
        );
        detalle.imagen = item.imagen; // Asegurar que la imagen se pase explícitamente
        // detalle.calcularSubtotal(); // Se llama en el constructor
        return detalle;
      });


      // Reducir stock (importante: esto ya dispara sync de productos si lo tienes configurado)
      const stockChanges = []; // Para posible reversión
      for (const item of carrito.items) {
        const result = await this.productoService.actualizarStock(item.productoId, -item.cantidad);
        if (result === null) {
          // Revertir cambios de stock hechos hasta ahora ANTES de lanzar error
          for(const change of stockChanges) {
             await this.productoService.actualizarStock(change.productId, change.quantity).catch(e => console.error("Error revirtiendo stock", e));
          }
          throw new Error(`Error crítico al reducir stock para ${item.nombre}. Factura no generada.`);
        }
        stockChanges.push({ productId: item.productoId, quantity: item.cantidad }); // Guardar cambio positivo para reversión
      }

      // --- Crear la Factura ---
      const facturaData = await InvoiceTemplate.generarNumeroFactura(); // Asumo que esto es síncrono o devuelve la data
      const factura = new Factura(cliente.id, detalles); // detalles ya creados
      Object.assign(factura, {
        id: nextId,
        numeroFactura: facturaData.numero,
        fecha: facturaData.fecha.toISOString(), // Fecha como ISO string
        clienteNombre: cliente.nombre || '', // Asegurar valores
        clienteTelefono: cliente.telefono || '',
        clienteDireccion: cliente.direccion || ''
      });
      factura.calcularTotales(); // Calcula subtotal y total
      factura.fechaActualizacion = factura.fecha; // Fecha inicial

      // --- Guardar en IndexedDB ---
      facturaGuardada = await super.add(factura); // Usamos super.add()

      console.log(`Factura ${factura.numeroFactura} generada con éxito en IndexedDB.`);

      // --- Sincronizar con Google Sheets ---
      try {
        // Creamos una copia plana para enviar, especialmente importante para los detalles
        const facturaParaSync = JSON.parse(JSON.stringify(facturaGuardada));
        await FacturaService.googleSheetSyncFactura.sync("createFactura", facturaParaSync);
        console.log(`Factura ${factura.numeroFactura} enviada a Google Sheets para creación.`);
      } catch (syncError) {
        console.error(`Error al sincronizar factura ${factura.numeroFactura} con Google Sheets:`, syncError);
        // Aquí podrías decidir qué hacer: ¿marcar la factura como 'pendiente de sync'?
        // ¿intentar de nuevo más tarde? Por ahora, solo logueamos.
      }

      return facturaGuardada;

    } catch (error) {
      console.error('Error en generarFactura:', error);

      // Revertir stock si ya se guardó la factura en DB pero falló después,
      // o si falló durante la reducción de stock inicial (aunque ya se intentó revertir).
      // Este bloque es un seguro adicional.
       if (carrito?.items?.length > 0) {
         console.warn("Intentando revertir cambios de stock debido a error en generación de factura...");
         for (const item of carrito.items) {
           // Solo intentamos devolver la cantidad si sabemos que pudo haber sido restada
           const fueRestada = stockChanges.some(c => c.productId === item.productoId);
           if(fueRestada){
              await this.productoService.actualizarStock(item.productoId, item.cantidad).catch(err =>
                console.error(`Error GRAVE al intentar REVERTIR stock para ${item.productoId}:`, err)
              );
           }
         }
       }
      // No relanzar aquí si ya lanzaste antes, ajusta según necesites
      throw error; // Relanzar el error para que el controlador lo maneje
    }
  }

  async obtenerFacturas() {
    try {
      const facturasData = await super.getAll();
      // Podrías necesitar mapear aquí si la estructura de Factura/Detalle es compleja
      // Por ahora, asumimos que getAll devuelve objetos compatibles
      return facturasData;
    } catch (error) {
      console.error('Error al obtener facturas:', error);
      return [];
    }
  }

  async actualizarFactura(id, datosActualizados) {
    let facturaOriginal = null;
    try {
      facturaOriginal = await this.obtenerFacturaPorId(id); // Obtener el estado *antes* de actualizar
      if (!facturaOriginal) {
        console.error(`Factura con ID ${id} no encontrada`);
        return null;
      }

      // Crear una copia para trabajar y comparar
      const facturaActualizada = JSON.parse(JSON.stringify(facturaOriginal));

      const oldEstado = facturaActualizada.estado;
      let estadoCambiado = false;

      // Actualizar campos permitidos (principalmente estado)
      if (datosActualizados.estado && datosActualizados.estado !== oldEstado) {
        if(['pendiente', 'completado', 'denegado'].includes(datosActualizados.estado)) {
          facturaActualizada.estado = datosActualizados.estado;
          facturaActualizada.fechaActualizacion = new Date().toISOString(); // Actualizar fecha
          estadoCambiado = true;
          console.log(`Estado de factura ${id} cambiado de '${oldEstado}' a '${facturaActualizada.estado}'`);
        } else {
          console.warn(`Intento de actualizar a estado inválido: ${datosActualizados.estado}`);
        }
      }
      // Podrías añadir otros campos actualizables aquí si fuera necesario

      if (!estadoCambiado) {
        console.log(`No hubo cambios de estado válidos para factura ${id}.`);
        // Devolvemos el ID original para indicar que no hubo error, pero no cambios sincronizables
        // O podrías devolver el objeto original si la UI lo espera
        return facturaOriginal.id;
      }


      // Lógica de ajuste de stock basada en el cambio de estado
      if (estadoCambiado && facturaActualizada.detalles && facturaActualizada.detalles.length > 0) {
         console.log("Ajustando stock por cambio de estado...");
         for (const detalle of facturaActualizada.detalles) {
           const producto = await this.productoService.obtenerProductoPorId(detalle.productoId);
           if (!producto) {
             console.error(`Producto ${detalle.productoId} ('${detalle.nombre}') no encontrado para ajuste de stock en factura ${id}`);
             continue; // O lanzar error si prefieres detener todo
           }

           let stockChange = 0;
           // Si ANTES no era 'denegado' y AHORA SÍ es 'denegado', devolvemos stock.
           if (oldEstado !== 'denegado' && facturaActualizada.estado === 'denegado') {
               stockChange = detalle.cantidad; // Devolver al stock
                console.log(`Factura ${id} denegada. Devolviendo ${stockChange} de '${detalle.nombre}' (ID: ${detalle.productoId})`);
           // Si ANTES era 'denegado' y AHORA YA NO es 'denegado', reducimos stock (si hay suficiente).
           } else if (oldEstado === 'denegado' && facturaActualizada.estado !== 'denegado') {
             if (producto.stock < detalle.cantidad) {
               // No hay stock suficiente para "reactivar" la factura desde denegada. ¡ERROR!
               // Aquí deberías decidir qué hacer. ¿Revertir el cambio de estado? ¿Alertar?
               // Por ahora, lanzamos un error crítico.
               throw new Error(`Stock insuficiente para reactivar factura ${id} desde denegada. Prod: '${detalle.nombre}', Stock: ${producto.stock}, Req: ${detalle.cantidad}`);
             }
             stockChange = -detalle.cantidad; // Reducir del stock
             console.log(`Factura ${id} reactivada desde denegada. Reduciendo ${Math.abs(stockChange)} de '${detalle.nombre}' (ID: ${detalle.productoId})`);
           }

           // Aplicar el cambio de stock si hubo alguno
           if (stockChange !== 0) {
              const result = await this.productoService.actualizarStock(detalle.productoId, stockChange);
              if (result === null) {
                 // Falló la actualización de stock. ¿Qué hacer? ¿Revertir estado?
                 // Lanzar error es lo más seguro por ahora.
                 throw new Error(`Error crítico al ajustar stock para '${detalle.nombre}' (ID: ${detalle.productoId}) durante la actualización de factura ${id}. Estado anterior: ${oldEstado}, Nuevo: ${facturaActualizada.estado}`);
              }
           }
         } // Fin for detalles
      } // Fin if estadoCambiado


      // --- Actualizar en IndexedDB ---
      await super.update(id, facturaActualizada);
      console.log(`Factura ${facturaActualizada.numeroFactura || id} actualizada en IndexedDB a estado "${facturaActualizada.estado}"`);

      // --- Sincronizar cambio de estado con Google Sheets ---
      try {
        // Solo enviamos lo necesario para actualizar la hoja 'Facturas'
        const dataParaSync = {
          id: facturaActualizada.id,
          estado: facturaActualizada.estado,
          fechaActualizacion: facturaActualizada.fechaActualizacion
        };
        await FacturaService.googleSheetSyncFactura.sync("updateFacturaEstado", dataParaSync);
        console.log(`Actualización de estado para factura ${id} enviada a Google Sheets.`);
      } catch (syncError) {
        console.error(`Error al sincronizar actualización de estado para factura ${id}:`, syncError);
        // Considera qué hacer en caso de fallo de sincronización aquí.
      }

      // Devolver el ID o el objeto actualizado según lo que necesite el controlador
      return facturaActualizada; // O facturaActualizada.id

    } catch (error) {
      console.error(`Error al actualizar factura ${id}:`, error);
      // Aquí podrías intentar revertir el estado en la DB si la lógica falló después de la actualización inicial
      // pero antes de completar la sincronización o ajuste de stock, si lo ves necesario.
      // Ejemplo básico: if (facturaOriginal) await super.update(id, facturaOriginal).catch(e => console.error("Failed to revert invoice state", e));

      return null; // Indicar error al controlador
    }
  }

  async obtenerFacturaPorId(id) {
    console.log(`[FacturaService] Iniciando obtenerFacturaPorId para ID: ${id}`);
    try {
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            console.error('[FacturaService] obtenerFacturaPorId: ID inválido', id);
            return null;
        }

        const facturaData = await super.getById(numericId); // POJO de IndexedDB
        if (!facturaData) {
            console.warn(`[FacturaService] Factura con ID ${numericId} no encontrada en IndexedDB.`);
            return null;
        }
        console.log('[FacturaService] Datos crudos de IndexedDB (facturaData):', JSON.parse(JSON.stringify(facturaData))); // Loguear copia profunda

        // 1. Reconstruir detalles como instancias
        const detallesInstancias = (facturaData.detalles || []).map((detalleData, index) => {
             console.log(`[FacturaService] Procesando detalleData[${index}]:`, detalleData);
            const instancia = new DetalleFactura( // Llamada al constructor
                detalleData.productoId,
                detalleData.nombre || 'Nombre no disponible',
                detalleData.precio || 0,
                detalleData.cantidad || 0,
                detalleData.imagen || ''
            );
            console.log(`[FacturaService] Instancia DetalleFactura[${index}] creada:`, instancia);
            console.log(`[FacturaService] -> Tipo de instancia[${index}]:`, instancia?.constructor?.name);
            console.log(`[FacturaService] -> Método calcularSubtotal en instancia[${index}]?:`, typeof instancia.calcularSubtotal);
            return instancia;
        });
         console.log('[FacturaService] Array de detallesInstancias completo:', detallesInstancias);


        // 2. Crear instancia base de Factura usando los detalles reconstruidos
        const factura = new Factura(facturaData.clienteId, detallesInstancias); // Instancias van aquí
         console.log('[FacturaService] Instancia base de Factura creada:', factura);


         // 3. Copiar el resto de propiedades del POJO a la instancia (EVITANDO detalles)
        // Método más seguro: copiar propiedad por propiedad o usar Object.assign con cuidado

        // ----- OPCIÓN RECOMENDADA: MANUAL -----
         factura.id = facturaData.id;
         factura.numeroFactura = facturaData.numeroFactura;
         factura.fecha = facturaData.fecha;
         // Copiar totales/subtotales si confías más en el dato guardado que en el recálculo inicial
         factura.total = facturaData.total !== undefined ? facturaData.total : factura.total;
         factura.subtotal = facturaData.subtotal !== undefined ? facturaData.subtotal : factura.subtotal;
         factura.envio = facturaData.envio !== undefined ? facturaData.envio : factura.envio;
         factura.estado = facturaData.estado;
         factura.clienteNombre = facturaData.clienteNombre;
         factura.clienteTelefono = facturaData.clienteTelefono;
         factura.clienteDireccion = facturaData.clienteDireccion;
         factura.fechaActualizacion = facturaData.fechaActualizacion;
         // 'clienteId' y 'detalles' ya fueron establecidos correctamente por el constructor


         /* // ----- OPCIÓN Object.assign con precaución (si la manual es muy larga) -----
         const facturaDataParaCopiar = { ...facturaData };
         delete facturaDataParaCopiar.detalles; // ¡Fundamental!
         // Opcional: borrar otros campos manejados por el constructor si causan problemas
         // delete facturaDataParaCopiar.clienteId;
         Object.assign(factura, facturaDataParaCopiar);
         // Asegúrate que el ID está correcto si usaste Object.assign
         factura.id = facturaData.id; // Reasegurar por si acaso
         */


        // ----- Verificación Final ANTES DE RETURN -----
        console.log('[FacturaService] Factura FINAL a punto de ser retornada:', factura);
         if (factura.detalles && factura.detalles.length > 0) {
             const primerDetalle = factura.detalles[0];
             console.log('[FacturaService] -> PRIMER DETALLE en factura final:', primerDetalle);
             console.log('[FacturaService] -> TIPO del primer detalle:', primerDetalle?.constructor?.name); // Debería ser 'DetalleFactura'
             console.log('[FacturaService] -> MÉTODO calcularSubtotal en primer detalle?:', typeof primerDetalle?.calcularSubtotal); // Debería ser 'function'
         } else {
             console.log('[FacturaService] -> Factura final no tiene detalles.');
         }

        return factura; // Debería ser una instancia de Factura con instancias de DetalleFactura

    } catch (error) {
        console.error(`[FacturaService] ERROR FATAL al obtener factura ${id}:`, error);
        // Loguear el error completo, incluyendo stack trace si es posible
        console.error(error.stack);
        return null;
    }
}

   // Podrías necesitar una función para eliminar facturas también
  async eliminarFactura(id) {
     try {
       // 1. Obtener factura para saber los detalles (y luego eliminar de 'DetallesFactura')
       const factura = await this.obtenerFacturaPorId(id);
       if (!factura) {
          console.warn(`Intento de eliminar factura no existente: ID ${id}`);
          return false; // O true si no existe ya no hay nada que borrar
       }
       const facturaId = factura.id; // Guardar por si factura se invalida

        // 2. Lógica para revertir stock (¿O no? Depende de la política de negocio al eliminar)
        // DECISIÓN IMPORTANTE: Al eliminar una factura, ¿se devuelve el stock?
        // Si la factura estaba 'completada' o 'pendiente', probablemente SÍ.
        // Si estaba 'denegada', el stock ya debería haber sido devuelto, así que NO.
       if (factura.estado !== 'denegado') {
            console.warn(`Eliminando factura ${id} (estado: ${factura.estado}). Intentando devolver stock...`);
            for (const detalle of factura.detalles) {
                 await this.productoService.actualizarStock(detalle.productoId, detalle.cantidad)
                   .catch(err => console.error(`Error al devolver stock para producto ${detalle.productoId} al eliminar factura ${id}`, err));
            }
        }


        // 3. Eliminar de IndexedDB
       await super.delete(id);
        console.log(`Factura ${id} eliminada de IndexedDB.`);

        // 4. Sincronizar eliminación con Google Sheets
        try {
          await FacturaService.googleSheetSyncFactura.sync("deleteFactura", { id: facturaId });
           console.log(`Solicitud de eliminación para factura ${id} enviada a Google Sheets.`);
        } catch (syncError) {
           console.error(`Error al sincronizar eliminación de factura ${id}:`, syncError);
        }

       return true; // Eliminación exitosa (o al menos iniciada)

     } catch (error) {
        console.error(`Error al eliminar factura ${id}:`, error);
        return false; // Indicar fallo
     }
  }


}

export { FacturaService };