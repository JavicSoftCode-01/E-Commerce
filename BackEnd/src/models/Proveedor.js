// BackEnd/src/models/Proveedor.js
import { BasePersona } from './BasePersona.js';

/**
 *  🔰 Clase Proveedor que gestiona entidades de proveedores.
 *  Hereda de BasePersona. 🔰
 */
class Proveedor extends BasePersona {

  /**
   * Crea una instancia de Proveedor.
   * @param {string} nombre - Nombre del proveedor.
   * @param {string} telefono - Teléfono del proveedor.
   * @param {string} direccion - Dirección del proveedor.
   * @param {boolean} [estado=true] - Estado del proveedor (activo/inactivo).
   * @param {Date} [fechaCreacion=null] - Fecha de creación (opcional, se genera si es null).
   * @param {Date} [fechaActualizacion=null] - Fecha de actualización (opcional, se genera si es null).
   */
  constructor(nombre, telefono, direccion, estado = true, fechaCreacion = null, fechaActualizacion = null) {
    // Llama al constructor de BasePersona pasando todos los parámetros necesarios.
    // El parámetro prov_telefonosExistentes se eliminó, la validación va en el servicio.
    super(nombre, telefono, direccion, estado, fechaCreacion, fechaActualizacion);

    // Aquí podrías añadir propiedades específicas del Proveedor si las hubiera en el futuro.
    // Por ejemplo: this.ruc = ruc; (si añades RUC como parámetro)
  }
}

export { Proveedor };