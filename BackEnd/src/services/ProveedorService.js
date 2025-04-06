// BackEnd/src/services/ProveedorService.js
import { IndexedDB } from '../database/indexdDB.js';
import { Validar } from '../utils/validar.js';
import { Proveedor } from '../models/Proveedor.js';
import { ProductoService } from './ProductoService.js';
import GoogleSheetSync from '../database/syncGoogleSheet.js';
import GoogleSheetReader from '../database/GoogleSheetReader.js';

/**
 * 🔰 Servicio para la gestión de proveedores.
 * Extiende de IndexedDB para interactuar con la base de datos y optimiza el rendimiento con caché local.
 */
class ProveedorService extends IndexedDB {
  static googleSheetSyncProveedor = new GoogleSheetSync('https://script.google.com/macros/s/AKfycbw2HqffG73garOu-4_0Bbv8Qw0iylYAKhQZmehlOzz_2BEZqv3iUxoTcIa6RyfkvK1N/exec');
  static googleSheetReaderProveedor = new GoogleSheetReader('https://script.google.com/macros/s/AKfycbxJ3QMI3GgkmLmYGYIu_JuRqKKU0J5Er5Bzq6UXR9osUGnnkj0JZEVBLO2eJSteZQWg/exec');

  // Intervalo de sincronización en milisegundos (reducido de 2 minutos a 30 segundos)
  static SYNC_INTERVAL = 30 * 1000;

  constructor() {
    super('mydb', 'proveedores');
    this.lastSyncTime = null; // Marca de tiempo de la última sincronización

    // Iniciar sincronización periódica
    this.startPeriodicSync();
  }

  /**
   * Inicia la sincronización periódica con Google Sheets
   */
  startPeriodicSync() {
    // Sincronización inicial al instanciar el servicio
    this.syncWithGoogleSheets();

    // Configurar sincronización periódica cada 30 segundos
    setInterval(() => {
      this.syncWithGoogleSheets();
    }, ProveedorService.SYNC_INTERVAL);
  }

  /**
   * Sincroniza los datos de proveedores desde Google Sheets a IndexedDB.
   * @returns {Promise<boolean>} - True si la sincronización fue exitosa
   */
  async syncWithGoogleSheets() {
    try {
      console.log('Iniciando sincronización de proveedores con Google Sheets...');
      const proveedoresData = await ProveedorService.googleSheetReaderProveedor.getData('Proveedor');
      console.log(`Recibidos ${proveedoresData.length} registros de proveedores desde Google Sheets`);

      const proveedoresInstancias = proveedoresData.map(pData => {
        const instancia = new Proveedor(
          pData.nombre,
          pData.telefono,
          pData.direccion,
          pData.estado,
          pData.fechaCreacion,
          pData.fechaActualizacion
        );
        instancia.id = pData.id;
        return instancia;
      });

      // Limpiar datos existentes en IndexedDB
      await this.clearAll();
      console.log('Base de datos local limpiada exitosamente');

      // Agregar nuevos datos a IndexedDB
      for (const proveedor of proveedoresInstancias) {
        await super.add(proveedor);
      }

      this.lastSyncTime = new Date();
      console.info(`Datos de proveedores sincronizados con Google Sheets. Total: ${proveedoresInstancias.length} registros. Hora: ${this.lastSyncTime}`);
      return true;
    } catch (error) {
      console.error('Error detallado al sincronizar proveedores con Google Sheets:', error);
      return false;
    }
  }

  /**
   * Fuerza una sincronización inmediata con Google Sheets
   */
  async forceSyncNow() {
    this.lastSyncTime = null;
    return await this.syncWithGoogleSheets();
  }

  /**
   * Obtiene todos los proveedores, usando caché en IndexedDB y sincronizando con Google Sheets si es necesario.
   * @returns {Promise<Array<Proveedor>>} - Un array con todos los proveedores.
   */
  async obtenerTodosLosProveedores() {
    try {
      // Sincronizar si no hay datos recientes según el intervalo configurado
      if (!this.lastSyncTime || (new Date() - this.lastSyncTime) > ProveedorService.SYNC_INTERVAL) {
        await this.syncWithGoogleSheets();
      }

      const proveedoresData = await super.getAll();
      const proveedoresInstancias = proveedoresData.map(pData => {
        const instancia = new Proveedor(
          pData.nombre,
          pData.telefono,
          pData.direccion,
          pData.estado,
          pData.fechaCreacion,
          pData.fechaActualizacion
        );
        instancia.id = pData.id;
        return instancia;
      });
      return proveedoresInstancias;
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      return [];
    }
  }

  /**
   * Obtiene un proveedor por su ID desde IndexedDB.
   * @param {number} id - ID del proveedor a obtener.
   * @returns {Promise<Proveedor|null>} - El proveedor encontrado o null.
   */
  async obtenerProveedorPorId(id) {
    try {
      // Forzar sincronización antes de obtener por ID para garantizar datos actualizados
      if (!this.lastSyncTime || (new Date() - this.lastSyncTime) > ProveedorService.SYNC_INTERVAL) {
        await this.syncWithGoogleSheets();
      }

      const proveedorData = await super.getById(id);
      if (proveedorData) {
        const instanciaProveedor = new Proveedor(
          proveedorData.nombre,
          proveedorData.telefono,
          proveedorData.direccion,
          proveedorData.estado,
          proveedorData.fechaCreacion,
          proveedorData.fechaActualizacion
        );
        instanciaProveedor.id = proveedorData.id;
        return instanciaProveedor;
      }
      return null;
    } catch (error) {
      console.error(`Error al obtener proveedor con ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Agrega un nuevo proveedor a IndexedDB y sincroniza con Google Sheets.
   * @param {Proveedor} proveedor - Objeto proveedor a agregar.
   * @returns {Promise<Proveedor|null>} - El proveedor agregado o null si falla.
   */
  async agregarProveedor(proveedor) {
    try {
      // Forzar sincronización antes de añadir para evitar conflictos de ID
      await this.forceSyncNow();

      const nombreValidado = Validar.nombreBP(proveedor.nombre);
      const direccionValidada = Validar.direccionBP(proveedor.direccion);
      const telefonoValidado = await Validar.telefonoBPT(proveedor.telefono, this);
      if (!nombreValidado || !direccionValidada || !telefonoValidado) {
        return null;
      }

      const lastId = await this.getAll().then(proveedores => {
        if (proveedores.length === 0) return 0;
        return Math.max(...proveedores.map(p => p.id));
      });
      const nextId = lastId + 1;

      const nuevoProveedor = new Proveedor(nombreValidado, telefonoValidado, direccionValidada);
      nuevoProveedor.id = nextId;

      await super.add(nuevoProveedor);
      console.log(`Proveedor creado localmente con ID: ${nextId}. Sincronizando con Google Sheets...`);

      await ProveedorService.googleSheetSyncProveedor.sync("create", nuevoProveedor);
      console.info(`Proveedor agregado con ID: ${nextId} y sincronizado con Google Sheets.`);

      // Forzar sincronización después de la operación para actualizar datos en todos los dispositivos
      await this.forceSyncNow();

      return nuevoProveedor;
    } catch (error) {
      console.error('Error detallado al agregar proveedor:', error);
      return null;
    }
  }

  /**
   * Actualiza un proveedor existente en IndexedDB y sincroniza con Google Sheets si hay cambios.
   * @param {number} id - ID del proveedor a actualizar.
   * @param {object} datosActualizados - Objeto con los campos a actualizar.
   * @returns {Promise<Proveedor|null>} - El proveedor actualizado o null si falla.
   */
  async actualizarProveedor(id, datosActualizados) {
    try {
      // Forzar sincronización antes de actualizar
      await this.forceSyncNow();

      const proveedorExistente = await this.obtenerProveedorPorId(id);
      if (!proveedorExistente) return null;

      let nombreValidado = datosActualizados.nombre !== undefined
        ? Validar.nombreBP(datosActualizados.nombre)
        : proveedorExistente.nombre;
      let direccionValidada = datosActualizados.direccion !== undefined
        ? Validar.direccionBP(datosActualizados.direccion)
        : proveedorExistente.direccion;
      let telefonoValidado = datosActualizados.telefono !== undefined
        ? await Validar.telefonoBPT(datosActualizados.telefono, this, id)
        : proveedorExistente.telefono;

      if ((datosActualizados.nombre !== undefined && !nombreValidado) ||
        (datosActualizados.direccion !== undefined && !direccionValidada) ||
        (datosActualizados.telefono !== undefined && !telefonoValidado)) {
        return null;
      }

      let huboCambios = false;
      if (proveedorExistente.nombre !== nombreValidado) {
        proveedorExistente.nombre = nombreValidado;
        huboCambios = true;
      }
      if (proveedorExistente.direccion !== direccionValidada) {
        proveedorExistente.direccion = direccionValidada;
        huboCambios = true;
      }
      if (proveedorExistente.telefono !== telefonoValidado) {
        proveedorExistente.telefono = telefonoValidado;
        huboCambios = true;
      }
      if (datosActualizados.estado !== undefined && proveedorExistente.estado !== datosActualizados.estado) {
        proveedorExistente.estado = datosActualizados.estado;
        huboCambios = true;
      }

      if (huboCambios) {
        proveedorExistente.prepareForUpdate();
        await super.update(id, proveedorExistente);
        console.log(`Proveedor con ID ${id} actualizado localmente. Sincronizando con Google Sheets...`);

        await ProveedorService.googleSheetSyncProveedor.sync("update", proveedorExistente);
        console.info(`Proveedor con ID ${id} actualizado correctamente y sincronizado con Google Sheets.`);

        // Forzar sincronización después de la operación
        await this.forceSyncNow();

        return proveedorExistente;
      }
      console.info(`Proveedor con ID ${id} no tuvo cambios detectados.`);
      return proveedorExistente;
    } catch (error) {
      console.error(`Error detallado al actualizar proveedor con ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Elimina un proveedor de IndexedDB y sincroniza con Google Sheets.
   * @param {number} id - ID del proveedor a eliminar.
   * @returns {Promise<boolean|null>} - True si se elimina, false si hay dependencias, null si falla.
   */
  async eliminarProveedor(id) {
    try {
      // Forzar sincronización antes de eliminar
      await this.forceSyncNow();

      const productoService = new ProductoService(null, null, this);
      const dependencias = await productoService.verificarDependencias('proveedor', id);
      if (dependencias && dependencias.hasDependencies) {
        alert(`No se puede eliminar el proveedor porque está siendo utilizado por ${dependencias.count} producto(s).`);
        return false;
      }

      await super.delete(id);
      console.log(`Proveedor con ID ${id} eliminado localmente. Sincronizando con Google Sheets...`);

      await ProveedorService.googleSheetSyncProveedor.sync("delete", { id: id });
      console.info(`Proveedor con ID ${id} eliminado correctamente y sincronizado con Google Sheets.`);

      // Forzar sincronización después de la operación
      await this.forceSyncNow();

      return true;
    } catch (error) {
      console.error(`Error detallado al eliminar proveedor con ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Limpia todos los registros de proveedores en IndexedDB.
   */
  async clearAll() {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.clear();
      console.info('Todos los registros de proveedores en IndexedDB han sido eliminados.');
    } catch (error) {
      console.error('Error al limpiar IndexedDB para proveedores:', error);
    }
  }
}

export { ProveedorService };