// BackEnd/src/services/FacturaService.js
import { IndexedDB } from '../database/indexdDB.js';
import { InvoiceTemplate } from '../../../FrontEnd/public/ui/controllers/InvoicePlantilla.js';
import { DetalleFactura, Factura } from '../models/Factura.js';
import GoogleSheetSync from '../database/syncGoogleSheet.js';
import GoogleSheetReader from '../database/GoogleSheetReader.js'; // Importar el Reader

class FacturaService extends IndexedDB {
  // URLs (Asegúrate que la URL de LECTURA permita leer ambas hojas si usas una sola URL)
  // Si el script de escritura y lectura es el mismo, puedes usar la misma URL.
  // Si tienes scripts separados o necesitas acciones específicas para leer, ajusta.
  static FACTURA_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw8mOdJSi0QERD6AD6SKeljOrOpSD1dOBY-t2qAL_GBBSwLFc2ZVa1d0kq8-rLg8HDr/exec';

  static googleSheetSyncFactura = new GoogleSheetSync(FacturaService.FACTURA_SCRIPT_URL);
  // Añadir instancia del Lector
  static googleSheetReaderFactura = new GoogleSheetReader(FacturaService.FACTURA_SCRIPT_URL);

  static SYNC_INTERVAL = 5000; // Sincronizar cada 5 segundos (igual que productos o ajusta)

  constructor(productoService, clienteService, idGeneratorService) {
    super('mydb', 'facturas'); // storeName es 'facturas'
    this.productoService = productoService;
    this.clienteService = clienteService;
    this.idGeneratorService = idGeneratorService;
    this.lastSyncTime = null; // Rastrear la última sincronización

    console.log('FacturaService - Inicializado');
    this.startPeriodicSync(); // Iniciar sincronización periódica
  }

  startPeriodicSync() {
    // Sincroniza inmediatamente al iniciar
    this.syncWithGoogleSheets().catch(error => console.error("Error en la sincronización inicial de facturas:", error));
    // Luego, sincroniza periódicamente
    setInterval(() => {
       this.syncWithGoogleSheets().catch(error => console.error("Error en la sincronización periódica de facturas:", error));
    }, FacturaService.SYNC_INTERVAL);
  }

  // Método para forzar sincronización (útil desde el AdminController)
  async forceSyncNow() {
    console.log('[SYNC-FACT] Forzando sincronización de facturas ahora...');
    return await this.syncWithGoogleSheets();
  }

  // NUEVO: Método de Sincronización con Google Sheets (similar a ProductoService)
  async syncWithGoogleSheets() {
    try {
      console.log('[SYNC-FACT] Iniciando sincronización de facturas...');

      // 1. Leer datos de ambas hojas
      const facturasSheetName = 'Facturas';
      const detallesSheetName = 'DetallesFactura';

      console.log(`[SYNC-FACT] Leyendo datos de ${facturasSheetName}...`);
      const facturasRawData = await FacturaService.googleSheetReaderFactura.getData(facturasSheetName);
      console.log(`[SYNC-FACT] Leyendo datos de ${detallesSheetName}...`);
      const detallesRawData = await FacturaService.googleSheetReaderFactura.getData(detallesSheetName);

      // --- Validaciones iniciales ---
      if (!facturasRawData || !Array.isArray(facturasRawData)) {
        console.warn(`[SYNC-FACT] getData para ${facturasSheetName} no devolvió un Array válido:`, facturasRawData);
        // Si no hay facturas en la hoja, limpiamos la BD local.
        await this.clearAllFacturas();
        this.lastSyncTime = new Date();
        return true;
      }
       if (!detallesRawData || !Array.isArray(detallesRawData)) {
           console.warn(`[SYNC-FACT] getData para ${detallesSheetName} no devolvió un Array válido:`, detallesRawData);
           // Podríamos continuar sin detalles, pero logueamos la advertencia.
       }
       // Si la hoja de facturas está vacía (solo cabecera), limpiar DB
       if (facturasRawData.length === 0 && this.storeIsEmpty() === false) {
         console.info('[SYNC-FACT] No se encontraron facturas en Google Sheet. Limpiando IndexedDB.');
         await this.clearAllFacturas();
         this.lastSyncTime = new Date();
         return true;
       }


      console.log(`[SYNC-FACT] Datos crudos recibidos - Facturas: ${facturasRawData.length}, Detalles: ${detallesRawData?.length ?? 0}`);

      // 2. Procesar Detalles primero para agruparlos por facturaId
      const detallesAgrupados = new Map(); // Map<facturaId, DetalleFactura[]>
      if (detallesRawData && detallesRawData.length > 0) {
        detallesRawData.forEach((dData, rowIndex) => {
          try {
             // Adaptar claves según los encabezados en MINÚSCULAS de tu hoja DetallesFactura
             const facturaId = parseInt(dData.facturaid, 10); // CLAVE: 'facturaid'
             const productoId = parseInt(dData.productoid, 10); // CLAVE: 'productoid'
             const nombre = dData.nombre || 'Nombre detalle no disp.';
             const precio = parseFloat(String(dData.precio || '0').replace(',', '.'));
             const cantidad = parseInt(dData.cantidad, 10) || 0;
             const imagen = dData.imagen || '';
             // El 'detalleid' y 'subtotal' leídos de la hoja pueden ignorarse si se recalculan o no se usan directamente.

             if (isNaN(facturaId)) {
                 console.warn(`[SYNC-FACT DETALLE ${rowIndex}] facturaId inválido (${dData.facturaid}). Omitiendo detalle.`);
                 return; // Saltar este detalle si no tiene facturaId válido
             }

             const detalleInstancia = new DetalleFactura(productoId, nombre, precio, cantidad, imagen);
             // detalleInstancia.subtotal = detalleInstancia.calcularSubtotal(); // El constructor ya lo hace


              if (!detallesAgrupados.has(facturaId)) {
                 detallesAgrupados.set(facturaId, []);
              }
              detallesAgrupados.get(facturaId).push(detalleInstancia);

          } catch (parseError) {
            console.error(`[SYNC-FACT DETALLE ${rowIndex}] Error CRÍTICO parseando detalle:`, dData, parseError);
          }
        });
      }
      console.log(`[SYNC-FACT] Detalles agrupados para ${detallesAgrupados.size} facturas.`);

      // 3. Procesar Facturas y adjuntar Detalles
      const facturasInstancias = [];
      facturasRawData.forEach((fData, rowIndex) => {
         try {
            // Adaptar claves según los encabezados en MINÚSCULAS de tu hoja Facturas
            const id = parseInt(fData.id, 10); // CLAVE: 'id'
            const clienteId = parseInt(fData.clienteid, 10); // CLAVE: 'clienteid'
            const numeroFactura = fData.numerofactura || '';
            const fechaStr = fData.fecha;
            const fechaActStr = fData.fechaactualizacion || fechaStr; // CLAVE: 'fechaactualizacion'

             // Parsear Fechas con cuidado (asumiendo que Apps Script las devuelve como ISO string o similar)
             let fecha = null;
             try { fecha = fechaStr ? new Date(fechaStr).toISOString() : new Date().toISOString(); }
             catch(e) { fecha = new Date().toISOString(); }

             let fechaActualizacion = fecha;
             try { fechaActualizacion = fechaActStr ? new Date(fechaActStr).toISOString() : fecha; }
             catch(e) { /* usa la fecha de factura ya parseada */ }


            const subtotal = parseFloat(String(fData.subtotal || '0').replace(',', '.')); // CLAVE: 'subtotal'
            const envio = parseFloat(String(fData.envio || '0').replace(',', '.')); // CLAVE: 'envio'
            const total = parseFloat(String(fData.total || '0').replace(',', '.')); // CLAVE: 'total'
            const estado = fData.estado || 'pendiente'; // CLAVE: 'estado'
            const clienteNombre = fData.clientenombre || ''; // CLAVE: 'clientenombre'
            const clienteTelefono = fData.clientetelefono || ''; // CLAVE: 'clientetelefono'
            const clienteDireccion = fData.clientedireccion || ''; // CLAVE: 'clientedireccion'

            if (isNaN(id)) {
              console.warn(`[SYNC-FACT ${rowIndex}] ID de factura inválido (${fData.id}). Omitiendo factura.`);
              return; // Saltar factura sin ID
            }
             if (isNaN(clienteId)) {
                 console.warn(`[SYNC-FACT ${rowIndex}] (ID: ${id}): clienteId inválido (${fData.clienteid}). Usando null.`);
                 // Continuar pero loguear. La instancia de Factura manejará null.
             }


            // Recuperar los detalles para esta factura
            const detallesParaFactura = detallesAgrupados.get(id) || [];
            if (detallesParaFactura.length === 0 && detallesAgrupados.has(id)) {
                 // Esto podría pasar si todos los detalles parseados para este ID eran inválidos
                 console.warn(`[SYNC-FACT ${rowIndex}] (ID: ${id}): Se encontraron detalles en el Map pero el array está vacío post-parseo.`);
            }

            // Crear instancia de Factura
            // ¡IMPORTANTE! Pasamos las *instancias* de DetalleFactura reconstruidas
            const instancia = new Factura(clienteId, detallesParaFactura);

            // Asignar el resto de propiedades leídas de la hoja
            instancia.id = id;
            instancia.numeroFactura = numeroFactura;
            instancia.fecha = fecha; // Debe ser ISO String para consistencia con create
            instancia.subtotal = subtotal;
            instancia.envio = envio;
            instancia.total = total; // Podríamos llamar a instancia.calcularTotales() aquí o confiar en el valor leído
            instancia.estado = estado;
            instancia.clienteNombre = clienteNombre;
            instancia.clienteTelefono = clienteTelefono;
            instancia.clienteDireccion = clienteDireccion;
            instancia.fechaActualizacion = fechaActualizacion; // ISO String


             // Recalcular totales basado en detalles leídos si se prefiere asegurar consistencia
             // instancia.calcularTotales(); // Descomentar si se quiere forzar recálculo

            facturasInstancias.push(instancia);
            // console.log(`[SYNC-FACT ${rowIndex}] Factura parseada (ID: ${id}):`, instancia);


          } catch (parseError) {
             console.error(`[SYNC-FACT ${rowIndex}] Error CRÍTICO parseando factura:`, fData, parseError);
          }
      });

       console.log(`[SYNC-FACT] Parseadas ${facturasInstancias.length} facturas válidas.`);


      // 4. Actualización de IndexedDB
      try {
        console.log("[SYNC-FACT-DB] Limpiando store 'facturas'...");
        await this.clearAllFacturas(); // Limpiar solo las facturas
        console.log("[SYNC-FACT-DB] Agregando facturas parseadas a IndexedDB...");
        const db = await this.dbPromise;
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        let addedCount = 0;
        for (const factura of facturasInstancias) {
           // Doble chequeo del ID
          if (factura.id === null || isNaN(factura.id)) {
            console.warn("[SYNC-FACT-DB] Omitiendo guardar factura con ID inválido:", factura);
            continue;
          }
          try {
            // Usar put para añadir o sobrescribir (más seguro tras limpiar)
            await store.put(factura);
            addedCount++;
          } catch (dbWriteError) {
            console.error(`[SYNC-FACT-DB] Error escritura IndexedDB para factura ID ${factura.id}:`, dbWriteError, factura);
          }
        }
        await transaction.done;
        this.lastSyncTime = new Date();
        console.info(`[SYNC-FACT] Sincronización de Facturas con IndexedDB completa: ${addedCount}/${facturasInstancias.length} procesadas a las ${this.lastSyncTime.toLocaleTimeString()}`);
        return true; // Éxito de la sincronización
      } catch (dbError) {
        console.error('[SYNC-FACT-DB] Error transacción IndexedDB para Facturas:', dbError);
        return false; // Fallo de la sincronización
      }

    } catch (error) {
      console.error('[SYNC-FACT] Error GENERAL en sincronización de Facturas:', error);
      return false; // Fallo de la sincronización
    }
  }

   async clearAllFacturas() {
        try {
            const db = await this.dbPromise;
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            await store.clear();
            await transaction.done;
            console.log(`[SYNC-FACT-DB] Store '${this.storeName}' limpiado.`);
            return true;
        } catch (error) {
            console.error(`Error clearing IndexedDB store '${this.storeName}':`, error);
            return false;
        }
    }
      async storeIsEmpty() {
         try {
             const db = await this.dbPromise;
             const transaction = db.transaction([this.storeName], 'readonly');
             const store = transaction.objectStore(this.storeName);
             const count = await store.count();
             await transaction.done;
             return count === 0;
         } catch (error) {
              console.error(`Error checking if store '${this.storeName}' is empty:`, error);
              return false; // Asumir que no está vacío si hay error
         }
      }


  // --- Métodos CRUD existentes (modificar obtenerFacturas y obtenerFacturaPorId) ---

  async generarFactura(cliente, carrito, facturaTemp) {
    let facturaGuardada = null;
     let stockChanges = []; // Mover aquí para que esté disponible en el catch general
    try {
      // Validaciones
      if (!cliente?.id) throw new Error('Cliente no válido');
      if (!carrito?.items?.length) throw new Error('Carrito vacío');

      // 1. Verificar stock ANTES de generar ID o cualquier otra cosa
       console.log("[GEN-FACT] Verificando stock...");
      for (const item of carrito.items) {
          const producto = await this.productoService.obtenerProductoPorId(item.productoId);
          if (!producto) {
              throw new Error(`Producto ${item.nombre} (ID: ${item.productoId}) no encontrado en el sistema.`);
          }
           if (producto.stock < item.cantidad) {
              throw new Error(`Stock insuficiente para ${producto.nombre} (${item.productoId}). Disp: ${producto.stock}, Req: ${item.cantidad}`);
          }
      }
       console.log("[GEN-FACT] Stock verificado correctamente.");


       // 2. Generar ID único para la factura localmente (puede ser simple incremental)
      // Asegurar que el ID local no choque con los IDs de Google Sheet
       // Estrategia: Usar ID temporal negativo o timestamp muy preciso si hay riesgo de colisión
       // Por simplicidad ahora, mantenemos incremental local basado en lo que hay en *IndexedDB*.
       // La sincronización desde GSheet sobreescribirá si hay colisión (asumiendo GSheet es la fuente de verdad).
      const facturasLocales = await super.getAll(); // Lee SOLO IndexedDB aquí
      const nextId = facturasLocales.length ? Math.max(0, ...facturasLocales.map(f => f.id || 0)) + 1 : 1;
       console.log(`[GEN-FACT] ID local generado para nueva factura: ${nextId}`);

       // 3. Crear instancias de DetallesFactura
      const detalles = carrito.items.map(item => {
        const detalle = new DetalleFactura(
          item.productoId,
          item.nombre,
          item.precio,
          item.cantidad,
          item.imagen // Asegurar que la imagen se pasa
        );
        // detalle.calcularSubtotal(); // Constructor lo hace
        return detalle;
      });
       console.log("[GEN-FACT] DetallesFactura creados:", detalles);


       // 4. Reducir stock AHORA (después de verificar y ANTES de guardar factura)
       // ¡¡CRÍTICO!! Hacer esto dentro del try principal
        console.log("[GEN-FACT] Reduciendo stock de productos...");
       // stockChanges = []; // Declarado afuera ahora
       for (const item of carrito.items) {
           const result = await this.productoService.actualizarStock(item.productoId, -item.cantidad);
           if (result === null || result === false) { // Si actualizarStock devuelve null o false en error
                console.error(`Error CRÍTICO al reducir stock para ${item.nombre}. Revirtiendo cambios...`);
               // --- REVERSIÓN DE STOCK INMEDIATA ---
                for(const change of stockChanges) {
                   console.warn(`[REVERT] Devolviendo ${change.quantity} a producto ID ${change.productId}`);
                    await this.productoService.actualizarStock(change.productId, change.quantity).catch(e => console.error("[REVERT-ERR] Error revirtiendo stock para " + change.productId, e));
                }
                throw new Error(`Error crítico al reducir stock para ${item.nombre}. Factura NO generada.`);
           }
           console.log(` - Stock reducido para ${item.nombre} (ID: ${item.productoId}), cantidad: ${item.cantidad}`);
           stockChanges.push({ productId: item.productoId, quantity: item.cantidad }); // Guardar cambio positivo para reversión
       }
        console.log("[GEN-FACT] Stock reducido exitosamente.");

      // 5. Crear la instancia de Factura
      const facturaDataNum = await InvoiceTemplate.generarNumeroFactura(); // Asumo OK
      const factura = new Factura(cliente.id, detalles); // Pasamos INSTANCIAS de detalle
      factura.id = nextId; // Asignar ID local
      factura.numeroFactura = facturaDataNum.numero;
       factura.fecha = facturaDataNum.fecha.toISOString(); // Asegurar ISO String
       factura.fechaActualizacion = factura.fecha; // Inicialmente iguales
       // Asignar datos del cliente
      factura.clienteNombre = cliente.nombre || '';
      factura.clienteTelefono = cliente.telefono || '';
      factura.clienteDireccion = cliente.direccion || '';
      factura.calcularTotales(); // Calcular subtotal y total
      console.log("[GEN-FACT] Instancia de Factura creada:", factura);


      // 6. Guardar en IndexedDB
      facturaGuardada = await super.add(factura); // Guarda en IndexedDB
       console.log(`[GEN-FACT] Factura ${factura.numeroFactura} (ID local: ${factura.id}) guardada en IndexedDB.`);

       // 7. Sincronizar con Google Sheets (Enviar para creación)
      try {
         console.log(`[SYNC-FACT-UP] Enviando factura ${factura.id} para creación a Google Sheets...`);
         // Crear una copia PLANA para enviar (Google Apps Script prefiere objetos simples)
         // ¡IMPORTANTE! Asegurar que DetalleFactura tenga un método toJSON o similar si es necesario,
         // o construir el objeto plano manualmente aquí.
         const facturaPlanaParaSync = {
           id: factura.id,
           clienteId: factura.clienteId,
           numeroFactura: factura.numeroFactura,
           fecha: factura.fecha, // Ya es ISO String
           subtotal: factura.subtotal,
           envio: factura.envio,
           total: factura.total,
           estado: factura.estado, // 'pendiente' por defecto
           clienteNombre: factura.clienteNombre,
           clienteTelefono: factura.clienteTelefono,
           clienteDireccion: factura.clienteDireccion,
           fechaActualizacion: factura.fechaActualizacion, // Ya es ISO String
           // Mapear detalles a formato plano esperado por Apps Script
           detalles: factura.detalles.map(d => ({
              //detalleId: null, // Apps Script no lo necesita en create
              facturaId: factura.id, // Referencia a la factura padre
              productoId: d.productoId,
              nombre: d.nombre,
              precio: d.precio,
              cantidad: d.cantidad,
              imagen: d.imagen,
              subtotal: d.subtotal // Asegúrate que este valor sea correcto
           }))
         };

        await FacturaService.googleSheetSyncFactura.sync("createFactura", facturaPlanaParaSync);
        console.log(`[SYNC-FACT-UP] Factura ${factura.id} enviada a Google Sheets.`);

        // Considerar forzar una sincronización de LECTURA aquí si quieres confirmar
         await this.forceSyncNow(); // Opcional: Leer de vuelta inmediatamente

      } catch (syncError) {
        console.error(`[SYNC-FACT-UP-ERR] Error al sincronizar factura ${factura.id} con Google Sheets:`, syncError);
        // DECISIÓN: ¿Qué hacer si la sincronización falla?
        // - ¿Marcar la factura local como "pendiente de sync"?
        // - ¿Intentar de nuevo más tarde?
        // - ¿Revertir la factura local (y el stock)? --> Peligroso si el usuario ya ve la factura
        // Por ahora, solo logueamos el error y la factura *queda* en IndexedDB.
      }

      return facturaGuardada; // Devuelve la factura guardada en IndexedDB

    } catch (error) {
      console.error('<<<<< ERROR en generarFactura >>>>>:', error);
       // --- INTENTO FINAL DE REVERSIÓN DE STOCK (si algo falló DESPUÉS de reducirlo) ---
      if (stockChanges && stockChanges.length > 0) {
          console.warn("[REVERT-FINAL] Error durante la generación/guardado/sync de factura. Intentando revertir TODOS los cambios de stock hechos...");
          for(const change of stockChanges) {
             console.warn(`[REVERT-FINAL] Devolviendo ${change.quantity} a producto ID ${change.productId}`);
              await this.productoService.actualizarStock(change.productId, change.quantity).catch(e => console.error("[REVERT-FINAL-ERR] Error GRAVE revirtiendo stock para " + change.productId, e));
          }
      }
      // Eliminar factura de IndexedDB si se llegó a guardar antes del error
      if (facturaGuardada?.id) {
         console.warn(`[CLEANUP] Intentando eliminar factura local (ID: ${facturaGuardada.id}) debido a error posterior.`);
         await super.delete(facturaGuardada.id).catch(e => console.error(`[CLEANUP-ERR] Error eliminando factura local ${facturaGuardada.id}`, e));
      }

      throw error; // Relanzar el error para que el controlador lo maneje (e.g., mostrar alerta)
    }
  }

   // Modificado para potencialmente sincronizar antes de leer
  // Modificado para SIEMPRE mapear los datos recuperados de IndexedDB a instancias
  async obtenerFacturas() {
    try {
      const now = new Date();
      // Condición de sincronización basada en tiempo (parece correcta)
      if (!this.lastSyncTime || (now - this.lastSyncTime) > (FacturaService.SYNC_INTERVAL * 1.5)) {
        console.log("[OBT-FACT] Datos locales posiblemente desactualizados. Forzando sincronización...");
        const syncSuccess = await this.forceSyncNow();
        if (!syncSuccess) {
           console.warn("[OBT-FACT] La sincronización forzada falló. Se devolverán los datos locales actuales.");
        } else {
            console.log("[OBT-FACT] Sincronización forzada completada.");
        }
      }

      console.log("[OBT-FACT] Obteniendo todas las facturas desde IndexedDB...");
      const facturasData = await super.getAll(); // Recupera POJOs
      console.log(`[OBT-FACT] Se recuperaron ${facturasData.length} objetos de IndexedDB.`);


      // *** CORRECCIÓN AQUÍ ***
      // Mapear SIEMPRE los POJOs recuperados a instancias de Factura
      // Ya no necesitamos el check 'instanceof' porque sabemos que getAll() devuelve POJOs.
      return facturasData.map(fDataPojo => {
           // Log para ver qué estamos mapeando
          // console.log(`[OBT-FACT MAP] Mapeando POJO con ID: ${fDataPojo?.id}`);
          if (!fDataPojo || typeof fDataPojo !== 'object') {
                console.warn("[OBT-FACT MAP] Objeto inválido encontrado en los datos recuperados:", fDataPojo);
                return null; // O devolver un objeto vacío, o filtrar al final
            }
          // Siempre llamar al helper de mapeo
          return this.mapDataToFacturaInstance(fDataPojo);
      }).filter(instancia => instancia !== null); // Filtrar posibles nulos si hubo datos inválidos

    } catch (error) {
      console.error('Error crítico en obtenerFacturas:', error);
      return []; // Devolver array vacío en caso de error grave
    }
  }

  // Modificado para reconstruir instancias si es necesario

  // Modificado para SIEMPRE mapear el dato recuperado de IndexedDB a instancia
  async obtenerFacturaPorId(id) {
    console.log(`[FacturaService] Iniciando obtenerFacturaPorId para ID: ${id}`);
    try {
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            console.error('[FacturaService] obtenerFacturaPorId: ID inválido', id);
            return null;
        }

        // Leer desde IndexedDB (obtendremos un POJO)
        let facturaDataPojo = await super.getById(numericId);

        // Si no se encontró localmente, intentar sincronizar y buscar de nuevo
        if (!facturaDataPojo) {
            console.warn(`[FacturaService] Factura con ID ${numericId} no encontrada localmente. Forzando sync y reintentando...`);
            await this.forceSyncNow();
            facturaDataPojo = await super.getById(numericId); // Intentar leer de nuevo (será POJO si se encuentra)

             if (!facturaDataPojo) {
                 console.error(`[FacturaService] Factura ID ${numericId} NO encontrada incluso después de sincronizar.`);
                 return null; // Realmente no existe o hay un problema mayor
             }
             console.log(`[FacturaService] Factura ID ${numericId} encontrada DESPUÉS de sincronizar.`);
        }

        // *** CORRECCIÓN AQUÍ ***
        // Ya no necesitamos el check 'instanceof', sabemos que facturaDataPojo es un POJO
        // Siempre mapear el POJO recuperado a una instancia de Factura
         console.log(`[FacturaService] Reconstruyendo instancia para Factura ID ${numericId}...`);
        const facturaInstancia = this.mapDataToFacturaInstance(facturaDataPojo);
         if (!facturaInstancia) {
             console.error(`[FacturaService] Falló la reconstrucción de la instancia para ID ${numericId}.`);
              return null; // El mapeo falló
         }
        return facturaInstancia; // Devolver la instancia reconstruida

    } catch (error) {
        console.error(`[FacturaService] ERROR FATAL al obtener factura ${id}:`, error);
        console.error(error.stack);
        return null;
    }
 }
 // Función Helper para mapear POJO a Instancia de Factura
// Función Helper mapDataToFacturaInstance (Asegurarse que está robusta)
 // (La versión que tienes parece buena, solo la incluyo por completitud)
 mapDataToFacturaInstance(facturaData) {
  if (!facturaData || typeof facturaData !== 'object') {
       console.warn("[MapHelper] Se intentó mapear datos inválidos:", facturaData);
      return null; // Retornar null si la data de entrada no es válida
   }

   // Reconstruir detalles PRIMERO
  const detallesInstancias = (facturaData.detalles || []).map((detalleData) => {
      if (!detalleData || typeof detalleData !== 'object') {
            console.warn("[MapHelper Detalle] Datos de detalle inválidos:", detalleData);
            return null; // Saltar detalle inválido
        }
     // Aquí tampoco necesitamos instanceof, creamos siempre
     return new DetalleFactura(
          detalleData.productoId || null, // Manejar posible null/undefined
          detalleData.nombre || 'Nombre detalle no disp.',
          detalleData.precio ?? 0, // Usar ?? para manejar null/undefined y NaN
          detalleData.cantidad ?? 0,
          detalleData.imagen || ''
      );
  }).filter(d => d !== null); // Filtrar detalles nulos

  // Crear instancia de Factura
  const factura = new Factura(facturaData.clienteId || null, detallesInstancias);

  // Copiar propiedades del POJO a la instancia
  // Es más seguro copiar explícitamente las propiedades esperadas
   factura.id = facturaData.id;
   factura.numeroFactura = facturaData.numeroFactura || '';
   factura.fecha = facturaData.fecha || new Date().toISOString(); // Fallback a fecha actual si falta
   factura.subtotal = facturaData.subtotal ?? 0;
   factura.envio = facturaData.envio ?? 0;
   factura.total = facturaData.total ?? 0;
   factura.estado = facturaData.estado || 'pendiente'; // Estado por defecto si falta
   factura.clienteNombre = facturaData.clienteNombre || '';
   factura.clienteTelefono = facturaData.clienteTelefono || '';
   factura.clienteDireccion = facturaData.clienteDireccion || '';
   factura.fechaActualizacion = facturaData.fechaActualizacion || factura.fecha; // Fallback a fecha de creación


   // Validar si el ID está presente después de copiar (muy importante)
    if (factura.id === undefined || factura.id === null) {
         console.error("[MapHelper] ¡Error Crítico! La instancia reconstruida no tiene ID:", facturaData);
         return null; // No devolver una instancia sin ID
    }

   // Opcional: recalcular totales aquí si desconfías de los datos guardados
   // factura.calcularTotales();

  return factura; // Devolver la instancia completa y validada
}


   // Actualizar: Casi igual, pero podría forzar sync al inicio
  async actualizarFactura(id, datosActualizados) {
    let facturaOriginal = null;
    let estadoCambiado = false; // Track si el estado realmente cambia
     let oldEstado = null; // Track estado original
    try {
        // Considerar forzar sync antes de obtener para tener el estado más reciente de GSheet
        // await this.forceSyncNow(); // Descomentar si es necesario, pero puede ralentizar

        facturaOriginal = await this.obtenerFacturaPorId(id); // Usa método mejorado que reconstruye
        if (!facturaOriginal) {
            console.error(`Factura con ID ${id} no encontrada para actualizar.`);
            return null;
        }
         console.log(`[UPD-FACT] Factura Original (ID: ${id}):`, JSON.parse(JSON.stringify(facturaOriginal)));

        // Crear una copia para modificar (trabajar sobre la instancia original)
         const facturaActualizada = facturaOriginal; // Ya es una instancia
         oldEstado = facturaActualizada.estado; // Guardar estado original

        // --- Lógica de Actualización (Principalmente ESTADO) ---
        if (datosActualizados.hasOwnProperty('estado') && datosActualizados.estado !== oldEstado) {
             const nuevoEstado = datosActualizados.estado;
            if(['pendiente', 'completado', 'denegado'].includes(nuevoEstado)) {
                 console.log(`[UPD-FACT ${id}] Intentando cambiar estado de '${oldEstado}' a '${nuevoEstado}'...`);

                // --- AJUSTE DE STOCK BASADO EN CAMBIO DE ESTADO (antes de guardar estado nuevo) ---
                 if (facturaActualizada.detalles && facturaActualizada.detalles.length > 0) {
                     console.log(`[UPD-FACT ${id}] Ajustando stock por cambio de estado a '${nuevoEstado}'...`);
                     for (const detalle of facturaActualizada.detalles) {
                        if (!detalle || !detalle.productoId) {
                             console.warn(`[UPD-FACT ${id}] Detalle inválido o sin productoId, omitiendo ajuste stock:`, detalle);
                            continue;
                         }
                        const producto = await this.productoService.obtenerProductoPorId(detalle.productoId);
                         if (!producto) {
                              console.error(`[UPD-FACT ${id}] Producto ${detalle.productoId} ('${detalle.nombre}') NO encontrado para ajuste de stock!`);
                             // DECISIÓN CRÍTICA: ¿Detener actualización o continuar sin ajustar stock?
                             // Por seguridad, detenemos lanzando error.
                              throw new Error(`Producto asociado al detalle (ID: ${detalle.productoId}, Nombre: ${detalle.nombre}) no encontrado. No se puede ajustar stock ni actualizar estado.`);
                         }

                         let stockChange = 0;
                         // Devolver a stock: Antes NO era 'denegado', AHORA SÍ es 'denegado'
                         if (oldEstado !== 'denegado' && nuevoEstado === 'denegado') {
                              stockChange = detalle.cantidad;
                              console.log(` -> Devolviendo ${stockChange} de '${detalle.nombre}' (ID: ${detalle.productoId})`);
                         // Reducir de stock: Antes ERA 'denegado', AHORA YA NO lo es
                          } else if (oldEstado === 'denegado' && nuevoEstado !== 'denegado') {
                              if (producto.stock < detalle.cantidad) {
                                  // ERROR: No hay stock suficiente para reactivar desde denegada.
                                   console.error(`¡STOCK INSUFICIENTE! para reactivar Factura ${id}. Prod: '${detalle.nombre}', Stock: ${producto.stock}, Req: ${detalle.cantidad}`);
                                   throw new Error(`Stock insuficiente para '${detalle.nombre}' (${producto.stock} disp.) al intentar reactivar la factura ${id} desde el estado 'denegado'.`);
                              }
                              stockChange = -detalle.cantidad;
                              console.log(` -> Reduciendo ${Math.abs(stockChange)} de '${detalle.nombre}' (ID: ${detalle.productoId}) por reactivación.`);
                          }

                         // Aplicar cambio de stock (si es necesario)
                         if (stockChange !== 0) {
                              const stockUpdateResult = await this.productoService.actualizarStock(detalle.productoId, stockChange);
                              if (stockUpdateResult === null || stockUpdateResult === false) {
                                  // ¡FALLO la actualización de stock! Revertir estado NO es fácil aquí.
                                  // Lanzar error es lo más seguro.
                                   console.error(`¡Error CRÍTICO al ajustar stock para '${detalle.nombre}' (ID: ${detalle.productoId})!`);
                                   throw new Error(`Error al actualizar el stock para '${detalle.nombre}' mientras se cambiaba el estado de la factura ${id}. Estado NO actualizado.`);
                              }
                               console.log(`   >> Stock para '${detalle.nombre}' (ID: ${detalle.productoId}) ajustado correctamente.`);
                         }
                     } // Fin for detalles
                     console.log(`[UPD-FACT ${id}] Ajuste de stock completado.`);
                } else {
                      console.log(`[UPD-FACT ${id}] No hay detalles en la factura, no se requiere ajuste de stock.`);
                 }
                 // --- FIN Ajuste de Stock ---


                // Si el ajuste de stock fue exitoso (o no necesario), actualizamos estado y fecha
                facturaActualizada.estado = nuevoEstado;
                facturaActualizada.fechaActualizacion = new Date().toISOString(); // Nueva fecha
                 estadoCambiado = true; // Marcar que hubo cambio
                console.log(`[UPD-FACT ${id}] Estado de factura actualizado a '${nuevoEstado}'`);
            } else {
                console.warn(`[UPD-FACT ${id}] Intento de actualizar a estado inválido: '${datosActualizados.estado}'. No se realizaron cambios.`);
                // No lanzar error, solo ignorar si el estado no es válido
            }
        }

       // Podrían actualizarse otros campos aquí si fuera necesario en el futuro

       // --- GUARDAR y SINCRONIZAR solo si hubo cambios ---
       if (estadoCambiado) {
             console.log(`[UPD-FACT ${id}] Hubo cambio de estado. Guardando en IndexedDB y sincronizando con GSheet...`);
           // 1. Actualizar en IndexedDB
           await super.update(id, facturaActualizada);
             console.log(` -> Factura ${id} actualizada en IndexedDB.`);

           // 2. Sincronizar cambio de estado con Google Sheets
           try {
              const dataParaSync = {
                 id: facturaActualizada.id,
                 estado: facturaActualizada.estado,
                 fechaActualizacion: facturaActualizada.fechaActualizacion // Enviar nueva fecha
              };
              await FacturaService.googleSheetSyncFactura.sync("updateFacturaEstado", dataParaSync);
              console.log(` -> Actualización de estado para factura ${id} enviada a Google Sheets.`);

              // Considerar forzar LECTURA aquí para validar sync, si es necesario
              // await this.forceSyncNow();

           } catch (syncError) {
                console.error(`[SYNC-UPD-ERR ${id}] Error al sincronizar actualización de estado para factura ${id}:`, syncError);
               // Decisión: ¿Qué hacer? El cambio local YA está hecho y el stock (si aplicaba) YA está ajustado.
               // Marcar localmente como 'pendiente sync' podría ser una opción avanzada.
               // Por ahora, solo loguear.
           }

           return facturaActualizada; // Devolver la instancia actualizada

       } else {
           console.log(`[UPD-FACT ${id}] No hubo cambios válidos que guardar o sincronizar.`);
            // Devolver la factura original sin cambios para indicar que no se hizo nada
           return facturaOriginal;
       }

    } catch (error) {
      console.error(`<<<<< ERROR al actualizar factura ${id} >>>>>:`, error);
      // Aquí, revertir cambios de estado/stock es MUY COMPLEJO si el error ocurrió a mitad de camino.
       // Loguear extensivamente es crucial.
        console.error("Stack:", error.stack);

       // NO intentar revertir estado local aquí automáticamente, podría causar inconsistencias mayores.
       // Devolver null para indicar error grave al controlador.
      return null;
    }
  }

  // Eliminar: Igual, pero añadir sync antes si es necesario
  async eliminarFactura(id) {
     console.log(`[DEL-FACT] Iniciando eliminación para factura ID: ${id}`);
     let facturaAEliminar = null;
     try {
         // Obtener la factura para saber su estado y detalles ANTES de eliminar
         // Forzar sync aquí podría ser bueno para evitar eliminar algo que acaba de cambiar
          // await this.forceSyncNow(); // Descomentar si es muy crítico
         facturaAEliminar = await this.obtenerFacturaPorId(id); // Usa método mejorado

         if (!facturaAEliminar) {
             console.warn(`[DEL-FACT] Factura ID ${id} no encontrada localmente. No se puede eliminar (puede que ya no exista o sync pendiente).`);
             // Considerar enviar 'delete' a GSheet igualmente por si existe allí? Es arriesgado.
             return false; // Indicar que no se encontró/eliminó localmente
         }
          console.log(`[DEL-FACT] Factura encontrada (Estado: ${facturaAEliminar.estado}). Procediendo...`);
          const facturaIdAEliminar = facturaAEliminar.id; // Guardar ID

         // 1. REVERTIR STOCK (¡DECISIÓN IMPORTANTE!)
         // Solo revertir si la factura NO estaba ya 'denegado' (en cuyo caso el stock ya se devolvió)
         if (facturaAEliminar.estado !== 'denegado') {
             console.warn(`[DEL-FACT ${id}] Estado era '${facturaAEliminar.estado}'. Devolviendo stock de detalles...`);
             if (facturaAEliminar.detalles && facturaAEliminar.detalles.length > 0) {
                  for (const detalle of facturaAEliminar.detalles) {
                     if (!detalle || !detalle.productoId) continue;
                      console.log(` -> Devolviendo ${detalle.cantidad} para producto ID ${detalle.productoId} ('${detalle.nombre}')`);
                      await this.productoService.actualizarStock(detalle.productoId, detalle.cantidad)
                          .catch(err => console.error(`[DEL-FACT-ERR ${id}] Error al devolver stock para producto ${detalle.productoId}:`, err));
                  }
             } else {
                   console.log(`[DEL-FACT ${id}] No hay detalles, no se requiere devolución de stock.`);
             }
         } else {
              console.log(`[DEL-FACT ${id}] Factura ya estaba 'denegada'. No se devuelve stock.`);
         }

         // 2. Eliminar de IndexedDB
         await super.delete(facturaIdAEliminar);
         console.log(`[DEL-FACT ${id}] Factura eliminada de IndexedDB.`);

         // 3. Sincronizar eliminación con Google Sheets
         try {
             console.log(`[SYNC-DEL-FACT ${id}] Enviando solicitud de eliminación a Google Sheets...`);
             await FacturaService.googleSheetSyncFactura.sync("deleteFactura", { id: facturaIdAEliminar });
             console.log(` -> Solicitud de eliminación para factura ${id} enviada.`);
             // Forzar sync de lectura DESPUÉS de eliminar puede ser útil para refrescar la lista
             // await this.forceSyncNow(); // Opcional
         } catch (syncError) {
             console.error(`[SYNC-DEL-ERR ${id}] Error al sincronizar eliminación de factura ${id}:`, syncError);
              // El registro local YA fue eliminado. Podría quedar 'huérfano' en GSheet.
         }

         return true; // Eliminación local exitosa (sync pudo o no fallar)

     } catch (error) {
         console.error(`<<<<< ERROR al eliminar factura ${id} >>>>>:`, error);
          console.error("Stack:", error.stack);
         // NO intentar revertir stock aquí si falló después de ajustarlo, es muy riesgoso.
         return false; // Indicar fallo
     }
  }

} // Fin Clase FacturaService

export { FacturaService };