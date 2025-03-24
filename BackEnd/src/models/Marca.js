// BackEnd/src/models/Marca.js
import {BaseModel} from './BaseModel.js';

/**
 * 🔰🔰Clase que representa una marca de productos.🔰🔰
 */
class Marca extends BaseModel {

  /**
   * Crea una instancia de Marca.
   * @param {string} nombre - Nombre de la marca.
   * @param {Array<string>} [mar_nombresExistentes=[]] - Array opcional con nombres de marcas existentes (para validación). No usado
   */
  constructor(nombre, mar_nombresExistentes = []) {
    super(nombre); // Llama al constructor de BaseModel.
  }
}

export {Marca};