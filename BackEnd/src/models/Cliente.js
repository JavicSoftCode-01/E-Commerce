// BackEnd/src/models/Cliente.js
import { BasePersona } from './BasePersona.js';

/**
 * 🔰 Clase que representa un cliente.
 * Hereda de BasePersona. 🔰
 */
class Cliente extends BasePersona {

  /**
   * Crea una instancia de Cliente.
   * @param {string} nombre - Nombre del cliente. (Cambiado de 'cliente' a 'nombre' para consistencia)
   * @param {string} telefono - Teléfono del cliente.
   * @param {string} direccion - Dirección del cliente.
   * @param {boolean} [estado=true] - Estado del cliente (activo/inactivo).
   * @param {Date} [fechaCreacion=null] - Fecha de creación (opcional, se genera si es null).
   * @param {Date} [fechaActualizacion=null] - Fecha de actualización (opcional, se genera si es null).
   */
  constructor(nombre, telefono, direccion, estado = true, fechaCreacion = null, fechaActualizacion = null) {
    // Llama al constructor de BasePersona pasando todos los parámetros necesarios.
    // El parámetro cli_telefonosExistentes se eliminó, la validación va en el servicio.
    // Se cambió el primer parámetro de 'cliente' a 'nombre' para mayor claridad y consistencia con BasePersona.
    super(nombre, telefono, direccion, estado, fechaCreacion, fechaActualizacion);

    // Aquí podrías añadir propiedades específicas del Cliente si las hubiera en el futuro.
    // Por ejemplo: this.tipoCliente = tipo;
  }
}

export { Cliente };