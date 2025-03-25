// BackEnd/src/models/Categoria.js
import { BaseModel } from './BaseModel.js';

/**
 * Clase que representa una categoría de productos.
 */
class Categoria extends BaseModel {
  /**
   * Crea una instancia de Categoria.
   * @param {string} nombre - Nombre de la categoría.
   */
  constructor(nombre) {
    super(nombre); // Llama al constructor de BaseModel.
  }
}

export { Categoria };