// BackEnd/src/services/MarcaService.js
import {IndexedDB} from '../database/indexdDB.js';
import {Validar} from '../utils/validar.js';
import {Marca} from '../models/Marca.js'; // Importa la clase Marca

/**
 * 🔰 Servicio para la gestión de marcas.
 *  Extiende de IndexedDB para interactuar con la base de datos.
 */
class MarcaService extends IndexedDB {
  /**
   * Constructor del servicio de Marca.
   */
  constructor() {
    super('mydb', 'marcas');
  }

  /**
   * Agrega una nueva marca a la base de datos.
   * @param {Marca} marca - Objeto marca a agregar.
   * @returns {Promise<number|null>} - El ID de la marca agregada o null si falla.
   */
  async agregarMarca(marca) {
    try {
      const nombreValidado = await Validar.nombreBM(marca.nombre, this);
      if (!nombreValidado) {
        return null; // Ya se registró el error en Validar.nombreBM
      }

      const nuevaMarca = new Marca(nombreValidado); // Crea una instancia de la clase Marca.
      nuevaMarca.id = await super.add(nuevaMarca);

      console.info(`Marca agregada con ID: ${nuevaMarca.id}`);
      return nuevaMarca.id;
    } catch (error) {
      console.error('Error al agregar marca:', error);
      return null;
    }
  }

  /**
   * Actualiza una marca existente en la base de datos.
   * @param {number} id - ID de la marca a actualizar.
   * @param {Marca} marcaActualizada - Objeto marca con los datos actualizados.
   * @returns {Promise<number|null>} - El ID de la marca actualizada o null si falla.
   */
  async actualizarMarca(id, marcaActualizada) {
    try {
      const nombreValidado = await Validar.nombreBM(marcaActualizada.nombre, this, id);
      if (!nombreValidado) {
        return null; // Ya se registró el error en Validar.nombreBM
      }
      // Obtiene la marca de la DB
      const marcaExistente = await this.obtenerMarcaPorId(id);
        if (!marcaExistente) {
            return null;
        }
      marcaExistente.nombre = nombreValidado; // Actualiza
      const updatedId = await super.update(id, marcaExistente); // Guarda los cambios
      console.info(`Marca con ID ${id} actualizada correctamente.`);
      return updatedId;
    } catch (error) {
      console.error(`Error al actualizar marca con ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Obtiene todas las marcas.
   * @returns {Promise<Array<Marca>>} - Un array con todas las marcas o un array vacío en caso de error.
   */
  async obtenerTodasLasMarcas() {
    try {
      const marcas = await super.getAll();
      // map para crear instancias.
      const marcasInstancias = marcas.map(marca => {
        const nuevaMarca = new Marca(marca.nombre);  // Crea una instancia de Marca.
        nuevaMarca.id = marca.id
        return nuevaMarca;  // Devuelve la instancia
      });
      console.info('Marcas obtenidas:', marcasInstancias);
      return marcasInstancias; // Devuelve instancias
    } catch (error) {
      console.error('Error al obtener todas las marcas:', error);
      return []; // Devuelve un array vacío en caso de error.
    }
  }

  /**
   * Obtiene una marca por su ID.
   * @param {number} id - ID de la marca a obtener.
   * @returns {Promise<Marca|null>} - La marca encontrada o null si no se encuentra.
   */
  async obtenerMarcaPorId(id) {
    try {
      const marca = await super.getById(id);
      if (marca) {
        const nuevaMarca = new Marca(marca.nombre); // Crea instancia
        nuevaMarca.id = marca.id
        console.info(`Marca con ID ${id} obtenida:`, nuevaMarca);
        return nuevaMarca;  // Devuelve instancia
      } else {
        console.warn(`No se encontró ninguna marca con ID ${id}.`);
        return null;
      }
    } catch (error) {
      console.error(`Error al obtener Marca con ID ${id}:`, error);
      return null;
    }
  }

    /**
     * Elimina una marca por su ID.
     * @param {number} id - ID de la marca a eliminar.
     * @returns {Promise<void|null>} - Devuelve void si se elimina, o null si falla.
     */
    async eliminarMarca(id) {
        try {
            await super.delete(id);
            console.info(`La marca con ID ${id} fue eliminada correctamente.`);
        } catch (error) {
            console.error(`Error al intentar eliminar la marca con ID ${id}:`, error);
            return null;
        }
    }
}

export {MarcaService};