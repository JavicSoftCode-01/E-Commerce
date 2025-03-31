// BackEnd/src/services/MarcaService.js
import {IndexedDB} from '../database/indexdDB.js';
import {Validar} from '../utils/validar.js';
import {Marca} from '../models/Marca.js';

/**
 * 🔰🔰Servicio para la gestión de marcas.
 *  Extiende de IndexedDB para interactuar con la base de datos.🔰🔰
 */
class MarcaService extends IndexedDB {
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
          // 1. Validación del nombre
          const nombreValidado = await Validar.nombreBM(marca.nombre, this);
          if (!nombreValidado) {
              return null; // Ya se registró el error en Validar.nombreBM
          }

          // 2. Obtener el último ID y generar el siguiente
          const lastId = await this.getAll()
              .then(marcas => {
                  if (marcas.length === 0) return 0;
                  return Math.max(...marcas.map(m => m.id));
              });
          const nextId = lastId + 1;

          // 3. Crear instancia con ID
          const nuevaMarca = new Marca(nombreValidado);
          nuevaMarca.id = nextId; // Asignar el ID antes de guardar

          // 4. Agregar a IndexedDB
          await super.add(nuevaMarca);
          console.info(`Marca agregada con ID: ${nextId}`);
          return nextId;

      } catch (error) {
          console.error('Error al agregar marca:', error);
          return null;
      }
  }
                                           /**
     * Actualiza una marca existente. Solo guarda si hay cambios reales.
     * Actualiza fechaActualizacion solo si hubo cambios.
     * @param {number} id - ID de la marca a actualizar.
     * @param {object} datosActualizados - Objeto con los campos a actualizar (ej. { nombre: "Nuevo Nombre" }).
     * @returns {Promise<number|null>} - El ID de la marca si se actualizó o si no hubo cambios, null en caso de error.
     */
    async actualizarMarca(id, datosActualizados) {
        try {
            // 1. Validar el nombre si se proporcionó para actualizar
            const nombreValidado = await Validar.nombreBM(datosActualizados.nombre, this, id);
            if (!nombreValidado) {
                return null; // La validación falló.
            }

            // 2. Obtener la marca ACTUAL desde la BD (¡usando el método corregido abajo!)
            const marcaExistente = await this.obtenerMarcaPorId(id);
            if (!marcaExistente) {
                console.warn(`No se encontró marca para actualizar con ID ${id}`);
                return null; // No se encontró el registro
            }

            // 3. Comparar si hubo cambios reales
            let huboCambios = false;
            if (marcaExistente.nombre !== nombreValidado) {
                marcaExistente.nombre = nombreValidado; // Actualiza el nombre en la instancia
                huboCambios = true;
            }
            // --- Añadir comparaciones para otros campos si Marca tuviera más ---
            // Ejemplo si tuviera 'estado':
            // if (typeof datosActualizados.estado === 'boolean' && marcaExistente.estado !== datosActualizados.estado) {
            //     marcaExistente.estado = datosActualizados.estado;
            //     huboCambios = true;
            // }

            // 4. Si hubo cambios, actualizar timestamp y guardar en BD
            if (huboCambios) {
                marcaExistente.prepareForUpdate(); // Actualiza fechaActualizacion
                const updatedId = await super.update(id, marcaExistente); // Guarda el objeto COMPLETO
                console.info(`Marca con ID ${id} actualizada correctamente porque hubo cambios.`);
                // Podrías retornar updatedId si tu método update lo devuelve, sino id está bien.
                return id;
            } else {
                console.info(`Marca con ID ${id} no tuvo cambios detectados. No se actualizó.`);
                return id; // Retorna el ID indicando éxito, pero sin operación de guardado.
            }

        } catch (error) {
            console.error(`Error al actualizar marca con ID ${id}:`, error);
            return null; // Error durante el proceso
        }
    }

    /**
     * Obtiene todas las marcas, asegurando que se creen instancias completas.
     * @returns {Promise<Array<Marca>>} - Un array con todas las instancias de Marca.
     */
    async obtenerTodasLasMarcas() {
        try {
            const marcasData = await super.getAll(); // Obtiene los datos crudos

            // map() para crear *instancias* de Marca, pasando todos los datos
            const marcasInstancias = marcasData.map(mData => {
                // Usa el constructor de Marca, pasando todos los datos relevantes para BaseModel
                const instancia = new Marca(
                    mData.nombre,
                    mData.estado, // Pasa el estado guardado
                    mData.fechaCreacion, // Pasa la fecha de creación guardada
                    mData.fechaActualizacion // Pasa la fecha de actualización guardada
                );
                instancia.id = mData.id; // Asigna el ID después de la construcción
                return instancia; // Devuelve la instancia completa
            });
            // console.info('Marcas obtenidas:', marcasInstancias); // Opcional
            return marcasInstancias; // Retornar las instancias
        } catch (error) {
            console.error('Error al obtener todas las marcas:', error);
            return []; // Retorna array vacío en caso de error
        }
    }

    /**
     * Obtiene una marca por su ID, asegurando que se cree una instancia completa.
     * @param {number} id - ID de la marca a obtener.
     * @returns {Promise<Marca|null>} - La instancia de Marca encontrada o null.
     */
    async obtenerMarcaPorId(id) {
        try {
            const marcaData = await super.getById(id); // Obtiene datos crudos
            if (marcaData) {
                // Crear instancia de Marca pasando TODOS los datos relevantes a BaseModel
                const instanciaMarca = new Marca(
                    marcaData.nombre,
                    marcaData.estado, // Pasa el estado
                    marcaData.fechaCreacion, // Pasa fecha creación
                    marcaData.fechaActualizacion // Pasa fecha actualización
                );
                instanciaMarca.id = marcaData.id; // Asigna el ID
                // console.info(`Marca con ID ${id} obtenida:`, instanciaMarca); // Opcional
                return instanciaMarca; // Retornar la instancia completa
            } else {
                console.warn(`No se encontró ninguna marca con ID ${id}.`);
                return null; // Retorna null si no se encuentra
            }
        } catch (error) {
            console.error(`Error al obtener Marca con ID ${id}:`, error);
            return null; // Retorna null en caso de error
        }
    }
  /**
   * Actualiza una marca existente en la base de datos.
   * @param {number} id - ID de la marca a actualizar.
   * @param {Marca} marcaActualizada - Objeto marca con los datos actualizados.
   * @returns {Promise<number|null>} - El ID de la marca actualizada o null si falla.
   */
  // async actualizarMarca(id, marcaActualizada) {
  //   try {
  //     const nombreValidado = await Validar.nombreBM(marcaActualizada.nombre, this, id);
  //     if (!nombreValidado) {
  //       return null; // Ya se registró el error en Validar.nombreBM
  //     }
  //     // Obtiene la marca de la DB
  //     const marcaExistente = await this.obtenerMarcaPorId(id);
  //     if (!marcaExistente) {
  //       return null;
  //     }
  //     marcaExistente.nombre = nombreValidado; // Actualiza
  //     const updatedId = await super.update(id, marcaExistente); // Guarda los cambios
  //     console.info(`Marca con ID ${id} actualizada correctamente.`);
  //     return updatedId;
  //   } catch (error) {
  //     console.error(`Error al actualizar marca con ID ${id}:`, error);
  //     return null;
  //   }
  // }
  //
  // /**
  //  * Obtiene todas las marcas.
  //  * @returns {Promise<Array<Marca>>} - Un array con todas las marcas o un array vacío en caso de error.
  //  */
  // async obtenerTodasLasMarcas() {
  //   try {
  //     const marcas = await super.getAll();
  //     // map para crear instancias.
  //     const marcasInstancias = marcas.map(marca => {
  //       const nuevaMarca = new Marca(marca.nombre);  // Crea una instancia de Marca.
  //       nuevaMarca.id = marca.id
  //       return nuevaMarca;  // Devuelve la instancia
  //     });
  //     console.info('Marcas obtenidas:', marcasInstancias);
  //     return marcasInstancias; // Devuelve instancias
  //   } catch (error) {
  //     console.error('Error al obtener todas las marcas:', error);
  //     return []; // Devuelve un array vacío en caso de error.
  //   }
  // }
  //
  // /**
  //  * Obtiene una marca por su ID.
  //  * @param {number} id - ID de la marca a obtener.
  //  * @returns {Promise<Marca|null>} - La marca encontrada o null si no se encuentra.
  //  */
  // async obtenerMarcaPorId(id) {
  //   try {
  //     const marca = await super.getById(id);
  //     if (marca) {
  //       const nuevaMarca = new Marca(marca.nombre); // Crea instancia
  //       nuevaMarca.id = marca.id
  //       console.info(`Marca con ID ${id} obtenida:`, nuevaMarca);
  //       return nuevaMarca;  // Devuelve instancia
  //     } else {
  //       console.warn(`No se encontró ninguna marca con ID ${id}.`);
  //       return null;
  //     }
  //   } catch (error) {
  //     console.error(`Error al obtener Marca con ID ${id}:`, error);
  //     return null;
  //   }
  // }

  /**
   * Elimina una marca por su ID.
   * @param {number} id - ID de la marca a eliminar.
   * @returns {Promise<void|null>} - Devuelve void si se elimina, o null si falla.
   */
  async eliminarMarca(id) {
    try {
      await super.delete(id);
      alert(`Categoría con ID ${id} eliminada correctamente.`);
      console.info(`La marca con ID ${id} fue eliminada correctamente.`);
    } catch (error) {
      console.error(`Error al intentar eliminar la marca con ID ${id}:`, error);
      return null;
    }
  }
}

export {MarcaService};