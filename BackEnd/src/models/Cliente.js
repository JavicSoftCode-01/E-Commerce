// BackEnd/src/models/Cliente.js
import {BasePersona} from './BasePersona.js'

/**
 * 🔰🔰Clase que representa un cliente.🔰🔰
 */
class Cliente extends BasePersona {

  /**
   * Crea una instancia de Cliente.
   * @param {string} cliente - Nombre del cliente.
   * @param {string} telefono - Teléfono del cliente.
   * @param {string} direccion - Dirección del cliente.
   * @param {Array<string>} [cli_telefonosExistentes=[]] - Array opcional con teléfonos de clientes existentes (para validación). No usado
   */
  constructor(cliente, telefono, direccion, cli_telefonosExistentes = []) {
    super(cliente, telefono, direccion); // Llama al constructor de BasePersona.
  }
}

export {Cliente};