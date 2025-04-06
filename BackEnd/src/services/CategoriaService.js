import { IndexedDB } from '../database/indexdDB.js';
import { Validar } from '../utils/validar.js';
import { Categoria } from '../models/Categoria.js';
import { ProductoService } from './ProductoService.js';
import GoogleSheetSync from '../database/syncGoogleSheet.js';
import GoogleSheetReader from '../database/GoogleSheetReader.js';

class CategoriaService extends IndexedDB {
  static googleSheetSync = new GoogleSheetSync('https://script.google.com/macros/s/AKfycbx0M1Jaz4ZIHs4tqeIulSrdIsn1tsu6BW0twVwc3Vo0_YybZftwE0RR8dQL3ZZgtUg/exec');
  static googleSheetReader = new GoogleSheetReader('https://script.google.com/macros/s/AKfycbwZI6N0nrosC8jqrEHisC1L8S1pqJGsTadzVc3hpmCiWIRrkNCAOaev4woqzK_tFRVP/exec');

  constructor() {
    super('mydb', 'categorias');
    this.lastSyncTime = null; // Marca de tiempo de la última sincronización
  }

  async syncWithGoogleSheets() {
    try {
      const categoriasData = await CategoriaService.googleSheetReader.getData('Categoria');
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

      // Limpiar datos existentes en IndexedDB
      await this.clearAll();

      // Agregar nuevos datos a IndexedDB
      for (const categoria of categoriasInstancias) {
        await super.add(categoria);
      }

      this.lastSyncTime = new Date();
      console.info('Datos sincronizados con Google Sheets y almacenados en IndexedDB.');
    } catch (error) {
      console.error('Error al sincronizar con Google Sheets:', error);
    }
  }

  async obtenerTodasLasCategorias() {
    try {
      // Verificar si es necesario sincronizar (por ejemplo, cada 2 minutos o en la carga inicial)
      if (!this.lastSyncTime || (new Date() - this.lastSyncTime) > 2 * 60 * 1000) {
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

  async obtenerCategoriaPorId(id) {
    try {
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

  async agregarCategoria(categoria) {
    try {
      const nombreValidado = await Validar.nombreBM(categoria.nombre, this);
      if (!nombreValidado) return null;

      const lastId = await this.getAll().then(categorias => {
        if (categorias.length === 0) return 0;
        return Math.max(...categorias.map(c => c.id));
      });
      const nextId = lastId + 1;

      const nuevaCategoria = new Categoria(nombreValidado);
      nuevaCategoria.id = nextId;

      await super.add(nuevaCategoria);
      await CategoriaService.googleSheetSync.sync("create", nuevaCategoria);
      return nuevaCategoria;
    } catch (error) {
      console.error('Error al agregar categoría:', error);
      return null;
    }
  }

  async actualizarCategoria(id, datosActualizados) {
    try {
      let nombreValidado = datosActualizados.nombre;
      if (nombreValidado) {
        nombreValidado = await Validar.nombreBM(nombreValidado, this, id);
        if (!nombreValidado) return null;
      }

      const categoriaExistente = await this.obtenerCategoriaPorId(id);
      if (!categoriaExistente) return null;

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
        await CategoriaService.googleSheetSync.sync("update", categoriaExistente);
        return categoriaExistente;
      }
      return categoriaExistente;
    } catch (error) {
      console.error(`Error al actualizar categoría con ID ${id}:`, error);
      return null;
    }
  }

  async eliminarCategoria(id) {
    try {
      const productoService = new ProductoService(this, null, null);
      const dependencias = await productoService.verificarDependencias('categoria', id);
      if (dependencias && dependencias.hasDependencies) {
        alert(`No se puede eliminar la categoría porque está siendo utilizada por ${dependencias.count} producto(s).`);
        return false;
      }

      await super.delete(id);
      await CategoriaService.googleSheetSync.sync("delete", { id: id });
      return true;
    } catch (error) {
      console.error(`Error al eliminar categoría con ID ${id}:`, error);
      return null;
    }
  }

  async clearAll() {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.clear();
      console.info('Todos los registros en IndexedDB han sido eliminados.');
    } catch (error) {
      console.error('Error al limpiar IndexedDB:', error);
    }
  }
}

export { CategoriaService };