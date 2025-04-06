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
  static googleSheetReaderProveedor = new GoogleSheetReader('https://script.google.com/macros/s/AKfycbxEMaok6mE7Smn9R2DmvYtt5k_Uz48bTtHMlY5OSA0oX3Ebl2xlJx8Tln7cBaFC1Y1V/exec');

  constructor() {
    super('mydb', 'proveedores');
    this.lastSyncTime = null; // Marca de tiempo de la última sincronización
  }

  /**
   * Sincroniza los datos de proveedores desde Google Sheets a IndexedDB.
   */
  async syncWithGoogleSheets() {
    try {
      const proveedoresData = await ProveedorService.googleSheetReaderProveedor.getData('Proveedor');
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

      // Agregar nuevos datos a IndexedDB
      for (const proveedor of proveedoresInstancias) {
        await super.add(proveedor);
      }

      this.lastSyncTime = new Date();
      console.info('Datos de proveedores sincronizados con Google Sheets y almacenados en IndexedDB.');
    } catch (error) {
      console.error('Error al sincronizar proveedores con Google Sheets:', error);
    }
  }

  /**
   * Obtiene todos los proveedores, usando caché en IndexedDB y sincronizando con Google Sheets si es necesario.
   * @returns {Promise<Array<Proveedor>>} - Un array con todos los proveedores.
   */
  async obtenerTodosLosProveedores() {
    try {
      // Sincronizar si no hay datos recientes (cada 2 minutos)
      if (!this.lastSyncTime || (new Date() - this.lastSyncTime) > 2 * 60 * 1000) {
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
      await ProveedorService.googleSheetSyncProveedor.sync("create", nuevoProveedor);
      console.info(`Proveedor agregado con ID: ${nextId}`);
      return nuevoProveedor;
    } catch (error) {
      console.error('Error al agregar proveedor:', error);
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
        await ProveedorService.googleSheetSyncProveedor.sync("update", proveedorExistente);
        console.info(`Proveedor con ID ${id} actualizado correctamente.`);
        return proveedorExistente;
      }
      console.info(`Proveedor con ID ${id} no tuvo cambios detectados.`);
      return proveedorExistente;
    } catch (error) {
      console.error(`Error al actualizar proveedor con ID ${id}:`, error);
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
      const productoService = new ProductoService(null, null, this);
      const dependencias = await productoService.verificarDependencias('proveedor', id);
      if (dependencias && dependencias.hasDependencies) {
        alert(`No se puede eliminar el proveedor porque está siendo utilizado por ${dependencias.count} producto(s).`);
        return false;
      }

      await super.delete(id);
      await ProveedorService.googleSheetSyncProveedor.sync("delete", { id: id });
      console.info(`Proveedor con ID ${id} eliminado correctamente.`);
      return true;
    } catch (error) {
      console.error(`Error al eliminar proveedor con ID ${id}:`, error);
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