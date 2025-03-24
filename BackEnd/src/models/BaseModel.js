// BackEnd/src/models/BaseModel.js
import {Model} from './Models.js'

/**
 * 🔰🔰Clase BaseModel que servirá para categoría, marca y producto.  Define los campos comunes (id y nombre).🔰🔰
 */
class BaseModel extends Model {

  /**
   * Crea una instancia de BaseModel.
   * @param {string} nombre - Nombre de la categoría, marca o producto.
   */
  constructor(nombre) {
    super();
    this.id = null; // Se establece en null inicialmente. Se asignará un valor al guardar en la DB.
    this.nombre = nombre;
  }
}

export {BaseModel};