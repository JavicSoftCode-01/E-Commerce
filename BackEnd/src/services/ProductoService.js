// BackEnd/src/services/ProductoService.js
import {IndexedDB} from '../database/indexdDB.js';
import {Validar} from '../utils/validar.js';
import {Producto} from '../models/Producto.js';
import GoogleSheetSync from '../database/syncGoogleSheet.js';
import GoogleSheetReader from '../database/GoogleSheetReader.js';

class ProductoService extends IndexedDB {
  static googleSheetSyncProducto = new GoogleSheetSync('https://script.google.com/macros/s/AKfycbzUbjRtK4pXL3c9oJaBAA_tuXkxD5mUw3LpWy2bbmCszwuIeYM0Nisx7Mt3zVNU86so/exec');
  static googleSheetReaderProducto = new GoogleSheetReader('https://script.google.com/macros/s/AKfycbzUbjRtK4pXL3c9oJaBAA_tuXkxD5mUw3LpWy2bbmCszwuIeYM0Nisx7Mt3zVNU86so/exec');
  static SYNC_INTERVAL = 3000; // 3 seconds

  constructor(categoriaService, marcaService, proveedorService) {
    super('mydb', 'productos');
    this.categoriaService = categoriaService;
    this.marcaService = marcaService;
    this.proveedorService = proveedorService;
    console.log('ProductoService - Dependencias:', {
      categoriaService: this.categoriaService,
      marcaService: this.marcaService,
      proveedorService: this.proveedorService
    });
    this.lastSyncTime = null;
    this.startPeriodicSync();
    this.googleSheetReaderProducto = new GoogleSheetReader('https://script.google.com/macros/s/AKfycbzUbjRtK4pXL3c9oJaBAA_tuXkxD5mUw3LpWy2bbmCszwuIeYM0Nisx7Mt3zVNU86so/exec');

  }

  startPeriodicSync() {
    this.syncWithGoogleSheets();
    setInterval(() => this.syncWithGoogleSheets(), ProductoService.SYNC_INTERVAL);
  }

  // Método para forzar sincronización
  async forceSyncNow() {
    return await this.syncWithGoogleSheets();
  }

  // async syncWithGoogleSheets() {
  //   try {
  //     console.log('[SYNC] Iniciando sincronización de productos...');
  //     const productosData = await this.googleSheetReaderProducto.getData('Producto');
  //
  //     if (!productosData) {
  //       console.warn('[SYNC] getData devolvió null/undefined.');
  //       return false;
  //     }
  //     if (productosData.length === 0) {
  //       console.info('[SYNC] No se encontraron datos en Google Sheet.');
  //       await this.clearAll();
  //       this.lastSyncTime = new Date();
  //       return true;
  //     }
  //
  //     console.log('[SYNC] Datos crudos recibidos (1ra fila):', productosData[0]);
  //
  //     const productosInstancias = productosData.map((pData, rowIndex) => {
  //       // --->>> Proceso de Parseo y Conversión en JavaScript <<<---
  //       try {
  //         // --- Números Enteros (IDs, Cantidad) ---
  //         const parseToIntOrNull = (value) => {
  //           if (value === undefined || value === null || String(value).trim() === '') {
  //             return null; // Tratar vacíos/nulos como null
  //           }
  //           const num = parseInt(value, 10);
  //           return !isNaN(num) ? num : null; // Convertir o null si no es número
  //         };
  //
  //         const id = parseToIntOrNull(pData.id); // ID principal
  //         const categoriaId = parseToIntOrNull(pData.categoriaId);
  //         const marcaId = parseToIntOrNull(pData.marcaId);
  //         const proveedorId = parseToIntOrNull(pData.proveedorId);
  //         const cantidad = parseToIntOrNull(pData.cantidad) ?? 0; // Cantidad: null -> 0
  //
  //         // --- Números Decimales (Precio, PVP) ---
  //         const parseToFloatOrNull = (value) => {
  //           if (value === undefined || value === null || String(value).trim() === '') {
  //             return null; // Tratar vacíos/nulos como null
  //           }
  //           // Reemplazar coma por punto si es necesario para formato decimal
  //           const strValue = String(value).replace(',', '.');
  //           const num = parseFloat(strValue);
  //           return !isNaN(num) ? num : null; // Convertir o null si no es número
  //         };
  //
  //         const precio = parseToFloatOrNull(pData.precio) ?? 0; // Precio: null -> 0
  //         const pvp = parseToFloatOrNull(pData.pvp) ?? 0;       // PVP: null -> 0
  //
  //         // --- Strings (Nombres, Descripción, Imagen) ---
  //         const parseToString = (value) => {
  //           return (value === undefined || value === null) ? "" : String(value).trim();
  //         };
  //
  //         const nombre = parseToString(pData.nombre);
  //         const categoriaNombre = parseToString(pData.categoriaNombre); // Usar el nombre que viene de la hoja
  //         const marcaNombre = parseToString(pData.marcaNombre);         // Usar el nombre que viene de la hoja
  //         const proveedorNombre = parseToString(pData.proveedorNombre); // Usar el nombre que viene de la hoja
  //         const descripcion = parseToString(pData.descripcion);
  //         const imagen = parseToString(pData.imagen);
  //
  //
  //         // --- Booleano (Estado) ---
  //         let estado = false;
  //         const estadoRaw = pData.estado;
  //         if (typeof estadoRaw === 'boolean') {
  //           estado = estadoRaw;
  //         } else if (typeof estadoRaw === 'string') {
  //           estado = estadoRaw.trim().toUpperCase() === 'TRUE' || estadoRaw.trim() === '1' || estadoRaw.trim().toUpperCase() === 'VERDADERO';
  //         } else if (typeof estadoRaw === 'number') {
  //           estado = estadoRaw === 1;
  //         }
  //
  //         // --- Fechas ---
  //         // (Asumimos que vienen como strings o ya son parseables por new Date())
  //         const fechaCreacion = pData.fechaCreacion ? new Date(pData.fechaCreacion).toISOString() : new Date().toISOString();
  //         const fechaActualizacion = pData.fechaActualizacion ? new Date(pData.fechaActualizacion).toISOString() : new Date().toISOString();
  //
  //
  //         // --- Validación Mínima ---
  //         if (id === null) {
  //           console.warn(`[SYNC] Fila ${rowIndex + 1} omitida: ID inválido o faltante. Datos:`, pData);
  //           return null; // Omite este registro si no tiene ID válido
  //         }
  //         if (!nombre) { // Permitir guardar incluso sin nombre, pero con advertencia
  //           console.warn(`[SYNC] Fila ${rowIndex + 1} (ID: ${id}): Nombre faltante.`);
  //         }
  //
  //
  //         // Crear Instancia de Producto
  //         const instancia = new Producto(
  //           nombre, estado, fechaCreacion, fechaActualizacion,
  //           categoriaId,
  //           // Si el nombre de la hoja está vacío Y el ID NO es null, usa placeholder. Si no, usa el de la hoja o ""
  //           (categoriaNombre === "" && categoriaId !== null) ? 'Sin categoría' : categoriaNombre,
  //           marcaId,
  //           (marcaNombre === "" && marcaId !== null) ? 'Sin marca' : marcaNombre,
  //           proveedorId,
  //           (proveedorNombre === "" && proveedorId !== null) ? 'Sin proveedor' : proveedorNombre,
  //           precio, pvp, cantidad,
  //           descripcion, imagen
  //         );
  //         instancia.id = id;
  //         instancia.stock = cantidad; // Stock usa la cantidad parseada
  //
  //         // console.log('[SYNC] Instancia Creada:', instancia); // Descomenta si necesitas depurar la instancia
  //         return instancia;
  //
  //       } catch (parseError) {
  //         console.error(`[SYNC] Error parseando fila ${rowIndex + 1}:`, pData, parseError);
  //         return null; // Omite la fila con error de parseo
  //       }
  //
  //     }).filter(p => p !== null); // Filtra los registros nulos (omitidos por error o validación de ID)
  //
  //     console.log(`[SYNC] Parseados ${productosInstancias.length} productos válidos localmente.`);
  //
  //     // ---- Actualización de IndexedDB (sin cambios aquí) ----
  //     await this.clearAll();
  //     const db = await this.dbPromise;
  //     const transaction = db.transaction(this.storeName, 'readwrite');
  //     const store = transaction.objectStore(this.storeName);
  //     let addedCount = 0;
  //     for (const producto of productosInstancias) {
  //       // Última validación antes de guardar
  //       if (producto.id === null || isNaN(producto.id)) {
  //         console.warn("[SYNC-DB] Intentando guardar producto con ID inválido, omitido:", producto);
  //         continue; // Salta este producto
  //       }
  //       try {
  //         await store.put(producto);
  //         addedCount++;
  //       } catch (dbError) {
  //         console.error("[SYNC-DB] Error guardando producto en IndexedDB:", producto, dbError);
  //       }
  //     }
  //     await transaction.done;
  //
  //     this.lastSyncTime = new Date();
  //     console.info(`[SYNC] Sincronización con IndexedDB completa: ${addedCount}/${productosInstancias.length} productos procesados a las ${this.lastSyncTime.toLocaleTimeString()}`);
  //     return true;
  //
  //   } catch (error) {
  //     console.error('[SYNC] Error GENERAL en la sincronización:', error);
  //     return false;
  //   }
  // }

  // En BackEnd/src/services/ProductoService.js

// async syncWithGoogleSheets() {
//     try {
//         console.log('[SYNC] Iniciando sincronización de productos...');
//         // Obtiene los datos crudos de Google Sheet
//         const productosData = await this.googleSheetReaderProducto.getData('Producto');
//
//         // --- Validaciones iniciales de los datos recibidos ---
//         if (!productosData) {
//             console.warn('[SYNC] getData devolvió null/undefined. Sincronización detenida.');
//             return false; // No continuar si no hay datos
//         }
//         if (!Array.isArray(productosData)) {
//              console.warn('[SYNC] getData no devolvió un Array. Sincronización detenida. Datos:', productosData);
//              return false; // Asegurarse de que es un array
//         }
//         if (productosData.length === 0) {
//             console.info('[SYNC] No se encontraron datos en Google Sheet. Limpiando IndexedDB (si aplica)...');
//              await this.clearAll(); // Limpia la BD local si la fuente está vacía
//              this.lastSyncTime = new Date();
//              return true; // Sincronización "exitosa" (con 0 elementos)
//          }
//
//          // Log opcional para ver la estructura de la primera fila recibida
//          console.log('[SYNC] Datos crudos recibidos (estructura 1ra fila):', productosData[0]);
//
//         // --- Mapeo y Parseo de cada fila de datos ---
//         const productosInstancias = productosData.map((pData, rowIndex) => {
//
//              // <<< --- LOG DE DIAGNÓSTICO ESENCIAL (INSERTADO AQUÍ) --- >>>
//              // Loguea el objeto crudo ANTES de intentar cualquier parseo
//             console.log(`[SYNC ROW ${rowIndex}] Datos CRUDOS pData:`, JSON.stringify(pData));
//              // Loguea los valores específicos que nos dan problemas y sus tipos
//             console.log(`[SYNC ROW ${rowIndex}] Intentando leer 'categoriaId':`, pData.categoriaId, `(Tipo: ${typeof pData.categoriaId})`);
//             console.log(`[SYNC ROW ${rowIndex}] Intentando leer 'marcaId':`, pData.marcaId, `(Tipo: ${typeof pData.marcaId})`);
//             console.log(`[SYNC ROW ${rowIndex}] Intentando leer 'proveedorId':`, pData.proveedorId, `(Tipo: ${typeof pData.proveedorId})`);
//              // También los nombres por si acaso
//              console.log(`[SYNC ROW ${rowIndex}] Intentando leer 'categoriaNombre':`, pData.categoriaNombre, `(Tipo: ${typeof pData.categoriaNombre})`);
//              console.log(`[SYNC ROW ${rowIndex}] Intentando leer 'marcaNombre':`, pData.marcaNombre, `(Tipo: ${typeof pData.marcaNombre})`);
//              console.log(`[SYNC ROW ${rowIndex}] Intentando leer 'proveedorNombre':`, pData.proveedorNombre, `(Tipo: ${typeof pData.proveedorNombre})`);
//
//
//              // --->>> Proceso de Parseo y Conversión en JavaScript <<<---
//              try {
//                  // --- Funciones auxiliares de Parseo ---
//                  const parseToIntOrNull = (value) => {
//                     // Comprobar null, undefined, o string vacío (después de quitar espacios)
//                      if (value === undefined || value === null || String(value).trim() === '') { return null; }
//                     const num = parseInt(value, 10);
//                     return !isNaN(num) ? num : null;
//                 };
//                  const parseToFloatOrNull = (value) => {
//                     if (value === undefined || value === null || String(value).trim() === '') { return null; }
//                     const strValue = String(value).replace(',', '.'); // Normalizar coma decimal
//                     const num = parseFloat(strValue);
//                     return !isNaN(num) ? num : null;
//                 };
//                  const parseToString = (value) => {
//                     return (value === undefined || value === null) ? "" : String(value).trim();
//                  };
//
//                  // --- Aplicar Parseo a los datos de pData ---
//                  const id = parseToIntOrNull(pData.id);
//                  const categoriaId = parseToIntOrNull(pData.categoriaId);
//                  const marcaId = parseToIntOrNull(pData.marcaId);
//                  const proveedorId = parseToIntOrNull(pData.proveedorId);
//                  const cantidad = parseToIntOrNull(pData.cantidad) ?? 0; // Default 0
//                  const precio = parseToFloatOrNull(pData.precio) ?? 0;     // Default 0
//                  const pvp = parseToFloatOrNull(pData.pvp) ?? 0;           // Default 0
//                  const nombre = parseToString(pData.nombre);
//                  const categoriaNombre = parseToString(pData.categoriaNombre);
//                  const marcaNombre = parseToString(pData.marcaNombre);
//                  const proveedorNombre = parseToString(pData.proveedorNombre);
//                  const descripcion = parseToString(pData.descripcion);
//                  const imagen = parseToString(pData.imagen);
//
//                  // --- Parseo Booleano (Estado) ---
//                  let estado = false;
//                  const estadoRaw = pData.estado;
//                  if (typeof estadoRaw === 'boolean') { estado = estadoRaw; }
//                  else if (typeof estadoRaw === 'string') { estado = estadoRaw.trim().toUpperCase() === 'TRUE' || estadoRaw.trim() === '1' || estadoRaw.trim().toUpperCase() === 'VERDADERO'; }
//                  else if (typeof estadoRaw === 'number') { estado = estadoRaw === 1; }
//
//                  // --- Parseo Fechas ---
//                  // Intenta crear un objeto Date y luego convierte a ISO string. Usa ahora si falla.
//                 const parseToISODateString = (value) => {
//                     if (!value) return new Date().toISOString(); // Fecha actual si no hay valor
//                     try {
//                         const d = new Date(value);
//                          // Verifica si la fecha es válida antes de convertir
//                          return !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
//                     } catch(e) {
//                          console.warn(`[SYNC ROW ${rowIndex}] Error parseando fecha: ${value}`, e);
//                          return new Date().toISOString(); // Fecha actual si hay error
//                      }
//                  };
//                  const fechaCreacion = parseToISODateString(pData.fechaCreacion);
//                  const fechaActualizacion = parseToISODateString(pData.fechaActualizacion);
//
//                  // --- Validación Mínima ---
//                  if (id === null) {
//                     console.warn(`[SYNC ROW ${rowIndex}] Fila omitida por ID inválido o faltante tras parseo.`);
//                     return null; // ID es esencial
//                  }
//                  // Advertir si el nombre está vacío después de parsear, pero no omitir la fila por eso
//                 if (nombre === "") {
//                     console.warn(`[SYNC ROW ${rowIndex}] (ID: ${id}): Nombre está vacío tras parseo.`);
//                  }
//
//                  // --- Crear Instancia del Modelo Producto ---
//                  const instancia = new Producto(
//                     nombre, estado, fechaCreacion, fechaActualizacion,
//                     categoriaId,
//                      // Usa el nombre de la hoja parseado. Si está vacío Y el ID SÍ existe, usa placeholder.
//                      (categoriaNombre === "" && categoriaId !== null) ? 'Sin categoría' : categoriaNombre,
//                      marcaId,
//                     (marcaNombre === "" && marcaId !== null) ? 'Sin marca' : marcaNombre,
//                      proveedorId,
//                     (proveedorNombre === "" && proveedorId !== null) ? 'Sin proveedor' : proveedorNombre,
//                      precio, pvp, cantidad,
//                      descripcion, imagen
//                  );
//                  instancia.id = id; // Asegurar el ID principal parseado
//                 instancia.stock = cantidad; // Asignar stock
//
//                 return instancia; // Devuelve la instancia creada y parseada
//
//             } catch (parseError) {
//                 // Captura errores inesperados durante el proceso de parseo de esta fila
//                 console.error(`[SYNC ROW ${rowIndex}] Error CRÍTICO parseando fila:`, pData, parseError);
//                 return null; // Omite esta fila si ocurre un error grave
//             }
//
//         }).filter(p => p !== null); // Filtra instancias que resultaron null (por validación o error)
//
//         console.log(`[SYNC] Parseados ${productosInstancias.length} productos válidos localmente.`);
//
//          // ---- Actualización de IndexedDB ----
//         try {
//             await this.clearAll(); // Limpiar la tabla antes de volver a llenar
//             const db = await this.dbPromise;
//             const transaction = db.transaction(this.storeName, 'readwrite');
//             const store = transaction.objectStore(this.storeName);
//             let addedCount = 0;
//             for (const producto of productosInstancias) {
//                 // Validación final antes de guardar en DB (redundante si el filtro anterior funcionó, pero segura)
//                 if (producto.id === null || isNaN(producto.id)) {
//                     console.warn("[SYNC-DB] Intentando guardar producto con ID inválido, omitido:", producto);
//                     continue;
//                 }
//                 try {
//                     await store.put(producto); // Usar put para insertar/actualizar
//                     addedCount++;
//                  } catch (dbWriteError) {
//                      console.error("[SYNC-DB] Error al escribir producto en IndexedDB:", producto, dbWriteError);
//                      // Considerar si continuar o abortar la transacción
//                  }
//             }
//              await transaction.done; // Esperar que la transacción se complete
//
//              this.lastSyncTime = new Date();
//              console.info(`[SYNC] Sincronización con IndexedDB completa: ${addedCount}/${productosInstancias.length} productos procesados a las ${this.lastSyncTime.toLocaleTimeString()}`);
//              return true; // Indica éxito general de la sincronización
//
//         } catch (dbError) {
//             console.error('[SYNC-DB] Error durante la transacción de IndexedDB:', dbError);
//             return false; // Indica fallo en la escritura a la BD
//         }
//
//     } catch (error) {
//         // Captura errores generales (ej: fallo en getData, error inesperado)
//         console.error('[SYNC] Error GENERAL y CATASTRÓFICO en la sincronización:', error);
//         return false; // Indica fallo general
//     }
// } // --- Fin de syncWithGoogleSheets ---
                                                                                                                                                                                // En BackEnd/src/services/ProductoService.js

async syncWithGoogleSheets() {
    try {
        console.log('[SYNC] Iniciando sincronización de productos...');
        const productosData = await this.googleSheetReaderProducto.getData('Producto');

        // --- Validaciones iniciales ---
        if (!productosData) {
            console.warn('[SYNC] getData devolvió null/undefined.'); return false;
        }
        if (!Array.isArray(productosData)) {
             console.warn('[SYNC] getData no devolvió un Array:', productosData); return false;
        }
        if (productosData.length === 0) {
            console.info('[SYNC] No se encontraron datos en Google Sheet.'); await this.clearAll(); this.lastSyncTime = new Date(); return true;
        }
         // Opcional: loguear primera fila cruda para referencia rápida
        console.log('[SYNC] Datos crudos recibidos (1ra fila muestra claves reales):', productosData[0]);


        // --- Mapeo y Parseo ---
        const productosInstancias = productosData.map((pData, rowIndex) => {
             // Log de diagnóstico ANTES del try para ver el objeto exacto si hay error de parseo
             // console.log(`[SYNC ROW ${rowIndex}] Procesando pData crudo:`, JSON.stringify(pData));
            try {
                 // --- Funciones auxiliares (sin cambios) ---
                 const parseToIntOrNull = (value) => { if (value === undefined || value === null || String(value).trim() === '') { return null; } const num = parseInt(value, 10); return !isNaN(num) ? num : null; };
                 const parseToFloatOrNull = (value) => { if (value === undefined || value === null || String(value).trim() === '') { return null; } const strValue = String(value).replace(',', '.'); const num = parseFloat(strValue); return !isNaN(num) ? num : null; };
                 const parseToString = (value) => { return (value === undefined || value === null) ? "" : String(value).trim(); };

                 // --->>> !!! CORRECCIÓN CLAVE: Usar las claves en MINÚSCULA (o como vengan) !!! <<<---
                 const id = parseToIntOrNull(pData.id); // id suele venir bien
                 const categoriaId = parseToIntOrNull(pData.categoriaid);     // <--- USAR CLAVE MINÚSCULA
                 const marcaId = parseToIntOrNull(pData.marcaid);         // <--- USAR CLAVE MINÚSCULA
                 const proveedorId = parseToIntOrNull(pData.proveedorid);   // <--- USAR CLAVE MINÚSCULA
                 const cantidad = parseToIntOrNull(pData.cantidad) ?? 0;
                 const precio = parseToFloatOrNull(pData.precio) ?? 0;
                 const pvp = parseToFloatOrNull(pData.pvp) ?? 0;
                 const nombre = parseToString(pData.nombre);
                 const categoriaNombre = parseToString(pData.categorianombre); // <--- USAR CLAVE MINÚSCULA
                 const marcaNombre = parseToString(pData.marcanombre);     // <--- USAR CLAVE MINÚSCULA
                 const proveedorNombre = parseToString(pData.proveedornombre); // <--- USAR CLAVE MINÚSCULA
                 const descripcion = parseToString(pData.descripcion);
                 const imagen = parseToString(pData.imagen);


                 // --- Parseo Booleano (Estado) ---
                 // (Asumir clave 'estado', si es diferente, ajustar)
                let estado = false;
                 const estadoRaw = pData.estado;
                 if (typeof estadoRaw === 'boolean') { estado = estadoRaw; }
                 else if (typeof estadoRaw === 'string') { estado = estadoRaw.trim().toUpperCase() === 'TRUE' || estadoRaw.trim() === '1' || estadoRaw.trim().toUpperCase() === 'VERDADERO'; }
                 else if (typeof estadoRaw === 'number') { estado = estadoRaw === 1; }

                 // --->>> !!! CORRECCIÓN CLAVE FECHAS !!! <<<---
                 // Usar notación de corchetes para claves con espacios/caracteres especiales
                 const parseToISODateString = (value) => {
                    if (!value) return new Date().toISOString();
                    try {
                         const d = new Date(value);
                         return !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
                     } catch(e) { console.warn(`[SYNC ROW ${rowIndex}] Error parseando fecha: ${value}`, e); return new Date().toISOString(); }
                 };
                 // Usar las claves EXACTAS que viste en el JSON.stringify
                const fechaCreacion = parseToISODateString(pData["fecha creación"]);      // <--- USAR CLAVE CON ESPACIO/ACENTO
                 const fechaActualizacion = parseToISODateString(pData["fecha actualización"]); // <--- USAR CLAVE CON ESPACIO/ACENTO


                 // --- Validación Mínima ---
                 if (id === null) {
                     console.warn(`[SYNC ROW ${rowIndex}] Fila omitida por ID inválido tras parseo.`); return null;
                 }
                 if (nombre === "") { console.warn(`[SYNC ROW ${rowIndex}] (ID: ${id}): Nombre vacío tras parseo.`); }

                 // --- Crear Instancia ---
                 const instancia = new Producto(
                    nombre, estado, fechaCreacion, fechaActualizacion,
                     categoriaId,
                    (categoriaNombre === "" && categoriaId !== null) ? 'Sin categoría' : categoriaNombre,
                     marcaId,
                    (marcaNombre === "" && marcaId !== null) ? 'Sin marca' : marcaNombre,
                     proveedorId,
                    (proveedorNombre === "" && proveedorId !== null) ? 'Sin proveedor' : proveedorNombre,
                     precio, pvp, cantidad, descripcion, imagen
                 );
                 instancia.id = id;
                 instancia.stock = cantidad;
                return instancia;

             } catch (parseError) {
                 console.error(`[SYNC ROW ${rowIndex}] Error CRÍTICO parseando:`, pData, parseError); return null;
             }

         }).filter(p => p !== null);

         console.log(`[SYNC] Parseados ${productosInstancias.length} productos válidos localmente.`);

         // ---- Actualización de IndexedDB ----
         try {
             await this.clearAll();
             const db = await this.dbPromise;
             const transaction = db.transaction(this.storeName, 'readwrite');
             const store = transaction.objectStore(this.storeName);
             let addedCount = 0;
             for (const producto of productosInstancias) {
                 if (producto.id === null || isNaN(producto.id)) { console.warn("[SYNC-DB] Omitiendo guardar producto con ID inválido:", producto); continue; }
                 try { await store.put(producto); addedCount++; }
                 catch (dbWriteError) { console.error("[SYNC-DB] Error escritura IndexedDB:", producto, dbWriteError); }
             }
             await transaction.done;
             this.lastSyncTime = new Date();
             console.info(`[SYNC] Sincronización con IndexedDB completa: ${addedCount}/${productosInstancias.length} productos procesados a las ${this.lastSyncTime.toLocaleTimeString()}`);
             return true;
         } catch (dbError) { console.error('[SYNC-DB] Error transacción IndexedDB:', dbError); return false; }

     } catch (error) {
         console.error('[SYNC] Error GENERAL en sincronización:', error); return false;
     }
 } // --- Fin de syncWithGoogleSheets ---
  async agregarProducto(producto) {
    try {
      await this.forceSyncNow();
      const nombreValidado = await Validar.nombreBM(producto.nombre, this);
      if (!nombreValidado) return null;

      const categoriaValida = await this.categoriaService.obtenerCategoriaPorId(producto.categoriaId);
      const marcaValida = await this.marcaService.obtenerMarcaPorId(producto.marcaId);
      const proveedorValido = await this.proveedorService.obtenerProveedorPorId(producto.proveedorId);
      const precioValidado = Validar.precio(producto.precio);
      const pvpValidado = Validar.precio(producto.pvp);
      const cantidadValidada = Validar.cantidadStock(producto.cantidad);
      const descripcionValidada = Validar.descripcion(producto.descripcion);

      if (!categoriaValida || !marcaValida || !proveedorValido || !precioValidado || !pvpValidado || !cantidadValidada || !descripcionValidada) {
        return null;
      }

      const lastId = await this.getAll().then(productos => productos.length === 0 ? 0 : Math.max(...productos.map(p => p.id)));
      const nextId = lastId + 1;

      const nuevoProducto = new Producto(
        nombreValidado,
        true,
        new Date(),
        new Date(),
        categoriaValida.id,
        categoriaValida.nombre,
        marcaValida.id,
        marcaValida.nombre,
        proveedorValido.id,
        proveedorValido.nombre,
        precioValidado,
        pvpValidado,
        cantidadValidada,
        descripcionValidada,
        producto.imagen
      );
      nuevoProducto.id = nextId;
      nuevoProducto.stock = cantidadValidada;

      await super.add(nuevoProducto);
      await ProductoService.googleSheetSyncProducto.sync("create", nuevoProducto);
      await this.forceSyncNow();
      return nuevoProducto;
    } catch (error) {
      console.error('Error adding product:', error);
      return null;
    }
  }

  async actualizarProducto(id, datosActualizados) {
    try {
      await this.forceSyncNow();
      const productoExistente = await this.obtenerProductoPorId(id);
      if (!productoExistente) return null;

      let nombreValidado = datosActualizados.nombre !== undefined ? await Validar.nombreBM(datosActualizados.nombre, this, id) : productoExistente.nombre;
      if (datosActualizados.nombre !== undefined && !nombreValidado) return null;

      let categoriaValida = datosActualizados.categoriaId !== undefined ? await this.categoriaService.obtenerCategoriaPorId(datosActualizados.categoriaId) : await this.categoriaService.obtenerCategoriaPorId(productoExistente.categoriaId);
      if (datosActualizados.categoriaId !== undefined && !categoriaValida) return null;

      let marcaValida = datosActualizados.marcaId !== undefined ? await this.marcaService.obtenerMarcaPorId(datosActualizados.marcaId) : await this.marcaService.obtenerMarcaPorId(productoExistente.marcaId);
      if (datosActualizados.marcaId !== undefined && !marcaValida) return null;

      let proveedorValido = datosActualizados.proveedorId !== undefined ? await this.proveedorService.obtenerProveedorPorId(datosActualizados.proveedorId) : await this.proveedorService.obtenerProveedorPorId(productoExistente.proveedorId);
      if (datosActualizados.proveedorId !== undefined && !proveedorValido) return null;

      let precioValidado = datosActualizados.precio !== undefined ? Validar.precio(datosActualizados.precio) : productoExistente.precio;
      let pvpValidado = datosActualizados.pvp !== undefined ? Validar.precio(datosActualizados.pvp) : productoExistente.pvp;
      let cantidadValidada = datosActualizados.cantidad !== undefined ? Validar.cantidadStock(datosActualizados.cantidad) : productoExistente.cantidad;
      let descripcionValidada = datosActualizados.descripcion !== undefined ? Validar.descripcion(datosActualizados.descripcion) : productoExistente.descripcion;

      let huboCambios = false;
      if (nombreValidado !== productoExistente.nombre) {
        productoExistente.nombre = nombreValidado;
        huboCambios = true;
      }
      if (categoriaValida.id !== productoExistente.categoriaId) {
        productoExistente.categoriaId = categoriaValida.id;
        productoExistente.categoriaNombre = categoriaValida.nombre;
        huboCambios = true;
      }
      if (marcaValida.id !== productoExistente.marcaId) {
        productoExistente.marcaId = marcaValida.id;
        productoExistente.marcaNombre = marcaValida.nombre;
        huboCambios = true;
      }
      if (proveedorValido.id !== productoExistente.proveedorId) {
        productoExistente.proveedorId = proveedorValido.id;
        productoExistente.proveedorNombre = proveedorValido.nombre;
        huboCambios = true;
      }
      if (precioValidado !== productoExistente.precio) {
        productoExistente.precio = precioValidado;
        huboCambios = true;
      }
      if (pvpValidado !== productoExistente.pvp) {
        productoExistente.pvp = pvpValidado;
        huboCambios = true;
      }
      if (cantidadValidada !== productoExistente.cantidad) {
        productoExistente.cantidad = cantidadValidada;
        productoExistente.stock = cantidadValidada;
        huboCambios = true;
      }
      if (descripcionValidada !== productoExistente.descripcion) {
        productoExistente.descripcion = descripcionValidada;
        huboCambios = true;
      }
      if (datosActualizados.imagen !== undefined && datosActualizados.imagen !== productoExistente.imagen) {
        productoExistente.imagen = datosActualizados.imagen;
        huboCambios = true;
      }
      if (datosActualizados.estado !== undefined && productoExistente.estado !== datosActualizados.estado) {
        productoExistente.estado = datosActualizados.estado;
        huboCambios = true;
      }

      if (huboCambios) {
        productoExistente.prepareForUpdate();
        await super.update(id, productoExistente);
        await ProductoService.googleSheetSyncProducto.sync("update", productoExistente);
        await this.forceSyncNow();
        return productoExistente;
      }
      return productoExistente;
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      return null;
    }
  }

  async eliminarProducto(id) {
    try {
      await this.forceSyncNow();
      await super.delete(id);
      await ProductoService.googleSheetSyncProducto.sync("delete", {id});
      await this.forceSyncNow();
      return true;
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      return null;
    }
  }

  async obtenerProductos(filtros = {}) {
    try {
      if (!this.lastSyncTime || (new Date() - this.lastSyncTime) > ProductoService.SYNC_INTERVAL) {
        await this.syncWithGoogleSheets();
      }
      let productos = await super.getAll();
      if (filtros.categoria) productos = productos.filter(p => p.categoriaId === parseInt(filtros.categoria));
      if (filtros.marca) productos = productos.filter(p => p.marcaId === parseInt(filtros.marca));
      if (filtros.search) {
        const searchLower = filtros.search.toLowerCase();
        productos = productos.filter(p => p.nombre.toLowerCase().includes(searchLower) || (p.descripcion && p.descripcion.toLowerCase().includes(searchLower)));
      }
      if (filtros.sort) {
        switch (filtros.sort) {
          case 'price-asc':
            productos.sort((a, b) => a.pvp - b.pvp);
            break;
          case 'price-desc':
            productos.sort((a, b) => b.pvp - a.pvp);
            break;
          case 'name-asc':
            productos.sort((a, b) => a.nombre.localeCompare(b.nombre));
            break;
          case 'name-desc':
            productos.sort((a, b) => b.nombre.localeCompare(a.nombre));
            break;
        }
      }
      return productos;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  async obtenerProductoPorId(id) {
    try {
      const dbId = parseInt(id, 10); // Asegúrate de que el ID sea numérico para la búsqueda
      if (isNaN(dbId)) {
        console.error('ID inválido para obtenerProductoPorId:', id);
        return null;
      }

      // 1. Intenta obtener directamente de IndexedDB (puede tener nombres de sync)
      const productoData = await super.getById(dbId);

      if (!productoData) {
        console.warn(`Producto con ID ${dbId} no encontrado inicialmente. Forzando sincronización...`);
        // 2. Si no encontrado o podría estar desactualizado, fuerza sincronización
        await Promise.all([
          this.forceSyncNow(),
          // Forzar sync de relacionados SI es estrictamente necesario AÚN
          // Si la sync de productos ya incluye nombres, esto puede ser redundante
          // this.categoriaService.forceSyncNow(),
          // this.marcaService.forceSyncNow(),
          // this.proveedorService.forceSyncNow()
        ]);
        // 3. Intenta obtener de nuevo después de sincronizar
        const productoDataSynced = await super.getById(dbId);
        if (!productoDataSynced) {
          console.error(`Producto con ID ${dbId} no encontrado incluso después de sincronizar.`);
          return null;
        }
        // Usa los datos recién sincronizados
        return this.mapDataToProductoInstance(productoDataSynced); // Usa una función helper
      } else {
        // Usa los datos encontrados inicialmente
        return this.mapDataToProductoInstance(productoData); // Usa una función helper
      }

    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      return null;
    }
  }

  async mapDataToProductoInstance(productoData) {
    if (!productoData) return null;

    // ASUME que syncWithGoogleSheets ya llenó los nombres. Si no, descomenta y ajusta las búsquedas.
    let categoriaNombre = productoData.categoriaNombre || 'Sin categoría';
    let marcaNombre = productoData.marcaNombre || 'Sin marca';
    let proveedorNombre = productoData.proveedorNombre || 'Sin proveedor';

    /* >>> DESCOMENTA SI NECESITAS BUSCAR NOMBRES EN TIEMPO REAL <<<
    if (!categoriaNombre && productoData.categoriaId) {
         const categoria = await this.categoriaService.obtenerCategoriaPorId(productoData.categoriaId);
         categoriaNombre = categoria ? categoria.nombre : 'Categoría no encontrada';
     }
     if (!marcaNombre && productoData.marcaId) {
        const marca = await this.marcaService.obtenerMarcaPorId(productoData.marcaId);
        marcaNombre = marca ? marca.nombre : 'Marca no encontrada';
    }
    if (!proveedorNombre && productoData.proveedorId) {
        const proveedor = await this.proveedorService.obtenerProveedorPorId(productoData.proveedorId);
         proveedorNombre = proveedor ? proveedor.nombre : 'Proveedor no encontrado';
    }
    */

    const producto = new Producto(
      productoData.nombre,
      productoData.estado,
      productoData.fechaCreacion,
      productoData.fechaActualizacion,
      productoData.categoriaId,
      categoriaNombre,
      productoData.marcaId,
      marcaNombre,
      productoData.proveedorId,
      proveedorNombre,
      productoData.precio,
      productoData.pvp,
      productoData.cantidad, // Asegúrate que este es el valor correcto (cantidad/stock)
      productoData.descripcion,
      productoData.imagen
    );
    producto.id = productoData.id; // Asignar el ID de los datos recuperados
    // Asegúrate de que `stock` se asigne correctamente si es diferente de `cantidad` en tu modelo/lógica
    producto.stock = productoData.stock !== undefined ? productoData.stock : productoData.cantidad;
    return producto;
  }

  async clearAll() {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.clear();
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
    }
  }

  async verificarDependencias(tipo, id) {
    try {
      const productos = await this.obtenerProductos();
      let dependencias = [];
      switch (tipo) {
        case 'categoria':
          dependencias = productos.filter(p => p.categoriaId === id);
          break;
        case 'marca':
          dependencias = productos.filter(p => p.marcaId === id);
          break;
        case 'proveedor':
          dependencias = productos.filter(p => p.proveedorId === id);
          break;
      }
      return {hasDependencies: dependencias.length > 0, count: dependencias.length, productos: dependencias};
    } catch (error) {
      console.error(`Error checking dependencies for ${tipo} ${id}:`, error);
      return null;
    }
  }
}

export {ProductoService};
