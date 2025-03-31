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
   * @param {Date | string | number | null} [fechaCreacionInput=null] - Fecha de creación (puede ser Date, ISO String, timestamp o null). Si es null o inválida, se usa la fecha actual.
   * @param {Date | string | number | null} [fechaActualizacionInput=null] - Fecha de última actualización (puede ser Date, ISO String, timestamp o null). Si es null o inválida, se usa la fecha de creación.
   */
  constructor(nombre, estado = true, fechaCreacionInput = null, fechaActualizacionInput = null) {
    this.nombre = nombre;
    this.estado = estado;

    // --- Procesamiento robusto de fechaCreacion ---
    let creacionDate = null;
    // 1. Si ya es un objeto Date válido, usarlo.
    if (fechaCreacionInput instanceof Date && !isNaN(fechaCreacionInput)) {
        creacionDate = fechaCreacionInput;
    }
    // 2. Si no es Date pero existe, intentar convertirlo (desde ISO string o timestamp)
    else if (fechaCreacionInput) {
        try {
            const parsedDate = new Date(fechaCreacionInput);
            if (!isNaN(parsedDate)) { // Verificar si la conversión fue exitosa
                creacionDate = parsedDate;
            }
        } catch (e) {
            console.warn("Error al parsear fechaCreacionInput, se usará fecha actual:", fechaCreacionInput, e);
        }
    }
    // 3. Si no se pudo obtener una fecha válida de la entrada, usar la fecha/hora actual.
    //    Esto SÓLO debería pasar en la creación inicial si no se pasa nada.
    this.fechaCreacion = creacionDate instanceof Date ? creacionDate : new Date();


    // --- Procesamiento robusto de fechaActualizacion ---
    let actualizacionDate = null;
    // 1. Si ya es un objeto Date válido, usarlo.
    if (fechaActualizacionInput instanceof Date && !isNaN(fechaActualizacionInput)) {
        actualizacionDate = fechaActualizacionInput;
    }
    // 2. Si no es Date pero existe, intentar convertirlo.
    else if (fechaActualizacionInput) {
        try {
            const parsedDate = new Date(fechaActualizacionInput);
            if (!isNaN(parsedDate)) {
                actualizacionDate = parsedDate;
            }
        } catch (e) {
            console.warn("Error al parsear fechaActualizacionInput, se usará fecha de creación:", fechaActualizacionInput, e);
        }
    }
    // 3. Si no se pudo obtener una fecha válida de la entrada, usar la fechaCreacion (ya procesada).
    //    Esto pasa en la creación inicial o si la fecha guardada era inválida.
    this.fechaActualizacion = actualizacionDate instanceof Date ? actualizacionDate : this.fechaCreacion;

    // El método prepareForUpdate() se encargará de poner la fecha actual CUANDO se actualice.
  }

  /**
   * Prepara el objeto para ser guardado tras una actualización.
   * Establece la fechaActualizacion a la fecha y hora EXACTAS de la modificación.
   * Este método DEBE llamarse DESPUÉS de detectar que hubo cambios reales
   * y ANTES de guardar en la base de datos.
   */
  prepareForUpdate() {
    this.fechaActualizacion = new Date(); // Pone la fecha y hora actuales
  }

  // ... (resto de métodos como iconTrueFalse y formatEcuadorDateTime se mantienen igual) ...
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
       // *** Importante: Asegurarse que dateValue sea un objeto Date antes de formatear ***
       // La lógica del constructor ahora debería asegurar esto, pero una doble verificación no hace daño.
      const dateObject = dateValue instanceof Date ? dateValue : new Date(dateValue);

      // Verifica si la conversión resultó en una fecha válida
      if (isNaN(dateObject.getTime())) {
         console.warn("Intentando formatear fecha inválida:", dateValue);
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