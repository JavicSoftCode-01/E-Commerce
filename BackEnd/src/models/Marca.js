// BackEnd/src/models/Marca.js
import { BaseModel } from './BaseModel.js';

/**
 * 🔰 Clase que representa una marca de productos.
 * Hereda de BaseModel. 🔰
 */
class Marca extends BaseModel {

  /**
   * Crea una instancia de Marca.
   * @param {string} nombre - Nombre de la marca.
   * @param {boolean} [estado=true] - Estado de la marca (activo/inactivo).
   * @param {Date} [fechaCreacion=null] - Fecha de creación (opcional, se genera si es null).
   * @param {Date} [fechaActualizacion=null] - Fecha de actualización (opcional, se genera si es null).
   */
  constructor(nombre, estado = true, fechaCreacion = null, fechaActualizacion = null) {
    // Llama al constructor de BaseModel pasando todos los parámetros necesarios.
    // El parámetro mar_nombresExistentes se eliminó, la validación debe hacerse en el servicio.
    super(nombre, estado, fechaCreacion, fechaActualizacion);
     // No hay propiedades adicionales específicas para Marca en este momento.
  }
}

export { Marca };