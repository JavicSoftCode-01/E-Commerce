// BackEnd/src/services/CategoriaService.js
import { IndexedDB } from '../database/indexdDB.js';
import { Validar } from '../utils/validar.js';
import { Categoria } from '../models/Categoria.js';
import { ProductoService } from './ProductoService.js';
import GoogleSheetSync from '../database/syncGoogleSheet.js';
import GoogleSheetReader from '../database/GoogleSheetReader.js';

/**
 * Servicio para la gestión de categorías.
 * Extiende de IndexedDB y sincroniza con Google Sheets de manera directa y rápida.
 */
class CategoriaService extends IndexedDB {
  static googleSheetSyncCategoria = new GoogleSheetSync('https://script.google.com/macros/s/AKfycbx0M1Jaz4ZIHs4tqeIulSrdIsn1tsu6BW0twVwc3Vo0_YybZftwE0RR8dQL3ZZgtUg/exec');
  static googleSheetReaderCategoria = new GoogleSheetReader('https://script.google.com/macros/s/AKfycbyLo0yfdaZwbkyVLWsg-4sR0k1geWJOw99mvO8EC1lDm8M_AkC1EPVg_XnStvZo4YQ/exec');

  // Intervalo de sincronización (3 segundos)
  static SYNC_INTERVAL = 3 * 1000;

  constructor() {
    super('mydb', 'categorias');
    this.lastSyncTime = null;
    this.startPeriodicSync();
  }

  /**
   * Inicia la sincronización periódica.
   */
  startPeriodicSync() {
    this.syncWithGoogleSheets();
    setInterval(() => this.syncWithGoogleSheets(), CategoriaService.SYNC_INTERVAL);
  }

  /**
   * Sincroniza los datos desde Google Sheets a IndexedDB.
   */
  async syncWithGoogleSheets() {
    try {
      console.log('Iniciando sincronización de categorías con Google Sheets...');
      const categoriasData = await CategoriaService.googleSheetReaderCategoria.getData('Categoria');
      console.log(`Recibidos ${categoriasData.length} registros de categorías.`);
      const categoriasInstancias = categoriasData.map(catData => {
        const instancia = new Categoria(
          catData.nombre,
          catData.estado,
          catData.fechaCreacion,
          catData.fechaActualizacion
        );
        instancia.id = catData.id;
        return instancia;
      });
      await this.clearAll();
      for (const categoria of categoriasInstancias) {
        await super.add(categoria);
      }
      this.lastSyncTime = new Date();
      console.info(`Sincronización de categorías exitosa: ${categoriasInstancias.length} registros a las ${this.lastSyncTime}`);
      return true;
    } catch (error) {
      console.error('Error en sincronización de categorías:', error);
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
   * Obtiene todas las categorías, sincronizando si es necesario.
   */
  async obtenerTodasLasCategorias() {
    try {
      if (!this.lastSyncTime || (new Date() - this.lastSyncTime) > CategoriaService.SYNC_INTERVAL) {
        await this.syncWithGoogleSheets();
      }
      const categoriasData = await super.getAll();
      const categoriasInstancias = categoriasData.map(catData => {
        const instancia = new Categoria(
          catData.nombre,
          catData.estado,
          catData.fechaCreacion,
          catData.fechaActualizacion
        );
        instancia.id = catData.id;
        return instancia;
      });
      return categoriasInstancias;
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      return [];
    }
  }

  /**
   * Obtiene una categoría por ID.
   */
  async obtenerCategoriaPorId(id) {
    try {
      if (!this.lastSyncTime || (new Date() - this.lastSyncTime) > CategoriaService.SYNC_INTERVAL) {
        await this.syncWithGoogleSheets();
      }
      const categoriaData = await super.getById(id);
      if (categoriaData) {
        const instanciaCategoria = new Categoria(
          categoriaData.nombre,
          categoriaData.estado,
          categoriaData.fechaCreacion,
          categoriaData.fechaActualizacion
        );
        instanciaCategoria.id = categoriaData.id;
        return instanciaCategoria;
      }
      return null;
    } catch (error) {
      console.error(`Error al obtener categoría con ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Agrega una nueva categoría y sincroniza con Google Sheets.
   */
  async agregarCategoria(categoria) {
    try {
      await this.forceSyncNow();
      const nombreValidado = await Validar.nombreBM(categoria.nombre, this);
      if (!nombreValidado) return null;

      const lastId = await this.getAll().then(categorias => {
        return categorias.length === 0 ? 0 : Math.max(...categorias.map(c => c.id));
      });
      const nextId = lastId + 1;

      const nuevaCategoria = new Categoria(nombreValidado, categoria.estado);
      nuevaCategoria.id = nextId;

      await super.add(nuevaCategoria);
      console.log(`Categoría creada localmente con ID: ${nextId}. Sincronizando...`);
      await CategoriaService.googleSheetSyncCategoria.sync("create", nuevaCategoria);
      console.info(`Categoría con ID: ${nextId} sincronizada.`);
      await this.forceSyncNow();
      return nuevaCategoria;
    } catch (error) {
      console.error('Error al agregar categoría:', error);
      return null;
    }
  }

  /**
   * Actualiza una categoría existente y sincroniza con Google Sheets.
   */
  async actualizarCategoria(id, datosActualizados) {
    try {
      await this.forceSyncNow();
      const categoriaExistente = await this.obtenerCategoriaPorId(id);
      if (!categoriaExistente) return null;

      let nombreValidado = datosActualizados.nombre !== undefined
        ? await Validar.nombreBM(datosActualizados.nombre, this, id)
        : categoriaExistente.nombre;
      if (datosActualizados.nombre !== undefined && !nombreValidado) return null;

      let huboCambios = false;
      if (nombreValidado && categoriaExistente.nombre !== nombreValidado) {
        categoriaExistente.nombre = nombreValidado;
        huboCambios = true;
      }
      if (datosActualizados.estado !== undefined && categoriaExistente.estado !== datosActualizados.estado) {
        categoriaExistente.estado = datosActualizados.estado;
        huboCambios = true;
      }

      if (huboCambios) {
        categoriaExistente.prepareForUpdate();
        await super.update(id, categoriaExistente);
        console.log(`Categoría con ID ${id} actualizada localmente.`);
        await CategoriaService.googleSheetSyncCategoria.sync("update", categoriaExistente);
        console.info(`Categoría con ID ${id} sincronizada.`);
        await this.forceSyncNow();
        return categoriaExistente;
      }
      console.info(`Categoría con ID ${id} sin cambios.`);
      return categoriaExistente;
    } catch (error) {
      console.error(`Error al actualizar categoría con ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Elimina una categoría y sincroniza con Google Sheets.
   */
  async eliminarCategoria(id) {
    try {
      await this.forceSyncNow();
      const productoService = new ProductoService(this, null, null);
      const dependencias = await productoService.verificarDependencias('categoria', id);
      if (dependencias && dependencias.hasDependencies) {
        alert(`No se puede eliminar la categoría por ${dependencias.count} dependencias.`);
        return false;
      }
      await super.delete(id);
      console.log(`Categoría con ID ${id} eliminada localmente.`);
      await CategoriaService.googleSheetSyncCategoria.sync("delete", { id: id });
      console.info(`Categoría con ID ${id} eliminada y sincronizada.`);
      await this.forceSyncNow();
      return true;
    } catch (error) {
      console.error(`Error al eliminar categoría con ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Limpia todos los registros de categorías en IndexedDB.
   */
  async clearAll() {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.clear();
      console.info('IndexedDB de categorías limpiado.');
    } catch (error) {
      console.error('Error al limpiar IndexedDB de categorías:', error);
    }
  }
}

export { CategoriaService };