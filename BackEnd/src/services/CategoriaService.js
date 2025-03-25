// BackEnd/src/services/CategoriaService.js
// BackEnd/src/services/CategoriaService.js
import { IndexedDB } from '../database/indexdDB.js';
import { Validar } from '../utils/validar.js';
import { Categoria } from '../models/Categoria.js';

/**
 * Servicio para la gestión de categorías.
 */
class CategoriaService extends IndexedDB {
    constructor() {
        super('mydb', 'categorias');
    }

    async agregarCategoria(categoria) {
        try {
            // 1. Validación
            const nombreValidado = await Validar.nombreBM(categoria.nombre, this);
            if (!nombreValidado) {
                return null; // La validación falló.
            }

            // 2. Creación del objeto
            const nuevaCategoria = new Categoria(nombreValidado);

            // 3. Agregar a IndexedDB (sin asignar ID manualmente)
            const newId = await super.add(nuevaCategoria); // IndexedDB asigna el ID.
            console.info(`Categoría agregada con ID: ${newId}`);  // Usar el ID de IndexedDB
            return newId; // Retornar el ID generado por IndexedDB

        } catch (error) {
            console.error('Error al agregar categoría:', error);
            return null; // Manejo de errores
        }
    }

    async actualizarCategoria(id, categoriaActualizada) {
      try {
          const nombreValidado = await Validar.nombreBM(categoriaActualizada.nombre, this, id);
          if (!nombreValidado) {
              return null;  // Ya se registró el error en Validar.nombreBM
          }

          // Obtener la categoría actual, *antes* de modificarla.
          const categoriaExistente = await this.obtenerCategoriaPorId(id);
          if (!categoriaExistente) {
            console.warn(`No se encontro categoria para actualizar con este ID ${id}`)
            return null
          }

          // Ahora sí, actualiza los datos
          categoriaExistente.nombre = nombreValidado;
          const updatedId = await super.update(id, categoriaExistente);  // Usar 'put'
          console.info(`Categoría con ID ${id} actualizada correctamente.`);
          return updatedId;
      } catch (error) {
          console.error(`Error al actualizar categoría con ID ${id}:`, error);
          return null; // Siempre retornar null en caso de error
      }
  }

    async obtenerTodasLasCategorias() {
      try {
           const categorias = await super.getAll();

            // map() para crear *instancias* de Categoria.  ¡Importante!
            const categoriasInstancias = categorias.map(categoria => {
             const nuevaCategoria = new Categoria(categoria.nombre);
                nuevaCategoria.id = categoria.id;  //  asignar el ID existente
                return nuevaCategoria; // Devuelve *instancias*, no objetos planos
            });
            console.info('Categorías obtenidas:', categoriasInstancias); // Mostrar *instancias*
           return categoriasInstancias; // Retornar *instancias*, no objetos planos
        } catch (error) {
          console.error('Error al obtener todas las categorías:', error);
            return []; //
        }
     }

    async obtenerCategoriaPorId(id) {
      try {
            const categoria = await super.getById(id); //
          if (categoria) {
                //  crear *instancia* de Categoria
               const nuevaCategoria = new Categoria(categoria.nombre); //
              nuevaCategoria.id = categoria.id; //  asignar el ID
                console.info(`Categoría con ID ${id} obtenida:`, nuevaCategoria);
                return nuevaCategoria; // Retornar una *instancia*, no objeto plano
            } else {
              console.warn(`No se encontró ninguna categoría con ID ${id}.`);
              return null; //consistencia
            }
       } catch (error) {
          console.error(`Error al obtener categoría con ID ${id}:`, error);
            return null; // MUY importante retornar null.
      }
    }


   async eliminarCategoria(id) {
       try {
           await super.delete(id);
          alert(`Categoría con ID ${id} eliminada correctamente.`);

          console.info(`Categoría con ID ${id} eliminada correctamente.`);

      } catch (error) {
           console.error(`Error al eliminar la categoría con ID ${id}:`, error);
         // return false;   <- Ya no es necesario, con los otros cambios ya se hace un return
        return null
       }
  }
}

export { CategoriaService };