// BackEnd/src/models/BasePersona.js
import {Model} from './Models.js'

/**
 * 🔰🔰Clase BasePersona que servirá para cliente y proveedor. Define los campos comunes (id, nombre, teléfono, dirección).🔰🔰
 */
class BasePersona extends Model {

  /**
   * Crea una instancia de BasePersona.
   * @param {string} nombre - Nombre del cliente o proveedor.
   * @param {string} telefono - Número de teléfono del cliente o proveedor.
   * @param {string} direccion - Dirección del cliente o proveedor.
   */
  constructor(nombre, telefono, direccion) {
    super();
    this.id = null; //  Se establece en null inicialmente.  Se asignará un valor al guardar en la DB.
    this.nombre = nombre;
    this.telefono = telefono;
    this.direccion = direccion;
  }
}

export {BasePersona};