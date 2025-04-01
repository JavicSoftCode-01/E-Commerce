// BackEnd/src/services/CategoriaService.js
// BackEnd/src/services/CategoriaService.js
import {IndexedDB} from '../database/indexdDB.js';
import {Validar} from '../utils/validar.js';
import {Categoria} from '../models/Categoria.js';
import {ProductoService} from './ProductoService.js';

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

      // 2. Obtener el último ID y generar el siguiente
      const lastId = await this.getAll()
        .then(categorias => {
          if (categorias.length === 0) return 0;
          return Math.max(...categorias.map(c => c.id));
        });
      const nextId = lastId + 1;

      // 3. Creación del objeto con ID
      const nuevaCategoria = new Categoria(nombreValidado);
      nuevaCategoria.id = nextId; // Asignar el ID antes de guardar

      // 4. Agregar a IndexedDB
      await super.add(nuevaCategoria);
      console.info(`Categoría agregada con ID: ${nextId}`);
      return nextId;

    } catch (error) {
      console.error('Error al agregar categoría:', error);
      return null;
    }
  }

     async actualizarCategoria(id, datosActualizados) {
        try {
            // 1. Validar el nombre si se proporcionó para actualizar
            // Nota: Asumimos que datosActualizados es un objeto como { nombre: "nuevoNombre", /* otros campos */ }
            // Si solo se actualiza el nombre, solo validamos eso.
            const nombreValidado = await Validar.nombreBM(datosActualizados.nombre, this, id);
            if (!nombreValidado) {
                return null; // La validación falló.
            }

            // 2. Obtener la categoría ACTUAL desde la BD (¡usando el método corregido!)
            const categoriaExistente = await this.obtenerCategoriaPorId(id);
            if (!categoriaExistente) {
                console.warn(`No se encontró categoría para actualizar con ID ${id}`);
                return null; // No se encontró el registro
            }

            // 3. Comparar si hubo cambios reales
            let huboCambios = false;
            if (categoriaExistente.nombre !== nombreValidado) {
                categoriaExistente.nombre = nombreValidado; // Actualiza el nombre en la instancia
                huboCambios = true;
            }

            // 4. Si hubo cambios, actualizar timestamp y guardar en BD
            if (huboCambios) {
                categoriaExistente.prepareForUpdate(); // ¡Llamar aquí para actualizar fechaActualizacion!
                const updatedId = await super.update(id, categoriaExistente); // Guarda el objeto COMPLETO
                console.info(`Categoría con ID ${id} actualizada correctamente porque hubo cambios.`);
                return updatedId; // Retorna el ID confirmando la actualización
            } else {
                console.info(`Categoría con ID ${id} no tuvo cambios detectados. No se actualizó fechaActualizacion ni se guardó.`);
                // Puedes decidir qué retornar aquí. Retornar el ID puede ser útil.
                // O podrías retornar un objeto indicando que no hubo cambios: { id: id, updated: false }
                return id;
            }

        } catch (error) {
            console.error(`Error al actualizar categoría con ID ${id}:`, error);
            return null; // Error durante el proceso
        }
    }

    async obtenerTodasLasCategorias() {
      try {
           const categoriasData = await super.getAll(); // Obtiene los datos crudos

            // map() para crear *instancias* de Categoria, pasando todos los datos
            const categoriasInstancias = categoriasData.map(catData => {
                // Asegúrate de que los nombres de campo coincidan con lo guardado en IndexedDB
                const instancia = new Categoria(
                    catData.nombre,
                    catData.estado, // Pasa el estado guardado
                    catData.fechaCreacion, // Pasa la fecha de creación guardada
                    catData.fechaActualizacion // Pasa la fecha de actualización guardada
                );
                instancia.id = catData.id; // Asigna el ID después de la construcción
                return instancia; // Devuelve la instancia completa
            });
            // console.info('Categorías obtenidas:', categoriasInstancias); // Opcional
           return categoriasInstancias; // Retornar las instancias
        } catch (error) {
          console.error('Error al obtener todas las categorías:', error);
            return []; // Retorna array vacío en caso de error
        }
     }

    async obtenerCategoriaPorId(id) {
      try {
            const categoriaData = await super.getById(id); // Obtiene datos crudos
            if (categoriaData) {
                // Crear instancia pasando TODOS los datos relevantes
                const instanciaCategoria = new Categoria(
                    categoriaData.nombre,
                    categoriaData.estado, // Pasa el estado guardado
                    categoriaData.fechaCreacion, // Pasa la fecha de creación guardada
                    categoriaData.fechaActualizacion // Pasa la fecha de actualización guardada
                );
                instanciaCategoria.id = categoriaData.id; // Asigna el ID después
                // console.info(`Categoría con ID ${id} obtenida:`, instanciaCategoria); // Opcional
                return instanciaCategoria; // Retornar la instancia completa
            } else {
              console.warn(`No se encontró ninguna categoría con ID ${id}.`);
              return null; // Retorna null si no se encuentra
            }
       } catch (error) {
          console.error(`Error al obtener categoría con ID ${id}:`, error);
            return null; // Retorna null en caso de error
      }
    }


    async eliminarCategoria(id) {
      try {
        // Verificar dependencias con productos
        const productoService = new ProductoService(this, null, null);
        const dependencias = await productoService.verificarDependencias('categoria', id);
        
        if (dependencias && dependencias.hasDependencies) {
          alert(`No se puede eliminar la categoría porque está siendo utilizada por ${dependencias.count} producto(s).`);
          console.warn(`Imposible eliminar: La categoría con ID ${id} está siendo utilizada por ${dependencias.count} producto(s).`);
          return false;
        }
        
        // Si no hay dependencias, proceder con la eliminación
        await super.delete(id);
        alert(`Categoría con ID ${id} eliminada correctamente.`);
        console.info(`Categoría con ID ${id} eliminada correctamente.`);
        return true;
        
      } catch (error) {
        console.error(`Error al eliminar la categoría con ID ${id}:`, error);
        return null;
      }
    }
}

export {CategoriaService};