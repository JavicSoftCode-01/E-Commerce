// BackEnd/src/services/MarcaService.js
import { IndexedDB } from '../database/indexdDB.js';
import { Validar } from '../utils/validar.js';
import { Marca } from '../models/Marca.js';
import { ProductoService } from './ProductoService.js';
import GoogleSheetSync from '../database/syncGoogleSheet.js';
import GoogleSheetReader from '../database/GoogleSheetReader.js';

/**
 * Servicio para la gestión de marcas.
 * Extiende de IndexedDB y sincroniza con Google Sheets de manera directa y rápida.
 */
class MarcaService extends IndexedDB {
  static googleSheetSyncMarca = new GoogleSheetSync('https://script.google.com/macros/s/AKfycbzrQBaqY-DyXEiKSd_BZQjrRCwGX2Q-mehjcjucQQUm2SWoDOdzu6ZJ5bbk9ubEid_i/exec');
  static googleSheetReaderMarca = new GoogleSheetReader('https://script.google.com/macros/s/AKfycbwqaxjZHu5YcUaQ4wKCV-tR36fvmSMmnnJMJ2LTzoMYkmyxNsuzSv0jS_J1eRIumaGZ/exec');

  // Intervalo de sincronización (3 segundos, igual que ProveedorService)
  static SYNC_INTERVAL = 3 * 1000;

  constructor() {
    super('mydb', 'marcas');
    this.lastSyncTime = null;
    this.startPeriodicSync();
  }

  /**
   * Inicia la sincronización periódica con Google Sheets.
   */
  startPeriodicSync() {
    this.syncWithGoogleSheets();
    setInterval(() => {
      this.syncWithGoogleSheets();
    },  MarcaService.SYNC_INTERVAL);
  }

  /**
   * Sincroniza los datos desde Google Sheets a IndexedDB de manera directa.
   */
  async syncWithGoogleSheets() {
    try {
      console.log('Iniciando sincronización de marcas con Google Sheets...');
      const marcasData = await MarcaService.googleSheetReaderMarca.getData('Marca');
      console.log(`Recibidos ${marcasData.length} registros de marcas.`);
      const marcasInstancias = marcasData.map(mData => {
        const instancia = new Marca(
          mData.nombre,
          mData.estado,
          mData.fechaCreacion,
          mData.fechaActualizacion
        );
        instancia.id = mData.id;
        return instancia;
      });
      await this.clearAll();
      for (const marca of marcasInstancias) {
        await super.add(marca);
      }
      this.lastSyncTime = new Date();
      console.info(`Sincronización de marcas exitosa: ${marcasInstancias.length} registros a las ${this.lastSyncTime}`);
      return true;
    } catch (error) {
      console.error('Error en sincronización de marcas:', error);
      return false;
    }
  }

  /**
   * Fuerza una sincronización inmediata.
   */
  async forceSyncNow() {
    this.lastSyncTime = null;
    return await this.syncWithGoogleSheets();
  }

  /**
   * Obtiene todas las marcas, sincronizando si es necesario.
   */
  async obtenerTodasLasMarcas() {
    try {
      if (!this.lastSyncTime || (new Date() - this.lastSyncTime) > MarcaService.SYNC_INTERVAL) {
        await this.syncWithGoogleSheets();
      }
      const marcasData = await super.getAll();
      const marcasInstancias = marcasData.map(mData => {
        const instancia = new Marca(
          mData.nombre,
          mData.estado,
          mData.fechaCreacion,
          mData.fechaActualizacion
        );
        instancia.id = mData.id;
        return instancia;
      });
      return marcasInstancias;
    } catch (error) {
      console.error('Error al obtener marcas:', error);
      return [];
    }
  }

  /**
   * Obtiene una marca por ID.
   */
  async obtenerMarcaPorId(id) {
    try {
      if (!this.lastSyncTime || (new Date() - this.lastSyncTime) > MarcaService.SYNC_INTERVAL) {
        await this.syncWithGoogleSheets();
      }
      const marcaData = await super.getById(id);
      if (marcaData) {
        const instanciaMarca = new Marca(
          marcaData.nombre,
          marcaData.estado,
          marcaData.fechaCreacion,
          marcaData.fechaActualizacion
        );
        instanciaMarca.id = marcaData.id;
        return instanciaMarca;
      }
      return null;
    } catch (error) {
      console.error(`Error al obtener marca con ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Agrega una nueva marca y sincroniza con Google Sheets.
   */
  async agregarMarca(marca) {
    try {
      await this.forceSyncNow();
      const nombreValidado = await Validar.nombreBM(marca.nombre, this);
      if (!nombreValidado) return null;

      const lastId = await this.getAll().then(marcas => {
        return marcas.length === 0 ? 0 : Math.max(...marcas.map(m => m.id));
      });
      const nextId = lastId + 1;

      const nuevaMarca = new Marca(nombreValidado, marca.estado);
      nuevaMarca.id = nextId;

      await super.add(nuevaMarca);
      console.log(`Marca creada localmente con ID: ${nextId}. Sincronizando...`);
      await MarcaService.googleSheetSyncMarca.sync("create", nuevaMarca);
      console.info(`Marca con ID: ${nextId} sincronizada.`);
      await this.forceSyncNow();
      return nuevaMarca;
    } catch (error) {
      console.error('Error al agregar marca:', error);
      return null;
    }
  }

  /**
   * Actualiza una marca existente y sincroniza con Google Sheets.
   */
  async actualizarMarca(id, datosActualizados) {
    try {
      await this.forceSyncNow();
      const marcaExistente = await this.obtenerMarcaPorId(id);
      if (!marcaExistente) return null;

      let nombreValidado = datosActualizados.nombre !== undefined
        ? await Validar.nombreBM(datosActualizados.nombre, this, id)
        : marcaExistente.nombre;
      if (datosActualizados.nombre !== undefined && !nombreValidado) return null;

      let huboCambios = false;
      if (nombreValidado && marcaExistente.nombre !== nombreValidado) {
        marcaExistente.nombre = nombreValidado;
        huboCambios = true;
      }
      if (datosActualizados.estado !== undefined && marcaExistente.estado !== datosActualizados.estado) {
        marcaExistente.estado = datosActualizados.estado;
        huboCambios = true;
      }

      if (huboCambios) {
        marcaExistente.prepareForUpdate();
        await super.update(id, marcaExistente);
        console.log(`Marca con ID ${id} actualizada localmente.`);
        await MarcaService.googleSheetSyncMarca.sync("update", marcaExistente);
        console.info(`Marca con ID ${id} sincronizada.`);
        await this.forceSyncNow();
        return marcaExistente;
      }
      console.info(`Marca con ID ${id} sin cambios.`);
      return marcaExistente;
    } catch (error) {
      console.error(`Error al actualizar marca con ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Elimina una marca y sincroniza con Google Sheets.
   */
  async eliminarMarca(id) {
    try {
      await this.forceSyncNow();
      const productoService = new ProductoService(null, this, null);
      const dependencias = await productoService.verificarDependencias('marca', id);
      if (dependencias && dependencias.hasDependencies) {
        alert(`No se puede eliminar la marca por ${dependencias.count} dependencias.`);
        return false;
      }
      await super.delete(id);
      console.log(`Marca con ID ${id} eliminada localmente.`);
      await MarcaService.googleSheetSyncMarca.sync("delete", { id: id });
      console.info(`Marca con ID ${id} eliminada y sincronizada.`);
      await this.forceSyncNow();
      return true;
    } catch (error) {
      console.error(`Error al eliminar marca con ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Limpia todos los registros de marcas en IndexedDB.
   */
  async clearAll() {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.clear();
      console.info('IndexedDB de marcas limpiado.');
    } catch (error) {
      console.error('Error al limpiar IndexedDB de marcas:', error);
    }
  }
}

export { MarcaService };