// BackEnd/src/services/ProveedorService.js
import { IndexedDB } from '../database/indexdDB.js';
import { Validar } from '../utils/validar.js';
import { Proveedor } from '../models/Proveedor.js';
import { ProductoService } from './ProductoService.js';
import GoogleSheetSync from '../database/syncGoogleSheet.js';
import GoogleSheetReader from '../database/GoogleSheetReader.js';

/**
 * Servicio para la gestión de proveedores.
 * Extiende de IndexedDB y sincroniza con Google Sheets.
 */
class ProveedorService extends IndexedDB {
  static googleSheetSyncProveedor = new GoogleSheetSync('https://script.google.com/macros/s/AKfycbw2HqffG73garOu-4_0Bbv8Qw0iylYAKhQZmehlOzz_2BEZqv3iUxoTcIa6RyfkvK1N/exec');
  static googleSheetReaderProveedor = new GoogleSheetReader('https://script.google.com/macros/s/AKfycbxJ3QMI3GgkmLmYGYIu_JuRqKKU0J5Er5Bzq6UXR9osUGnnkj0JZEVBLO2eJSteZQWg/exec');

  // Intervalo de sincronización (3 segundos)
  static SYNC_INTERVAL = 3 * 1000;

  constructor() {
    super('mydb', 'proveedores');
    this.lastSyncTime = null;
    this.startPeriodicSync();
  }

  /**
   * Inicia la sincronización periódica.
   */
  startPeriodicSync() {
    this.syncWithGoogleSheets();
    setInterval(() => {
      this.syncWithGoogleSheets();
    }, ProveedorService.SYNC_INTERVAL);
  }

  /**
   * Sincroniza los datos desde Google Sheets a IndexedDB.
   */
  async syncWithGoogleSheets() {
    try {
      console.log('Iniciando sincronización con Google Sheets...');
      const proveedoresData = await ProveedorService.googleSheetReaderProveedor.getData('Proveedor');
      console.log(`Recibidos ${proveedoresData.length} registros.`);
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
      await this.clearAll();
      for (const proveedor of proveedoresInstancias) {
        await super.add(proveedor);
      }
      this.lastSyncTime = new Date();
      console.info(`Sincronización exitosa: ${proveedoresInstancias.length} registros a las ${this.lastSyncTime}`);
      return true;
    } catch (error) {
      console.error('Error en sincronización:', error);
      return false;
    }
  }

  async forceSyncNow() {
    this.lastSyncTime = null;
    return await this.syncWithGoogleSheets();
  }

  async obtenerTodosLosProveedores() {
    try {
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

  async obtenerProveedorPorId(id) {
    try {
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

  async agregarProveedor(proveedor) {
    try {
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
      console.log(`Proveedor creado localmente con ID: ${nextId}. Sincronizando...`);
      await ProveedorService.googleSheetSyncProveedor.sync("create", nuevoProveedor);
      console.info(`Proveedor con ID: ${nextId} sincronizado.`);
      await this.forceSyncNow();
      return nuevoProveedor;
    } catch (error) {
      console.error('Error al agregar proveedor:', error);
      return null;
    }
  }

  async actualizarProveedor(id, datosActualizados) {
    try {
      await this.forceSyncNow();
      const proveedorExistente = await this.obtenerProveedorPorId(id);
      if (!proveedorExistente) return null;
      let nombreValidado = datosActualizados.nombre !== undefined ? Validar.nombreBP(datosActualizados.nombre) : proveedorExistente.nombre;
      let direccionValidada = datosActualizados.direccion !== undefined ? Validar.direccionBP(datosActualizados.direccion) : proveedorExistente.direccion;
      let telefonoValidado = datosActualizados.telefono !== undefined ? await Validar.telefonoBPT(datosActualizados.telefono, this, id) : proveedorExistente.telefono;
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
        console.log(`Proveedor con ID ${id} actualizado localmente.`);
        await ProveedorService.googleSheetSyncProveedor.sync("update", proveedorExistente);
        console.info(`Proveedor con ID ${id} sincronizado.`);
        await this.forceSyncNow();
        return proveedorExistente;
      }
      console.info(`Proveedor con ID ${id} sin cambios.`);
      return proveedorExistente;
    } catch (error) {
      console.error(`Error al actualizar proveedor con ID ${id}:`, error);
      return null;
    }
  }

  async eliminarProveedor(id) {
    try {
      await this.forceSyncNow();
      const productoService = new ProductoService(null, null, this);
      const dependencias = await productoService.verificarDependencias('proveedor', id);
      if (dependencias && dependencias.hasDependencies) {
        alert(`No se puede eliminar el proveedor por ${dependencias.count} dependencias.`);
        return false;
      }
      await super.delete(id);
      console.log(`Proveedor con ID ${id} eliminado localmente.`);
      await ProveedorService.googleSheetSyncProveedor.sync("delete", { id: id });
      console.info(`Proveedor con ID ${id} eliminado y sincronizado.`);
      await this.forceSyncNow();
      return true;
    } catch (error) {
      console.error(`Error al eliminar proveedor con ID ${id}:`, error);
      return null;
    }
  }

  async clearAll() {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.clear();
      console.info('IndexedDB limpiado.');
    } catch (error) {
      console.error('Error al limpiar IndexedDB:', error);
    }
  }
}

export { ProveedorService };
