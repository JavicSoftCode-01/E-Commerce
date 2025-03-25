// BackEnd/src/models/BaseModel.js
/**
 * Clase BaseModel que servirá para categoría, marca y producto.
 * Define los campos comunes (id y nombre).
 */
class BaseModel {
  /**
   * Crea una instancia de BaseModel.
   * @param {string} nombre - Nombre de la categoría, marca o producto.
   */
  constructor(nombre) {
    // this.id = null; // ¡Elimina esto!  IndexedDB se encarga del ID con autoIncrement.
    this.nombre = nombre;
  }
}

export { BaseModel };