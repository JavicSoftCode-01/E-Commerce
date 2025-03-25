// BackEnd/src/models/BasePersona.js

/**
 * 🔰🔰Clase BasePersona que servirá para cliente y proveedor. Define los campos comunes (id, nombre, teléfono, dirección).🔰🔰
 */
class BasePersona   {

  /**
   * Crea una instancia de BasePersona.
   * @param {string} nombre - Nombre del cliente o proveedor.
   * @param {string} telefono - Número de teléfono del cliente o proveedor.
   * @param {string} direccion - Dirección del cliente o proveedor.
   */
  constructor(nombre, telefono, direccion) {
    this.nombre = nombre;
    this.telefono = telefono;
    this.direccion = direccion;
  }
}

export {BasePersona};