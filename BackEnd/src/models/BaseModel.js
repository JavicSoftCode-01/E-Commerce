// BackEnd/src/models/BaseModel.js

/**
 * Clase BaseModel que servirá para categoría, marca y producto.
 * Define los campos comunes (id y nombre)
 * y añade campos de seguimiento y estado.
 */
class BaseModel {

  /**
   * Crea una instancia de BaseModel.
   * @param {string} nombre - Nombre de la categoría, marca o producto.
   * @param {boolean} [estado=true] - Indica si el item está activo (true) o inactivo (false). Por defecto es true.
   * @param {Date} [fechaCreacion=null] - Fecha de creación. Si no se proporciona, se usa la fecha actual.
   * @param {Date} [fechaActualizacion=null] - Fecha de última actualización. Si no se proporciona, se usa la fecha actual.
   */
  constructor(nombre, estado = true, fechaCreacion = null, fechaActualizacion = null) {
    this.nombre = nombre;
    this.fechaCreacion = fechaCreacion instanceof Date ? fechaCreacion : new Date();
    this.fechaActualizacion = fechaActualizacion instanceof Date ? fechaActualizacion : this.fechaCreacion;
    this.estado = estado;
  }

  /**
   * Método (opcional) para preparar el objeto antes de guardarlo,
   * asegurando que la fecha de actualización se establezca.
   * Este método debería llamarse desde los servicios ANTES de actualizar en la BD.
   */
  prepareForUpdate() {
    this.fechaActualizacion = new Date();
  }

  /**
   * NUEVO MÉTODO: Genera el HTML para un icono visual que representa el estado (activo/inactivo).
   * Utiliza Font Awesome para los iconos.
   * @returns {string} Una cadena HTML con el icono <i class="..."></i> apropiado.
   */
  iconTrueFalse() {
    if (this.estado === true) {
      // Estado Activo: Círculo verde con check blanco
      return '<i class="fa-solid fa-circle-check fa-lg" style="color: #28a745;" title="Activo"></i>'; // Usando un verde estándar de Bootstrap success
    } else {
      // Estado Inactivo: Círculo rojo con X blanca
      return '<i class="fa-solid fa-circle-xmark fa-lg" style="color: #dc3545;" title="Inactivo"></i>'; // Usando un rojo estándar de Bootstrap danger
    }
  }

  /**
 * Formatea un valor de fecha/hora al formato local de Ecuador (Guayaquil, UTC-5).
 * Muestra fecha (DD/MM/AAAA) y hora (HH:MM AM/PM).
 * @param {Date | string | number} dateValue - El valor de fecha a formatear (puede ser objeto Date, string ISO, o timestamp).
 * @returns {string} La fecha y hora formateadas como string, o un placeholder si la fecha es inválida/nula.
 */
  formatEcuadorDateTime(dateValue) {
    // Si no hay valor, retorna un placeholder
    if (!dateValue) {
      return 'N/A';
    }

    try {
      // Convierte a objeto Date (maneja strings ISO o timestamps)
      const dateObject = new Date(dateValue);

      // Verifica si la conversión resultó en una fecha válida
      if (isNaN(dateObject.getTime())) {
        return 'Fecha inválida';
      }

      // Opciones para el formateador Intl.DateTimeFormat
      const options = {
        timeZone: 'America/Guayaquil', // Zona horaria principal de Ecuador Continental (UTC-5)
        year: 'numeric',    // Ejemplo: 2024
        month: '2-digit',   // Ejemplo: 03 (para Marzo)
        day: '2-digit',     // Ejemplo: 29
        hour: '2-digit',    // Ejemplo: 06 (para 6 PM si hour12 es true)
        minute: '2-digit',  // Ejemplo: 52
        // second: '2-digit', // Descomenta si necesitas los segundos
        hour12: true        // Usar formato AM/PM (true) o 24 horas (false)
      };

      // Crea el formateador y formatea la fecha
      const formatter = new Intl.DateTimeFormat('es-EC', options); // 'es-EC' para formato Español Ecuador
      return formatter.format(dateObject);

    } catch (error) {
      console.error("Error formateando fecha:", dateValue, error);
      return 'Error formato'; // Placeholder en caso de error inesperado
    }
  }
}

export { BaseModel };