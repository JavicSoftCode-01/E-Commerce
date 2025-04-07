// // FrontEnd/public/ui/controllers/CheckoutController.js
// import {IndexedDB} from '../database/indexdDB.js';
// import {Validar} from '../utils/validar.js';
// import {Cliente} from '../models/Cliente.js';
// import GoogleSheetSync from '../database/syncGoogleSheet.js';
// import GoogleSheetReader from '../database/GoogleSheetReader.js';
//
// class ClienteService extends IndexedDB {
//   static googleSheetSyncCliente = new GoogleSheetSync(
//     'https://script.google.com/macros/s/AKfycbyFGaN_Hzq5ycyPXjvNChKDSsftjtyo5fg9Rq9AcrDgA87oO0JjES5ZgbZeyNHZQ0mh/exec'
//   );
//   static googleSheetReaderCliente = new GoogleSheetReader(
//     'https://script.google.com/macros/s/AKfycbyFGaN_Hzq5ycyPXjvNChKDSsftjtyo5fg9Rq9AcrDgA87oO0JjES5ZgbZeyNHZQ0mh/exec'
//   );
//
//   static SYNC_INTERVAL = 3 * 1000;
//
//   constructor() {
//     super('mydb', 'clientes');
//     this.lastSyncTime = null;
//     this.isSyncing = false; // Add a flag to track if a sync is in progress
//     this.startPeriodicSync();
//   }
//
//   startPeriodicSync() {
//     this.syncWithGoogleSheets();
//     setInterval(() => {
//       this.syncWithGoogleSheets();
//     }, ClienteService.SYNC_INTERVAL);
//   }
//
//
//   async syncWithGoogleSheets() {
//     // If a sync is already in progress, wait for it to complete
//     if (this.isSyncing) {
//       console.log('Sync already in progress, waiting...');
//       await new Promise(resolve => {
//         const checkSync = setInterval(() => {
//           if (!this.isSyncing) {
//             clearInterval(checkSync);
//             resolve();
//           }
//         }, 100);
//       });
//     }
//
//     this.isSyncing = true;
//     try {
//       console.log('Iniciando sincronización con Google Sheets para Clientes...');
//       const clientesData = await ClienteService.googleSheetReaderCliente.getData('Cliente');
//       console.log(`Recibidos ${clientesData.length} registros.`);
//       const clientesInstancias = clientesData.map(cData => {
//         const instancia = new Cliente(
//           cData.nombre,
//           cData.telefono,
//           cData.direccion,
//           cData.estado,
//           cData.fechaCreacion,
//           cData.fechaActualizacion,
//           cData.contador
//         );
//         instancia.id = cData.id;
//         return instancia;
//       });
//       await this.clearAll();
//       for (const cliente of clientesInstancias) {
//         await super.add(cliente);
//       }
//       this.lastSyncTime = new Date();
//       console.info(`Sincronización exitosa: ${clientesInstancias.length} registros a las ${this.lastSyncTime}`);
//       return true;
//     } catch (error) {
//       console.error('Error en sincronización:', error);
//       return false;
//     } finally {
//       this.isSyncing = false; // Release the lock
//     }
//   }
//
//   async forceSyncNow() {
//     this.lastSyncTime = null;
//     return await this.syncWithGoogleSheets();
//   }
//
//   async obtenerTodosLosClientes() {
//     try {
//       if (!this.lastSyncTime || (new Date() - this.lastSyncTime) > ClienteService.SYNC_INTERVAL) {
//         await this.syncWithGoogleSheets();
//       }
//       const clientesData = await super.getAll();
//       return clientesData.map(cData => {
//         const instancia = new Cliente(
//           cData.nombre,
//           cData.telefono,
//           cData.direccion,
//           cData.estado,
//           cData.fechaCreacion,
//           cData.fechaActualizacion,
//           cData.contador
//         );
//         instancia.id = cData.id;
//         return instancia;
//       });
//     } catch (error) {
//       console.error('Error al obtener clientes:', error);
//       return [];
//     }
//   }
//
//   async obtenerClientePorId(id) {
//     try {
//       if (!this.lastSyncTime || (new Date() - this.lastSyncTime) > ClienteService.SYNC_INTERVAL) {
//         await this.syncWithGoogleSheets();
//       }
//       const clienteData = await super.getById(id);
//       if (clienteData) {
//         const instanciaCliente = new Cliente(
//           clienteData.nombre,
//           clienteData.telefono,
//           clienteData.direccion,
//           clienteData.estado,
//           clienteData.fechaCreacion,
//           clienteData.fechaActualizacion,
//           clienteData.contador
//         );
//         instanciaCliente.id = clienteData.id;
//         return instanciaCliente;
//       }
//       return null;
//     } catch (error) {
//       console.error(`Error al obtener cliente con ID ${id}:`, error);
//       return null;
//     }
//   }
//
//   async agregarCliente(cliente) {
//     try {
//       // Ensure the latest data is available
//       await this.forceSyncNow();
//
//       const nombreValidado = Validar.nombreBP(cliente.nombre);
//       const direccionValidada = Validar.direccionBP(cliente.direccion);
//       const telefonoValidado = await Validar.telefonoBP(cliente.telefono, this);
//       if (!nombreValidado || !direccionValidada || !telefonoValidado) {
//         return null;
//       }
//
//       // Double-check for existing client by phone number
//       const clienteExistente = await this.obtenerClientePorTelefono(telefonoValidado);
//       if (clienteExistente) {
//         console.error('Error: El número de teléfono ya está registrado.');
//         return null; // No permitir duplicados
//       }
//
//       const lastId = await this.getAll().then(clientes => {
//         if (clientes.length === 0) return 0;
//         return Math.max(...clientes.map(c => c.id));
//       });
//       const nextId = lastId + 1;
//
//       const nuevoCliente = new Cliente(
//         nombreValidado,
//         telefonoValidado,
//         direccionValidada,
//         cliente.estado,
//         null,
//         null,
//         cliente.contador || 0 // Use the provided contador
//       );
//       nuevoCliente.id = nextId;
//       await super.add(nuevoCliente);
//       console.log(`Cliente creado localmente con ID: ${nextId}. Sincronizando...`);
//       await ClienteService.googleSheetSyncCliente.sync("create", nuevoCliente);
//       console.info(`Cliente con ID: ${nextId} sincronizado.`);
//       await this.forceSyncNow();
//       return nuevoCliente;
//     } catch (error) {
//       console.error('Error al agregar cliente:', error);
//       return null;
//     }
//   }
//
//   async actualizarCliente(id, datosActualizados) {
//     try {
//       console.log(`Comenzando actualización de cliente ID ${id}`, datosActualizados);
//       await this.forceSyncNow();
//       const clienteExistente = await this.obtenerClientePorId(id);
//       if (!clienteExistente) return null;
//
//       // Si solo estamos actualizando el estado, hacemos un proceso simplificado
//       if (Object.keys(datosActualizados).length === 1 && datosActualizados.estado !== undefined) {
//         console.log(`Actualizando solo estado a ${datosActualizados.estado} para cliente ID ${id}`);
//         clienteExistente.estado = datosActualizados.estado;
//         clienteExistente.prepareForUpdate();
//         await super.update(id, clienteExistente);
//         console.log(`Cliente con ID ${id} (solo estado) actualizado localmente.`);
//         await ClienteService.googleSheetSyncCliente.sync("update", clienteExistente);
//         console.info(`Cliente con ID ${id} sincronizado con Google Sheets.`);
//         await this.forceSyncNow();
//         return clienteExistente;
//       }
//
//       let nombreValidado = datosActualizados.nombre !== undefined ? Validar.nombreBP(datosActualizados.nombre) : clienteExistente.nombre;
//       let direccionValidada = datosActualizados.direccion !== undefined ? Validar.direccionBP(datosActualizados.direccion) : clienteExistente.direccion;
//       let telefonoValidado = datosActualizados.telefono !== undefined ? await Validar.telefonoBPT(datosActualizados.telefono, this, id) : clienteExistente.telefono;
//       if ((datosActualizados.nombre !== undefined && !nombreValidado) ||
//         (datosActualizados.direccion !== undefined && !direccionValidada) ||
//         (datosActualizados.telefono !== undefined && !telefonoValidado)) {
//         return null;
//       }
//
//       // Verificar si el teléfono ya está en uso por otro cliente
//       const otroCliente = await this.obtenerClientePorTelefono(telefonoValidado);
//       if (otroCliente && otroCliente.id !== id) {
//         console.error('Error: El número de teléfono ya está registrado por otro cliente.');
//         return null;
//       }
//
//       let huboCambios = false;
//       if (clienteExistente.nombre !== nombreValidado) {
//         clienteExistente.nombre = nombreValidado;
//         huboCambios = true;
//       }
//       if (clienteExistente.direccion !== direccionValidada) {
//         clienteExistente.direccion = direccionValidada;
//         huboCambios = true;
//       }
//       if (clienteExistente.telefono !== telefonoValidado) {
//         clienteExistente.telefono = telefonoValidado;
//         huboCambios = true;
//       }
//       if (datosActualizados.estado !== undefined && clienteExistente.estado !== datosActualizados.estado) {
//         clienteExistente.estado = datosActualizados.estado;
//         huboCambios = true;
//       }
//       if (huboCambios) {
//         clienteExistente.prepareForUpdate();
//         await super.update(id, clienteExistente);
//         console.log(`Cliente con ID ${id} actualizado localmente.`);
//         await ClienteService.googleSheetSyncCliente.sync("update", clienteExistente);
//         console.info(`Cliente con ID ${id} sincronizado.`);
//         await this.forceSyncNow();
//         return clienteExistente;
//       }
//       console.info(`Cliente con ID ${id} sin cambios.`);
//       return clienteExistente;
//     } catch (error) {
//       console.error(`Error al actualizar cliente con ID ${id}:`, error);
//       return null;
//     }
//   }
//
//   async eliminarCliente(id) {
//     try {
//       await this.forceSyncNow();
//       await super.delete(id);
//       console.log(`Cliente con ID ${id} eliminado localmente.`);
//       await ClienteService.googleSheetSyncCliente.sync("delete", {id: id});
//       console.info(`Cliente con ID ${id} eliminado y sincronizado.`);
//       await this.forceSyncNow();
//       return true;
//     } catch (error) {
//       console.error(`Error al eliminar cliente con ID ${id}:`, error);
//       return null;
//     }
//   }
//
//   async clearAll() {
//     try {
//       const db = await this.dbPromise;
//       const transaction = db.transaction([this.storeName], 'readwrite');
//       const store = transaction.objectStore(this.storeName);
//       store.clear();
//       console.info('IndexedDB limpiado.');
//     } catch (error) {
//       console.error('Error al limpiar IndexedDB:', error);
//     }
//   }
//
//   async obtenerClientePorTelefono(telefono) {
//     try {
//       const clientes = await this.obtenerTodosLosClientes();
//       return clientes.find(cliente => cliente.telefono === telefono) || null;
//     } catch (error) {
//       console.error(`Error al buscar cliente por teléfono ${telefono}:`, error);
//       return null;
//     }
//   }
//
//   // async incrementarContadorCliente(id) {
//   //   try {
//   //     const cliente = await this.obtenerClientePorId(id);
//   //     if (!cliente) {
//   //       console.error(`Cliente con ID ${id} no encontrado`);
//   //       return null;
//   //     }
//   //     cliente.incrementarContador();
//   //     await super.update(id, cliente);
//   //     console.info(`Contador incrementado para cliente con ID ${id}. Nuevo valor: ${cliente.contador}`);
//   //     await ClienteService.googleSheetSyncCliente.sync("update", cliente);
//   //     console.info(`Cliente con ID ${id} sincronizado con Google Sheets después de incrementar contador.`);
//   //     await this.forceSyncNow();
//   //     return cliente;
//   //   } catch (error) {
//   //     console.error(`Error al incrementar contador para cliente con ID ${id}:`, error);
//   //     return null;
//   //   }
//   // }
//   async incrementarContadorCliente(id) {
//     try {
//       // It might be safer to forceSync here to ensure we have the absolute latest
//       // version before incrementing, although obtenerClientePorId should trigger
//       // a sync if needed based on the interval logic. Let's add it for safety
//       // in case of rapid operations.
//       await this.forceSyncNow(); // Get latest state
//
//       const cliente = await this.obtenerClientePorId(id); // Get the current state after sync
//       if (!cliente) {
//         console.error(`Cliente con ID ${id} no encontrado para incrementar contador.`);
//         return null;
//       }
//
//       cliente.incrementarContador(); // Call the model's method to increment
//       // If your Cliente model has a method like prepareForUpdate to set fechaActualizacion, call it here.
//       // Assuming it exists based on the 'actualizarCliente' method:
//       if (typeof cliente.prepareForUpdate === 'function') {
//         cliente.prepareForUpdate(); // Set fechaActualizacion
//       } else {
//         // If no specific method, manually update the timestamp if your model doesn't auto-handle it
//         cliente.fechaActualizacion = new Date().toISOString(); // Or however your date format is handled
//         console.warn("Cliente model does not have prepareForUpdate method. Manually setting fechaActualizacion.");
//       }
//
//
//       // Update locally in IndexedDB
//       const success = await super.update(id, cliente); // super.update should return true/false or throw on error
//       if (!success) {
//         console.error(`Fallo al actualizar localmente el contador para cliente ID ${id} en IndexedDB.`);
//         // Decide if you should proceed with sync or return null. Probably safer to return null.
//         return null;
//       }
//       console.info(`Contador incrementado y actualizado localmente para cliente ID ${id}. Nuevo valor: ${cliente.contador}, Fecha Actualización: ${cliente.fechaActualizacion}`);
//
//       // Synchronize the update with Google Sheets
//       await ClienteService.googleSheetSyncCliente.sync("update", cliente);
//       console.info(`Actualización de contador para cliente ID ${id} enviada a sincronización con Google Sheets.`);
//
//       // Optionally, force another sync immediately after updating Google Sheets
//       // to pull the potentially confirmed state back down. This might be slightly
//       // overkill but ensures the local state reflects the (attempted) backend state ASAP.
//       // However, sync intervals might handle this anyway. Consider if needed for your flow.
//       // await this.forceSyncNow();
//
//       return cliente; // Return the updated client object
//
//     } catch (error) {
//       console.error(`Error al incrementar contador para cliente con ID ${id}:`, error);
//       // Ensure we return null on error so the calling function knows it failed
//       return null;
//     }
//   }
//
// }
//
// export {ClienteService};

// FrontEnd/public/ui/services/ClienteService.js
import { IndexedDB } from '../database/indexdDB.js';
import { Validar } from '../utils/validar.js'; // Adjust path if needed
import { Cliente } from '../models/Cliente.js'; // Adjust path if needed
import GoogleSheetSync from '../database/syncGoogleSheet.js';
import GoogleSheetReader from '../database/GoogleSheetReader.js';

// --- Helper Function for Phone Normalization ---
// Can be placed outside the class or as a private static method if using newer JS syntax

// FrontEnd/public/ui/services/serviceUtils.js OR wherever normalizePhoneNumber is defined

function normalizePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
        console.warn("normalizePhoneNumber: Input is not a valid string:", phone);
        return null; // Return null for invalid input type
    }

    // 1. Remove common visual separators and emojis (more aggressive cleaning)
    //    Keep '+' only if it's potentially the leading country code sign.
    //    This regex removes anything that isn't a digit OR isn't the very first character IF that character is '+'.
    let cleaned = phone.replace(/[^\d+]|(?!^)\+/g, "");
    // Example Breakdown:
    // [^\d+]  - Matches any character that is NOT a digit (\d) and NOT a literal plus sign (+).
    // |        - OR
    // (?!^)\+ - Matches a literal plus sign (+) ONLY if it is NOT at the beginning of the string (?!^).

    // If after cleaning, it lost a potentially valid starting plus, add it back if needed based on common patterns.
    // This part is a bit tricky, maybe rely on subsequent checks instead. For now, stick with the cleaned result.

    console.log(`normalizePhoneNumber: Initial cleaning result for "${phone}": "${cleaned}"`); // Debug log

    // 2. Check for Ecuadorian patterns and standardize to +593XXXXXXXXX
    let normalized = cleaned; // Start with the cleaned string

    if (normalized.startsWith('09') && normalized.length === 10) {
        normalized = '+593' + normalized.substring(1); // 09... -> +5939...
        console.log(`normalizePhoneNumber: Applied 09 rule. Result: ${normalized}`);
    } else if (normalized.length === 9 && normalized.startsWith('9')) {
        normalized = '+593' + normalized; // 9... -> +5939...
        console.log(`normalizePhoneNumber: Applied 9 rule. Result: ${normalized}`);
    } else if (normalized.length === 12 && normalized.startsWith('593')) {
        normalized = '+' + normalized; // 593... -> +593...
        console.log(`normalizePhoneNumber: Applied 593 rule. Result: ${normalized}`);
    } else if (normalized.startsWith('+593') && normalized.length === 13) {
        // Already looks good
         console.log(`normalizePhoneNumber: Already in target format. Result: ${normalized}`);
    } else {
        // It didn't match standard formats after cleaning.
        console.warn(`normalizePhoneNumber: Number "${cleaned}" (from "${phone}") did not conform to expected Ecuador formats (+593XXXXXXXXX, 09XXXXXXXX, 9XXXXXXXX, 593XXXXXXXXX). Returning null or the cleaned version for flexibility might be needed.`);
        // DECISION: Should we return null if it's not perfectly formatted, or the best effort 'cleaned'?
        // Returning null might be safer to prevent storing poorly formatted numbers.
        // Returning 'cleaned' might allow for other country codes but less strict validation.
        // Let's return null for stricter validation based on the requirements seen so far.
        return null; // Return null if not fitting expected Ecuador formats
    }

    // Final sanity check - should always be true if logic above is correct and returns
    if (normalized.startsWith('+593') && normalized.length === 13) {
        return normalized;
    } else {
       // This case should ideally not be reached if we return null above.
       console.error(`normalizePhoneNumber: Logic error - reached end without valid format for "${phone}". Cleaned: "${cleaned}", Normalized Attempt: "${normalized}"`);
       return null;
    }
}

// Export if it's in a separate utility file
// export { normalizePhoneNumber };


class ClienteService extends IndexedDB {
    static googleSheetSyncCliente = new GoogleSheetSync(
        'https://script.google.com/macros/s/AKfycbyFGaN_Hzq5ycyPXjvNChKDSsftjtyo5fg9Rq9AcrDgA87oO0JjES5ZgbZeyNHZQ0mh/exec' // Replace with your actual URL
    );
    static googleSheetReaderCliente = new GoogleSheetReader(
        'https://script.google.com/macros/s/AKfycbyFGaN_Hzq5ycyPXjvNChKDSsftjtyo5fg9Rq9AcrDgA87oO0JjES5ZgbZeyNHZQ0mh/exec' // Replace with your actual URL
    );

    static SYNC_INTERVAL = 5 * 1000; // Increased sync interval slightly

    constructor() {
        super('mydb', 'clientes'); // Use your actual DB and store names
        this.lastSyncTime = null;
        this.isSyncing = false;
        this.syncQueue = Promise.resolve(); // Promise chain to queue sync requests
        this.startPeriodicSync();
        console.log("ClienteService Initialized");
    }

    startPeriodicSync() {
        // Initial sync after a short delay to allow DB init
        setTimeout(() => this.syncWithGoogleSheets(), 2000);
        setInterval(() => {
            this.syncWithGoogleSheets();
        }, ClienteService.SYNC_INTERVAL);
    }

    // Queue sync operations to prevent overlapping runs
    syncWithGoogleSheets() {
       this.syncQueue = this.syncQueue.then(async () => {
         if (this.isSyncing) {
             console.log('Sync already in progress, skipping scheduled run.');
             return false; // Skip if already running
         }

         this.isSyncing = true;
         console.log('[SYNC] Starting synchronization with Google Sheets...');
         try {
             const startTime = performance.now();
             const clientesData = await ClienteService.googleSheetReaderCliente.getData('Cliente'); // Fetch sheet name
             console.log(`[SYNC] Received ${clientesData.length} records from Google Sheets.`);

              // --- Deduplication and Normalization during Sync ---
              const uniqueClientesMap = new Map();
              clientesData.forEach(cData => {
                  try {
                     const normalizedPhone = normalizePhoneNumber(cData.telefono);
                     const clienteKey = normalizedPhone || `id-${cData.id}`; // Use normalized phone or ID as key

                      if (!clienteKey) {
                         console.warn(`[SYNC] Skipping record with invalid phone/ID during sync:`, cData);
                         return;
                      }

                     // Prioritize keeping the record with the most recent update date if duplicates found
                      const existingEntry = uniqueClientesMap.get(clienteKey);
                      let incomingDate = new Date(cData.fechaActualizacion || cData.fechaCreacion || 0);
                      let existingDate = existingEntry ? new Date(existingEntry.fechaActualizacion || existingEntry.fechaCreacion || 0) : new Date(0);

                      if (!existingEntry || incomingDate > existingDate) {
                         // Map properties carefully, ensure defaults if needed
                         const clienteInstanceData = {
                           id: cData.id, // Ensure ID is present
                           nombre: cData.nombre || 'N/A',
                           telefono: normalizedPhone || cData.telefono || 'N/A', // Store normalized phone
                           direccion: cData.direccion || 'N/A',
                           estado: cData.estado || 'Activo',
                           fechaCreacion: cData.fechaCreacion || new Date().toISOString(),
                           fechaActualizacion: cData.fechaActualizacion || cData.fechaCreacion || new Date().toISOString(),
                           contador: parseInt(cData.contador, 10) || 0
                         };
                         uniqueClientesMap.set(clienteKey, clienteInstanceData);
                      }
                  } catch (parseError) {
                       console.error(`[SYNC] Error processing record during sync normalization: ${parseError}`, cData);
                  }
              });
             const clientesInstancias = Array.from(uniqueClientesMap.values());
             console.log(`[SYNC] ${clientesInstancias.length} unique records identified after deduplication/normalization.`);


             // --- Clear and Repopulate IndexedDB ---
             await this.clearAllLocal(); // Clear only local before repopulating
             for (const clienteData of clientesInstancias) {
                 // No need to create full 'Cliente' model instances just for storing
                 await super.add(clienteData); // Add plain object data
             }

             this.lastSyncTime = new Date();
             const endTime = performance.now();
             console.info(`[SYNC] Synchronization successful: ${clientesInstancias.length} records loaded in ${(endTime - startTime).toFixed(2)} ms. Last sync: ${this.lastSyncTime.toLocaleTimeString()}`);
             return true;
         } catch (error) {
             console.error('[SYNC] Error during synchronization:', error);
             return false;
         } finally {
             this.isSyncing = false;
              console.log('[SYNC] Sync process finished.');
         }
        }).catch(err => {
             // Catch errors in the promise chain itself
             console.error("[SYNC QUEUE] Error in sync queue execution:", err);
             this.isSyncing = false; // Ensure lock is released on unexpected chain errors
         });
       return this.syncQueue;
    }

     async forceSyncNow() {
       console.log('[SYNC] Force sync requested.');
       this.lastSyncTime = null; // Invalidate last sync time to trigger fetch
       // Wait for any ongoing sync to finish before starting a new one
       await this.syncQueue;
       // Now trigger a new sync and wait for it
       await this.syncWithGoogleSheets();
       console.log('[SYNC] Force sync finished.');
     }

    // Method to clear only local IndexedDB without triggering sheet operations
     async clearAllLocal() {
        try {
            console.log('[DB] Clearing local IndexedDB store: ' + this.storeName);
            const db = await this.dbPromise;
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();
            await new Promise((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = (event) => {
                    console.error(`[DB] Error clearing store ${this.storeName}:`, event.target.error);
                    reject(event.target.error);
                };
            });
            console.info(`[DB] Local store ${this.storeName} cleared successfully.`);
        } catch (error) {
            console.error(`[DB] Error in clearAllLocal for ${this.storeName}:`, error);
        }
     }


    async obtenerTodosLosClientes() {
        try {
            // Wait for any active sync before reading
            await this.syncQueue;
            // Conditional sync based on time elapsed (optional, as periodic sync exists)
            // if (!this.lastSyncTime || (new Date() - this.lastSyncTime) > ClienteService.SYNC_INTERVAL) {
            //   await this.syncWithGoogleSheets();
            // }
            const clientesData = await super.getAll();
            console.log(`[DB] Retrieved ${clientesData.length} clients from local DB.`);
            // Return plain data objects unless full instances are needed upstream
             return clientesData.map(cData => {
                 const instancia = new Cliente(
                     cData.nombre, cData.telefono, cData.direccion, cData.estado,
                     cData.fechaCreacion, cData.fechaActualizacion, cData.contador
                 );
                 instancia.id = cData.id;
                 return instancia;
             });
        } catch (error) {
            console.error('[DB] Error obtaining all clients:', error);
            return [];
        }
    }

    async obtenerClientePorId(id) {
       try {
         await this.syncQueue; // Ensure sync isn't writing while we read
         const clienteData = await super.getById(id);
         if (clienteData) {
             console.log(`[DB] Found client by ID ${id}.`);
             const instanciaCliente = new Cliente(
                 clienteData.nombre, clienteData.telefono, clienteData.direccion,
                 clienteData.estado, clienteData.fechaCreacion, clienteData.fechaActualizacion,
                 clienteData.contador
             );
             instanciaCliente.id = clienteData.id;
             return instanciaCliente;
         }
          console.log(`[DB] Client with ID ${id} not found locally.`);
         return null;
       } catch (error) {
         console.error(`[DB] Error getting client by ID ${id}:`, error);
         return null;
       }
    }

   async obtenerClientePorTelefono(telefono) {
        try {
             await this.syncQueue; // Wait for sync completion before searching

             const normalizedTelefono = normalizePhoneNumber(telefono);
             if (!normalizedTelefono) {
                 console.warn("[VALIDATION] Invalid phone number provided for search:", telefono);
                 return null;
             }

             // It's generally safer to read from the local DB which should be recently synced
             const clientes = await super.getAll();
             console.log(`[SEARCH] Searching for normalized phone "${normalizedTelefono}" in ${clientes.length} local clients.`);

             const foundClientData = clientes.find(cliente => {
                 const storedNormalized = normalizePhoneNumber(cliente.telefono);
                 return storedNormalized === normalizedTelefono;
             });

             if (foundClientData) {
                 console.log(`[SEARCH] Client FOUND by phone "${telefono}" (Normalized: "${normalizedTelefono}"):`, foundClientData);
                 // Return a full Cliente instance
                 const instance = new Cliente(
                    foundClientData.nombre, foundClientData.telefono, foundClientData.direccion, foundClientData.estado,
                    foundClientData.fechaCreacion, foundClientData.fechaActualizacion, foundClientData.contador
                 );
                 instance.id = foundClientData.id;
                 return instance;
             } else {
                 console.log(`[SEARCH] Client with phone "${telefono}" (Normalized: "${normalizedTelefono}") NOT found locally.`);
                 return null;
             }
         } catch (error) {
             console.error(`[SEARCH] Error searching client by phone "${telefono}":`, error);
             return null;
         }
   }


  async agregarCliente(clienteData) {
        try {
            console.log("[ACTION] Attempting to add client:", clienteData);
            await this.forceSyncNow();

            const telefonoNormalizado = normalizePhoneNumber(clienteData.telefono);
            if (!telefonoNormalizado) {
                console.error('[VALIDATION] Invalid phone for new client:', clienteData.telefono);
                alert("El número de teléfono proporcionado no es válido.");
                return null;
            }
            const telefonoParaUsar = telefonoNormalizado;

            const nombreValidado = Validar.nombreBP(clienteData.nombre);
            const direccionValidada = Validar.direccionBP(clienteData.direccion);
            if (!nombreValidado || !direccionValidada) {
                 console.error("[VALIDATION] Failed name/address validation");
                  alert("El nombre o la dirección no son válidos.");
                 return null;
            }

            console.log(`[DUPLICATE CHECK] Checking for phone: ${telefonoParaUsar}`);
            const clienteExistente = await this.obtenerClientePorTelefono(telefonoParaUsar);
            if (clienteExistente) {
                 console.error(`[DUPLICATE CHECK] Error: Phone ${telefonoParaUsar} already exists (ID: ${clienteExistente.id}).`);
                 alert(`Error: El número de teléfono ${telefonoParaUsar} ya está registrado.`);
                 return null;
            }

            const allClientes = await super.getAll();
            const lastId = allClientes.length === 0 ? 0 : Math.max(0, ...allClientes.map(c => c.id || 0));
            const nextId = lastId + 1;

            const ahoraISO = new Date().toISOString();
            const nuevoCliente = new Cliente(
                nombreValidado, telefonoParaUsar, direccionValidada,
                clienteData.estado || 'Activo', ahoraISO, ahoraISO,
                clienteData.contador // Expecting 1 from checkout
            );
            nuevoCliente.id = nextId;

            // --- FIX HERE: Create plain object for IndexedDB ---
            const clienteDataForDb = {
                id: nuevoCliente.id,
                nombre: nuevoCliente.nombre,
                telefono: nuevoCliente.telefono,
                direccion: nuevoCliente.direccion,
                estado: nuevoCliente.estado,
                fechaCreacion: nuevoCliente.fechaCreacion,
                fechaActualizacion: nuevoCliente.fechaActualizacion,
                contador: nuevoCliente.contador
            };
            // --- End Fix ---

            await super.add(clienteDataForDb); // Add the plain object
            console.log(`[DB] Client added locally with ID ${nextId}. Preparing sync...`);

            await ClienteService.googleSheetSyncCliente.sync("create", nuevoCliente); // Sync uses the instance
            console.info(`[SYNC] Create request sent for client ID ${nextId}.`);

            return nuevoCliente;

        } catch (error) {
            // Catch block specifically for the toJSON error now removed
            // Keep generic catch
            console.error('[ACTION] Error adding client:', error);
             if (!alert.alreadyShown) { // Basic flag to prevent multiple alerts if error bubbles
                alert("Ocurrió un error inesperado al intentar registrar el cliente.");
                 alert.alreadyShown = true;
                 setTimeout(() => { alert.alreadyShown = false; }, 1000); // Reset flag
             }
            return null;
        }
    }

    async actualizarCliente(id, datosActualizados) {
        try {
            console.log(`[ACTION] Attempting update for client ID ${id}:`, datosActualizados);
            await this.forceSyncNow();
            const clienteExistente = await this.obtenerClientePorId(id);
            if (!clienteExistente) { /* ... handle not found ... */ return null; }

            let huboCambios = false;
            const updatesToApply = {};

            // ... (Validation logic for name, address, estado - unchanged) ...
             for (const key in datosActualizados) {
                 if (Object.hasOwnProperty.call(datosActualizados, key)) {
                     let newValue = datosActualizados[key];
                     let currentValue = clienteExistente[key];
                     if (key === 'telefono') { /* ... handle phone update with normalization/check ... */
                          const telefonoNormalizadoNuevo = normalizePhoneNumber(newValue);
                           if (!telefonoNormalizadoNuevo) throw new Error("Teléfono inválido");
                           if (normalizePhoneNumber(currentValue) !== telefonoNormalizadoNuevo) {
                                const otroCliente = await this.obtenerClientePorTelefono(telefonoNormalizadoNuevo);
                                if (otroCliente && otroCliente.id !== id) throw new Error("Teléfono duplicado");
                                updatesToApply[key] = telefonoNormalizadoNuevo;
                                huboCambios = true;
                           }
                     } else if (key === 'nombre') { /* ... validate ... */
                          if (newValue !== currentValue) {
                            if(!Validar.nombreBP(newValue)) throw new Error("Nombre inválido");
                            updatesToApply[key] = newValue; huboCambios = true;
                          }
                     } else if (key === 'direccion') { /* ... validate ... */
                           if (newValue !== currentValue) {
                            if(!Validar.direccionBP(newValue)) throw new Error("Dirección inválida");
                            updatesToApply[key] = newValue; huboCambios = true;
                           }
                     } else if (key === 'estado') { /* ... validate ... */
                           if (newValue !== currentValue && ['Activo', 'Inactivo'].includes(newValue)) {
                             updatesToApply[key] = newValue; huboCambios = true;
                           }
                     } 
                 }
             }

            if (huboCambios) {
                Object.assign(clienteExistente, updatesToApply); // Apply changes to instance
                clienteExistente.fechaActualizacion = new Date().toISOString(); // Update timestamp

                // --- FIX HERE: Create plain object for IndexedDB update ---
                const clienteDataForDb = {
                    id: clienteExistente.id,
                    nombre: clienteExistente.nombre,
                    telefono: clienteExistente.telefono,
                    direccion: clienteExistente.direccion,
                    estado: clienteExistente.estado,
                    fechaCreacion: clienteExistente.fechaCreacion, // Keep original creation date
                    fechaActualizacion: clienteExistente.fechaActualizacion,
                    contador: clienteExistente.contador // Keep current counter
                };
                 // --- End Fix ---

                await super.update(id, clienteDataForDb); // Update with plain object
                console.log(`[DB] Client ID ${id} updated locally.`);

                await ClienteService.googleSheetSyncCliente.sync("update", clienteExistente); // Sync uses instance
                console.info(`[SYNC] Update request sent for client ID ${id}.`);
                return clienteExistente;
            } else {
                console.info(`[ACTION] No effective changes for client ID ${id}.`);
                return clienteExistente;
            }
        } catch (error) {
             console.error(`[ACTION] Error updating client ID ${id}:`, error);
              if (!alert.alreadyShown) { /* ... show alert ... */ alert.alreadyShown = true; /*...*/ }
             return null;
        }
    }

     async incrementarContadorCliente(id) {
        try {
             console.log(`[ACTION] Incrementing counter for client ID ${id}.`);
             const cliente = await this.obtenerClientePorId(id);
             if (!cliente) { /* handle error */ return null; }

             cliente.incrementarContador(); // Assumes this method exists on Cliente class
             cliente.fechaActualizacion = new Date().toISOString();

            // --- FIX HERE: Create plain object for IndexedDB update ---
            const clienteDataForDb = {
                id: cliente.id,
                nombre: cliente.nombre,
                telefono: cliente.telefono,
                direccion: cliente.direccion,
                estado: cliente.estado,
                fechaCreacion: cliente.fechaCreacion,
                fechaActualizacion: cliente.fechaActualizacion,
                contador: cliente.contador // The updated counter
            };
            // --- End Fix ---

             const success = await super.update(id, clienteDataForDb); // Update plain object
             if (!success) { console.error(`[DB] Failed local update counter ID ${id}.`); return null; }
             console.info(`[DB] Counter updated locally for ID ${id}. New: ${cliente.contador}`);

             await ClienteService.googleSheetSyncCliente.sync("update", cliente); // Sync uses instance
             console.info(`[SYNC] Counter update request sent for ID ${id}.`);

             return cliente;

        } catch (error) {
             console.error(`[ACTION] Error incrementing counter ID ${id}:`, error);
             if (!alert.alreadyShown) { /* ... show alert ... */ alert.alreadyShown = true; /*...*/ }
             return null;
        }
    }

   async eliminarCliente(id) {
      try {
          console.log(`[ACTION] Attempting to delete client ID ${id}.`);
          // Force sync might be good here to ensure we are deleting the right thing? Debatable.
          // await this.forceSyncNow();

          const cliente = await this.obtenerClientePorId(id);
           if (!cliente) {
             console.warn(`[ACTION] Client ID ${id} not found locally for deletion. Sending delete sync anyway.`);
             // Allow sending delete request even if not found locally, it might exist in sheet
           }

          await super.delete(id);
          console.log(`[DB] Client ID ${id} deleted locally (if existed).`);

          // Sync delete event (pass object with just ID)
          await ClienteService.googleSheetSyncCliente.sync("delete", { id: id });
          console.info(`[SYNC] Delete request for client ID ${id} sent.`);

          // await this.forceSyncNow(); // Refresh local state after delete

          return true;
      } catch (error) {
          console.error(`[ACTION] Error deleting client ID ${id}:`, error);
          alert("Ocurrió un error inesperado al intentar eliminar el cliente.");
          return false; // Indicate failure
      }
   }
}

export { ClienteService, normalizePhoneNumber }; // Export normalize if needed elsewhere