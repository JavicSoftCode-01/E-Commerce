import { BasePersona } from './BasePersona.js';

/**
 * 🔰 Clase que representa un cliente.
 * Hereda de BasePersona. 🔰
 */
class Cliente extends BasePersona {
  /**
   * Crea una instancia de Cliente.
   * @param {string} nombre - Nombre del cliente.
   * @param {string} telefono - Teléfono del cliente.
   * @param {string} direccion - Dirección del cliente.
   * @param {boolean} [estado=true] - Estado del cliente (activo/inactivo).
   * @param {Date} [fechaCreacion=null] - Fecha de creación (opcional, se genera si es null).
   * @param {Date} [fechaActualizacion=null] - Fecha de actualización (opcional, se genera si es null).
   * @param {number} [contador=0] - Contador de compras realizadas por el cliente.
   */
  constructor(nombre, telefono, direccion, estado = true, fechaCreacion = null, fechaActualizacion = null, contador = 0) {
    super(nombre, telefono, direccion, estado, fechaCreacion, fechaActualizacion);
    this.contador = contador; // Inicializa el contador de compras
  }

  /**
   * Incrementa el contador de compras.
   */
  incrementarContador() {
    this.contador += 1;
    this.prepareForUpdate(); // Actualiza la fecha de actualización
  }
}

export { Cliente };