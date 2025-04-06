import { IndexedDB } from '../database/indexdDB.js';
import { Validar } from '../utils/validar.js';
import { Marca } from '../models/Marca.js';
import { ProductoService } from './ProductoService.js';
import GoogleSheetSync from '../database/syncGoogleSheet.js';
import GoogleSheetReader from '../database/GoogleSheetReader.js';

/**
 * 🔰🔰Servicio para la gestión de marcas.
 * Extiende de IndexedDB para interactuar con la base de datos y optimiza el rendimiento con caché local.🔰🔰
 */
class MarcaService extends IndexedDB {
  static googleSheetSyncMarca = new GoogleSheetSync('https://script.google.com/macros/s/AKfycbzrQBaqY-DyXEiKSd_BZQjrRCwGX2Q-mehjcjucQQUm2SWoDOdzu6ZJ5bbk9ubEid_i/exec');
  static googleSheetReaderMarca = new GoogleSheetReader('https://script.google.com/macros/s/AKfycbyOIePOl8psxtBOu9qieznAeueE6DtknxgHnAVzwHNldw4vdCMBke7oxkAzIn9NGYW8/exec');

  constructor() {
    super('mydb', 'marcas');
    this.lastSyncTime = null; // Marca de tiempo de la última sincronización
  }

  /**
   * Sincroniza los datos de marcas desde Google Sheets a IndexedDB.
   */
  async syncWithGoogleSheets() {
    try {
      const marcasData = await MarcaService.googleSheetReaderMarca.getData('Marca');
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

      // Limpiar datos existentes en IndexedDB
      await this.clearAll();

      // Agregar nuevos datos a IndexedDB
      for (const marca of marcasInstancias) {
        await super.add(marca);
      }

      this.lastSyncTime = new Date();
      console.info('Datos de marcas sincronizados con Google Sheets y almacenados en IndexedDB.');
    } catch (error) {
      console.error('Error al sincronizar marcas con Google Sheets:', error);
    }
  }

  /**
   * Obtiene todas las marcas, usando caché en IndexedDB y sincronizando con Google Sheets si es necesario.
   * @returns {Promise<Array<Marca>>} - Un array con todas las instancias de Marca.
   */
  async obtenerTodasLasMarcas() {
    try {
      // Sincronizar si no hay datos recientes (cada 5 minutos)
      if (!this.lastSyncTime || (new Date() - this.lastSyncTime) > 5 * 60 * 1000) {
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
   * Obtiene una marca por su ID desde IndexedDB.
   * @param {number} id - ID de la marca a obtener.
   * @returns {Promise<Marca|null>} - La instancia de Marca encontrada o null.
   */
  async obtenerMarcaPorId(id) {
    try {
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
   * Agrega una nueva marca a IndexedDB y sincroniza con Google Sheets.
   * @param {Marca} marca - Objeto marca a agregar.
   * @returns {Promise<Marca|null>} - La marca agregada o null si falla.
   */
  async agregarMarca(marca) {
    try {
      const nombreValidado = await Validar.nombreBM(marca.nombre, this);
      if (!nombreValidado) return null;

      const lastId = await this.getAll().then(marcas => {
        if (marcas.length === 0) return 0;
        return Math.max(...marcas.map(m => m.id));
      });
      const nextId = lastId + 1;

      const nuevaMarca = new Marca(nombreValidado);
      nuevaMarca.id = nextId;

      await super.add(nuevaMarca);
      await MarcaService.googleSheetSyncMarca.sync("create", nuevaMarca);
      console.info(`Marca agregada con ID: ${nextId}`);
      return nuevaMarca;
    } catch (error) {
      console.error('Error al agregar marca:', error);
      return null;
    }
  }

  /**
   * Actualiza una marca existente en IndexedDB y sincroniza con Google Sheets si hay cambios.
   * @param {number} id - ID de la marca a actualizar.
   * @param {object} datosActualizados - Objeto con los campos a actualizar.
   * @returns {Promise<Marca|null>} - La marca actualizada o null si falla.
   */
  async actualizarMarca(id, datosActualizados) {
    try {
      let nombreValidado = datosActualizados.nombre;
      if (nombreValidado) {
        nombreValidado = await Validar.nombreBM(nombreValidado, this, id);
        if (!nombreValidado) return null;
      }

      const marcaExistente = await this.obtenerMarcaPorId(id);
      if (!marcaExistente) return null;

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
        await MarcaService.googleSheetSyncMarca.sync("update", marcaExistente);
        console.info(`Marca con ID ${id} actualizada correctamente.`);
        return marcaExistente;
      }
      console.info(`Marca con ID ${id} no tuvo cambios detectados.`);
      return marcaExistente;
    } catch (error) {
      console.error(`Error al actualizar marca con ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Elimina una marca de IndexedDB y sincroniza con Google Sheets.
   * @param {number} id - ID de la marca a eliminar.
   * @returns {Promise<boolean|null>} - True si se elimina, false si hay dependencias, null si falla.
   */
  async eliminarMarca(id) {
    try {
      const productoService = new ProductoService(null, this, null);
      const dependencias = await productoService.verificarDependencias('marca', id);
      if (dependencias && dependencias.hasDependencies) {
        alert(`No se puede eliminar la marca porque está siendo utilizada por ${dependencias.count} producto(s).`);
        return false;
      }

      await super.delete(id);
      await MarcaService.googleSheetSyncMarca.sync("delete", { id: id });
      console.info(`Marca con ID ${id} eliminada correctamente.`);
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
      console.info('Todos los registros de marcas en IndexedDB han sido eliminados.');
    } catch (error) {
      console.error('Error al limpiar IndexedDB para marcas:', error);
    }
  }
}

export { MarcaService };