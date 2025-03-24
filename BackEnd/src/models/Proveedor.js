// BackEnd/src/models/Proveedor.js
import {BasePersona} from './BasePersona.js';

/**
 *  🔰🔰Clase Proveedor que gestiona entidades de proveedores.🔰🔰
 */
class Proveedor extends BasePersona {

  /**
   * Crea una instancia de Proveedor.
   * @param {string} nombre - Nombre del proveedor.
   * @param {string} telefono - Teléfono del proveedor.
   * @param {string} direccion - Dirección del proveedor.
   * @param {Array<string>} [prov_telefonosExistentes=[]] - Array opcional con teléfonos de proveedores existentes (para validación). No usado
   */
  constructor(nombre, telefono, direccion, prov_telefonosExistentes = []) {
    super(nombre, telefono, direccion);
  }
}

export {Proveedor};