// BackEnd/src/models/Categoria.js
import {BaseModel} from './BaseModel.js'

/**
 * 🔰🔰Clase que representa una categoría de productos.🔰🔰
 */
class Categoria extends BaseModel {

  /**
   * Crea una instancia de Categoria.
   * @param {string} nombre - Nombre de la categoría.
   * @param {Array<string>} [ctg_nombresExistentes=[]] - Array opcional con nombres de categorías existentes (para validación). No usado
   */
  constructor(nombre, ctg_nombresExistentes = []) {
    super(nombre); // Llama al constructor de BaseModel.
  }
}

export {Categoria};