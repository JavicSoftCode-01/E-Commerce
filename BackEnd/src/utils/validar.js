// BackEnd/src/utils/validar.js
/**
 *  🔰🔰Clase con métodos de validación.  Todos los métodos son estáticos.🔰🔰
 */
export class Validar {

  /**
   * Valida un nombre (para categoría, marca o producto).
   * @param {string} nombre - El nombre a validar.
   * @param {IndexedDB} service - Instancia de IndexedDB (categoria, marca o producto).
   * @param {number|null} [id=null] - ID del registro actual si se está editando.
   * @returns {string|false} Nombre formateado si es válido, false si no.
   */
  static async nombreBM(nombre, service, id = null) {
    if (!nombre || typeof nombre !== 'string') {
      console.error("Error: El nombre no puede estar vacío o ser falso.");
      return false;
    }
    const formattedName = nombre.trim(); // Elimina espacios al inicio y final.
    if (/\d/.test(formattedName)) {
      console.error("Error: El nombre no debe contener caracteres numéricos.");
      return false;
    }
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(formattedName)) {
      console.error("Error: El nombre solo debe contener letras y espacios.");
      return false;
    }
    if (formattedName.length < 3 || formattedName.length > 100) {
      console.error(`Error: El nombre debe tener entre 3 y 100 caracteres.  Actual: ${formattedName.length}`);
      return false;
    }
    try {
      const allItems = await service.getAll();
      // Comprueba si *otro* elemento (con diferente ID) tiene el mismo nombre.
      const existe = allItems.some(item => item.nombre?.trim().toLowerCase() === formattedName.toLowerCase() && item.id !== id);
      if (existe) {
        console.error(`Error: Ya existe un registro con el nombre: ${nombre}`);
        return false;
      }
    } catch (error) {
      console.error(`Error al validar nombre para ${nombre}:`, error);
      return false; // Falso en caso de error de DB.
    }
    console.info(`Nombre validado correctamente: ${formattedName}`);
    return formattedName;
  }


  /**
   * Valida y formatea un número de teléfono (para cliente o proveedor).
   * @param {string} telefono - El número de teléfono a validar.
   * @param {IndexedDB} service - Instancia de IndexedDB (cliente o proveedor).
   * @param {number|null} [id=null] - ID del registro si se está editando.
   * @returns {string|false} Teléfono formateado si es válido, false si no.
   */
  static async telefonoBP(telefono, service, id = null) {
    if (!telefono || telefono.trim() === '') {
      console.error("Error: El número de teléfono no puede estar vacío.");
      return false;
    }
    let telefonoLimpio = telefono.trim().replace(/[^0-9+]/g, ''); // Elimina caracteres no numéricos excepto '+'
    // Detectar si es un número de celular o convencional
    let formatoFinal = '';
    if (telefonoLimpio.startsWith('+593')) { //Formato Internacional
      telefonoLimpio = telefonoLimpio.slice(4); // Elimina '+593' al inicio
      if (telefonoLimpio.length === 9 && telefonoLimpio.startsWith('9')) {
        //Celular
        formatoFinal = `+593 ${telefonoLimpio.substring(0, 1)} ${telefonoLimpio.substring(1, 5)} ${telefonoLimpio.substring(5, 9)}`;
      } else if (telefonoLimpio.length === 9 && !telefonoLimpio.startsWith('9')) {
        //Convencional
        const codigoProvincia = telefonoLimpio.substring(0, 1);
        if (['2', '3', '4', '5', '6', '7'].includes(codigoProvincia)) {
          formatoFinal = `(0${codigoProvincia}) ${telefonoLimpio.substring(1, 3)} - ${telefonoLimpio.substring(3, 5)} - ${telefonoLimpio.substring(5, 9)}`;
        } else {
          console.error("Error: Formato de número convencional incorrecto.");
          return false;
        }
      } else if (telefonoLimpio.length === 8 && !telefonoLimpio.startsWith('9')) {
        //Convencional de 8 dígitos
        let codigoProvincia = telefonoLimpio.substring(0, 1);
        formatoFinal = `(0${codigoProvincia})${telefonoLimpio.substring(1, 2)}-${telefonoLimpio.substring(2, 4)}-${telefonoLimpio.substring(4, 8)}`;
      } else {
        console.error("Error: Formato de número internacional incorrecto.");
        return false;
      }
    } else if (telefonoLimpio.startsWith('09')) {//Formato celular
      if (telefonoLimpio.length !== 10) {
        console.error("Error: El número de celular debe tener 10 dígitos (incluyendo el 0 inicial).");
        return false;
      }
      formatoFinal = `+593 ${telefonoLimpio.substring(1, 3)} ${telefonoLimpio.substring(3, 6)} ${telefonoLimpio.substring(6)}`;
    } else if (telefonoLimpio.startsWith('0')) {  // Formato convencional con 0 inicial
      const codigoProvincia = telefonoLimpio.substring(1, 2);
      if (!['2', '3', '4', '5', '6', '7'].includes(codigoProvincia)) {
        console.error("Error: Código de provincia inválido.");
        return false;
      }
      if (telefonoLimpio.length === 8) { //Valida si es de 8
        formatoFinal = `(0${codigoProvincia}) ${telefonoLimpio.substring(2, 3)} - ${telefonoLimpio.substring(3, 5)} - ${telefonoLimpio.substring(5)}`;
      } else if (telefonoLimpio.length === 9) {// Formato convencional, asume 9 dígitos.
        formatoFinal = `(0${codigoProvincia}) ${telefonoLimpio.substring(2, 4)} - ${telefonoLimpio.substring(4, 6)} - ${telefonoLimpio.substring(6)}`;
      } else if (telefonoLimpio.length === 7) {//formato local
        formatoFinal = `(${telefonoLimpio.substring(0, 1)})${telefonoLimpio.substring(1, 3)}-${telefonoLimpio.substring(3, 5)}-${telefonoLimpio.substring(5, 7)}`;
      } else {
        console.error("Error: El número convencional tiene que tener un formato correcto (ej: (02) xx-xx-xx o (02) xxx-xxxx ).");
        return false;
      }
    } else if (telefonoLimpio.length >= 7 && telefonoLimpio.length <= 10) {
      //Podria ser un celular sin 09 o convencional
      if (telefonoLimpio.startsWith('9'))//Es celular sin 09
      {
        formatoFinal = '+593 ' + telefonoLimpio.substring(0, 1) + " " + telefonoLimpio.substring(1, 5) + " " + telefonoLimpio.substring(5, 9)
      } else { //Verificar convencional sin 0
        const posiblesCodigos = ['2', '3', '4', '5', '6', '7'];
        let codigoEncontrado = false;
        for (const cod of posiblesCodigos) {
          if (telefonoLimpio.startsWith(cod)) {
            if (telefonoLimpio.length === 8) {
              formatoFinal = `(0${cod}) ${telefonoLimpio.substring(1, 2)} - ${telefonoLimpio.substring(2, 4)} - ${telefonoLimpio.substring(4, 8)}`;
              codigoEncontrado = true;
              break;
            } else if (telefonoLimpio.length === 7) {
              formatoFinal = `(0${cod}) ${telefonoLimpio.substring(1, 3)} - ${telefonoLimpio.substring(3, 5)} - ${telefonoLimpio.substring(5)}`;
              codigoEncontrado = true;
            } else if (telefonoLimpio.length === 6) {
              formatoFinal = `(0${cod}) ${telefonoLimpio.substring(1, 2)} - ${telefonoLimpio.substring(2, 4)} - ${telefonoLimpio.substring(4)}`;
              codigoEncontrado = true;
            }
            break;
          }
        }
      }
    } else { //Si no inicia por nada conocido.
      console.error("Error, formato desconocido")
      return false;
    }
    if (!formatoFinal) {
      return false;
    }
    // Verificar duplicados *excluyendo* el elemento actual que se está editando (si lo hay)
    try {
      const allItems = await service.getAll();
      const isDuplicate = allItems.some(item => item.telefono === formatoFinal && item.id !== id);
      if (isDuplicate) {
        console.error("Error: El número de teléfono ya está registrado.");
        return false;
      }
    } catch (error) {
      console.error(`Error al validar teléfono ${telefono}:`, error);
      return false; // Falso en caso de error de DB.
    }
    console.info(`Teléfono validado y formateado: ${formatoFinal}`);
    return formatoFinal;
  }

  /**
   * Valida una dirección (para cliente o proveedor).
   * @param {string} direccion - La dirección a validar.
   * @returns {string|false} Dirección formateada si es válida, false si no.
   */
  static direccionBP(direccion) {
    const trimmed = direccion.trim(); // Elimina espacios al inicio y final
    // Valida longitud mínima y máxima
    if (trimmed.length < 3 || trimmed.length > 256) {
      console.error("La dirección debe tener entre 3 y 256 caracteres.");
      return false;
    }
    // Verifica si la dirección contiene al menos una letra o número
    if (!/[a-zA-Z0-9]/.test(trimmed)) {
      console.error("La dirección debe contener al menos una letra o número.");
      return false;
    }
    console.info(`Dirección validada: ${trimmed}`);
    return trimmed;
  }

  /**
   * Valida el nombre de un cliente o proveedor.
   * @param {string} nombre - El nombre del cliente/proveedor.
   * @param {boolean} [esEmpresa=false] - Indica si el nombre es de una empresa.
   * @returns {string|false} Nombre validado o false si no es válido.
   */
  static nombreBP(nombre, esEmpresa = false) {
    if (!nombre || typeof nombre !== 'string') {
      console.error("Error: El nombre no puede estar vacío.");
      return false;
    }
    const trimmedName = nombre.trim();
    if (trimmedName.length < 3 || trimmedName.length > 100) {
      console.error("Error: El nombre debe tener entre 3 y 100 caracteres.");
      return false;
    }
    if (esEmpresa) {
      // Permitir letras, espacios, puntos y "S.A."
      if (!/^[a-zA-ZÀ-ÿ\s.]+$/.test(trimmedName)) {
        console.error("Error: El nombre de la empresa solo debe contener letras, espacios y puntos.");
        return false;
      }
      if (!trimmedName.toUpperCase().includes("S.A.")) {
        console.warn("Advertencia: Nombre de la empresa deberia Finalizar con 'S.A.'");
      }
    } else {
      // Solo letras, espacios y acentos (para nombres y apellidos)
      if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(trimmedName)) {
        console.error("Error: El nombre solo debe contener letras y espacios.");
        return false;
      }
    }
    console.info(`Nombre validado: ${trimmedName}`);
    return trimmedName;
  }

  /**
   * Valida y formatea un precio o precio de venta (PVP).
   * @param {string|number} valor - El precio o PVP como string o número.
   * @returns {number|false} Precio formateado a 2 decimales o false si no es válido.
   */
  static precio(valor) {
    let valorNumerico;
    if (typeof valor === 'string') {
      valorNumerico = valor.trim().replace(/[^0-9.,]/g, ''); // Elimina caracteres no permitidos
      // Reemplaza coma por punto para consistencia
      valorNumerico = valorNumerico.replace(',', '.');
      // Intenta convertir a número
      valorNumerico = Number(valorNumerico);
      if (isNaN(valorNumerico)) {
        console.error("Error, Formato numerico no valido, debe llevar (.) o (,) y no tener letras");
        return false
      }
    } else if (typeof valor === 'number') {
      valorNumerico = valor;
    } else {
      console.error("Error: El precio debe ser un número o una cadena.");
      return false;
    }
    //Evitar valor negativo
    if (valorNumerico < 0) {
      console.error("Error: El precio no puede ser negativo.");
      return false;
    }
    // Formatea a dos decimales *después* de todas las validaciones.
    const precioFormateado = parseFloat(valorNumerico.toFixed(2));
    console.info(`Precio validado: ${precioFormateado}`);
    return precioFormateado;
  }

  /**
   * Valida una cantidad o stock.
   * @param {string|number} valor - La cantidad/stock como string o número.
   * @returns {number|false} Cantidad validada como entero o false si no es válida.
   */
  static cantidadStock(valor) {
    let valorNumerico;
    if (typeof valor === 'string') {
      valorNumerico = valor.trim();//Eliminar Espacios
      if (/[^0-9]/.test(valorNumerico)) { //Si contiene valor no numerico
        console.error("Error: La cantidad/stock debe ser un número entero.");
        return false;
      }
      valorNumerico = Number(valorNumerico);
      //Verificar si es entero
      if (!Number.isInteger(valorNumerico)) {
        console.error("Error, Formato invalido, debe ser un entero");
        return false
      }
    } else if (typeof valor === 'number') {
      valorNumerico = valor;
      if (!Number.isInteger(valorNumerico)) {
        console.error("Error, Debe ser entero, no se admite decimales");
        return false;
      }
    } else {
      console.error("Error: La cantidad/stock debe ser un número o una cadena.");
      return false;
    }
    //Verifica si es negativo
    if (valorNumerico < 0) {
      console.error("Error: La cantidad/stock no puede ser negativo.");
      return false;
    }
    console.info(`Cantidad/stock validado: ${valorNumerico}`);
    return valorNumerico;
  }

  /**
   * Valida una descripción.
   * @param {string} descripcion - La descripción a validar.
   * @returns {string|false} Descripción validada o false si no es válida.
   */
  static descripcion(descripcion) {
    if (!descripcion || typeof descripcion !== 'string') {
      console.error("Error: La descripción no puede estar vacía.");
      return false;
    }
    const trimmedDescripcion = descripcion.trim();
    if (trimmedDescripcion.length < 3 || trimmedDescripcion.length > 256) {
      console.error("Error: La descripción debe tener entre 3 y 256 caracteres.");
      return false;
    }
    console.info(`Descripción validada: ${trimmedDescripcion}`);
    return trimmedDescripcion;
  }
}