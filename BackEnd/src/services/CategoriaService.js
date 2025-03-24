// BackEnd/src/services/CategoriaService.js
import {IndexedDB} from '../database/indexdDB.js';
import {Validar} from '../utils/validar.js';
import {Categoria} from '../models/Categoria.js'; // Importa la clase Categoria

/**
 * 🔰 Servicio para la gestión de categorías.
 *  Extiende de IndexedDB para interactuar con la base de datos.
 */
class CategoriaService extends IndexedDB {
  /**
   * Constructor del servicio de Categoría.
   */
  constructor() {
    super('mydb', 'categorias');
  }

  /**
   * Agrega una nueva categoría a la base de datos.
   * @param {Categoria} categoria - Objeto categoría a agregar.
   * @returns {Promise<number|null>} - El ID de la categoría agregada o null si falla.
   */
  async agregarCategoria(categoria) {
    try {
      const nombreValidado = await Validar.nombreBM(categoria.nombre, this);
      if (!nombreValidado) {
        return null; // Ya se registró el error en Validar.nombreBM
      }

      const nuevaCategoria = new Categoria(nombreValidado); // Crea una instancia de la clase Categoria
      nuevaCategoria.id = await super.add(nuevaCategoria); //

      console.info(`Categoría agregada con ID: ${nuevaCategoria.id}`);
      return nuevaCategoria.id;
    } catch (error) {
      console.error('Error al agregar categoría:', error);
      return null;
    }
  }

  /**
   * Actualiza una categoría existente en la base de datos.
   * @param {number} id - ID de la categoría a actualizar.
   * @param {Categoria} categoriaActualizada - Objeto categoría con los datos actualizados.
   * @returns {Promise<number|null>} - El ID de la categoría actualizada o null si falla.
   */
  async actualizarCategoria(id, categoriaActualizada) {
    try {
      const nombreValidado = await Validar.nombreBM(categoriaActualizada.nombre, this, id);
      if (!nombreValidado) {
        return null;  // Ya se registró el error en Validar.nombreBM
      }
            // Obtener la categoría actual de la base de datos.
            const categoriaExistente = await this.obtenerCategoriaPorId(id);
            if (!categoriaExistente) {
                return null; // No existe -> obtenerCategoriaPorId ya muestra el warn
            }

      categoriaExistente.nombre = nombreValidado; // Actualiza solo el nombre

      const updatedId = await super.update(id, categoriaExistente); // Actualiza
      console.info(`Categoría con ID ${id} actualizada correctamente.`);
      return updatedId;
    } catch (error) {
      console.error(`Error al actualizar categoría con ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Obtiene todas las categorías.
   * @returns {Promise<Array<Categoria>>} - Un array con todas las categorías o un array vacío en caso de error.
   */
  async obtenerTodasLasCategorias() {
    try {
      const categorias = await super.getAll();
      const categoriasInstancias = categorias.map(categoria => {
        const nuevaCategoria = new Categoria(categoria.nombre); // Crea una instancia de Categoria.
        nuevaCategoria.id = categoria.id;
        return nuevaCategoria; // Devuelve la instancia, no el objeto plano
      });
      console.info('Categorías obtenidas:', categoriasInstancias);
      return categoriasInstancias; // Devuelve instancias, no objetos planos
    } catch (error) {
      console.error('Error al obtener todas las categorías:', error);
      return []; // Devuelve un array vacío en caso de error
    }
  }

  /**
   * Obtiene una categoría por su ID.
   * @param {number} id - ID de la categoría a obtener.
   * @returns {Promise<Categoria|null>} - La categoría encontrada o null si no se encuentra o hay un error.
   */
  async obtenerCategoriaPorId(id) {
    try {
      const categoria = await super.getById(id);
      if (categoria) {
          const nuevaCategoria = new Categoria(categoria.nombre);  // Crea una instancia de Categoria
          nuevaCategoria.id = categoria.id; // Asigna el ID
          console.info(`Categoría con ID ${id} obtenida:`, nuevaCategoria);
        return nuevaCategoria; // Devuelve una instancia
      } else {
        console.warn(`No se encontró ninguna categoría con ID ${id}.`);
        return null;
      }
    } catch (error) {
      console.error(`Error al obtener categoría con ID ${id}:`, error);
      return null;
    }
  }

    /**
   * Elimina una categoría por su ID.
   * @param {number} id - ID de la categoría a eliminar.
   * @returns {Promise<void|null>} - Devuelve void si la categoría se eliminó correctamente, o null en caso de error..
   */
    async eliminarCategoria(id) {
        try {
            await super.delete(id);
            console.info(`La categoría con ID ${id} ha sido eliminada correctamente.`);
        } catch (error) {
            console.error(`Error al eliminar la categoría con ID ${id}:`, error);
            return null
        }
    }
}

export {CategoriaService};