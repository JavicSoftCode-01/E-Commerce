// BackEnd/src/models/Categoria.js
import { BaseModel } from './BaseModel.js';

/**
 * Clase que representa una categoría de productos.
 * Hereda de BaseModel.
 */
class Categoria extends BaseModel {
  /**
   * Crea una instancia de Categoria.
   * @param {string} nombre - Nombre de la categoría.
   * @param {boolean} [estado=true] - Estado de la categoría (activo/inactivo).
   * @param {Date} [fechaCreacion=null] - Fecha de creación (opcional, se genera si es null).
   * @param {Date} [fechaActualizacion=null] - Fecha de actualización (opcional, se genera si es null).
   */
  constructor(nombre, estado = true, fechaCreacion = null, fechaActualizacion = null) {
    // Llama al constructor de BaseModel pasando todos los parámetros necesarios.
    super(nombre, estado, fechaCreacion, fechaActualizacion);
    // No hay propiedades adicionales específicas para Categoria en este momento.
  }
}

export { Categoria };