// BackEnd/src/utils/validar.js

/**
 * 🔰🔰 La clase Validar agrupa métodos estáticos y asíncronos para validar y formatear datos (nombres, teléfonos, direcciones, precios, stock y descripciones), asegurando que cumplen con formatos predefinidos. 🔰🔰
 */
class Validar {


  /**
   🔰 Este método es estático y asíncrono, encargado de capturar y gestionar errores durante la validación del nombre, retornando null en caso de fallo.🔰.
   */
  static async nombreBM(nombre, service, id = null) {
    // Validación básica: Verificar que nombre es una cadena no vacía
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      console.error('El nombre no puede estar vacío.');
      return null;
    }

    // Eliminar espacios al inicio y al final
    const nombreFormateado = nombre.trim();

    // Validación de longitud
    if (nombreFormateado.length < 3 || nombreFormateado.length > 50) {
      console.error('El nombre debe tener entre 3 y 50 caracteres.');
      return null;
    }

    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9](?:[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s,.:()#]*[A-Za-zÁÉÍÓÚáéíóúÑñ0-9,.:()#])?$/;
    if (!regex.test(nombreFormateado)) {
      console.error('El nombre no es válido. Solo se permiten letras (incluyendo acentos y la Ñ), números, espacios, comas, puntos, dos puntos, paréntesis y numeral, sin espacios, comas o puntos al inicio.');
      return null;
    }

    try {
      // Obtener los ítems según el tipo de servicio, utilizando un switch para mayor claridad
      let items = [];
      switch (service.storeName) {
        case 'categorias':
          items = await service.obtenerTodasLasCategorias();
          break;
        case 'marcas':
          items = await service.obtenerTodasLasMarcas();
          break;
        case 'productos':
          items = await service.obtenerProductos();
          break;
        default:
          console.error('Servicio no reconocido en validación de nombre.');
          return null;
      }

      // Verificar si ya existe un registro con el mismo nombre (ignorando mayúsculas/minúsculas)
      const existe = items.some(item =>
        item.nombre.toLowerCase() === nombreFormateado.toLowerCase() && item.id !== id
      );
      if (existe) {
        console.error(`Ya existe un registro con el nombre: ${nombreFormateado}.`);
        return null;
      }

      console.info(`Nombre "${nombreFormateado}" validado correctamente.`);
      return nombreFormateado;
    } catch (error) {
      console.error("Error al validar el nombre:", error);
      return null;
    }
  }


  /**
   * 🔰Este método estático se encarga de validar y formatear el nombre para proveedores o clientes, comprobando que no esté vacío, que tenga entre 3 y 70 caracteres y que cumpla con el formato permitido de letras, números, espacios y ciertos caracteres especiales.🔰
   */
  static nombreBP(nombre) {
    if (!nombre || nombre.trim() === '') {
      console.error('El nombre no puede estar vacío.');
      return null;
    }
    const nombreFormateado = nombre.trim();
    if (nombreFormateado.length < 3 || nombreFormateado.length > 70) {
      console.error('El nombre debe tener entre 3 y 70 caracteres.');
      return null;
    }
    // Permite letras (incluyendo tildes y la ñ), números, espacios, comas, puntos, guiones y apóstrofes.
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9][A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s.,'-]*[A-Za-zÁÉÍÓÚáéíóúÑñ0-9.]$/;
    if (!regex.test(nombreFormateado)) {
      console.error('El nombre para Proveedor o Cliente no es válido. Solo se permiten letras (incluyendo tildes y la ñ), números, espacios, comas, puntos, guiones y apóstrofes.');
      return null;
    }

    console.info(`Nombre "${nombreFormateado}" validado.`);
    return nombreFormateado;
  }


  /**
   * 🔰 Este método es estático y asíncrono, y se encarga de validar y formatear un número de teléfono considerando distintos formatos internacionales y locales, además de verificar duplicados en la base de datos.🔰
   */
  static async telefonoBP(telefono, service, id = null) {
    if (!telefono || telefono.trim() === '') {
      console.error("Error: El número de teléfono no puede estar vacío.");
      return false;
    }
    let telefonoLimpio = telefono.trim().replace(/[^0-9+]/g, ''); // Elimina caracteres no numéricos excepto '+'
    let formatoFinal = '';

    if (telefonoLimpio.startsWith('+593')) { // Formato Internacional
      telefonoLimpio = telefonoLimpio.slice(4); // Elimina '+593' al inicio
      if (telefonoLimpio.length === 9 && telefonoLimpio.startsWith('9')) {
        // Celular internacional: agrupar 2-3-4 dígitos
        formatoFinal = `+593 ${telefonoLimpio.substring(0, 2)} ${telefonoLimpio.substring(2, 5)} ${telefonoLimpio.substring(5, 9)}`;
      } else if (telefonoLimpio.length === 9 && !telefonoLimpio.startsWith('9')) {
        // Convencional internacional de 9 dígitos
        const codigoProvincia = telefonoLimpio.substring(0, 1);
        if (['2', '3', '4', '5', '6', '7'].includes(codigoProvincia)) {
          formatoFinal = `(0${codigoProvincia}) ${telefonoLimpio.substring(1, 3)} - ${telefonoLimpio.substring(3, 5)} - ${telefonoLimpio.substring(5, 9)}`;
        } else {
          console.error("Error: Formato de número convencional incorrecto.");
          return false;
        }
      } else if (telefonoLimpio.length === 8 && !telefonoLimpio.startsWith('9')) {
        // Convencional internacional de 8 dígitos
        let codigoProvincia = telefonoLimpio.substring(0, 1);
        formatoFinal = `(0${codigoProvincia})${telefonoLimpio.substring(1, 2)}-${telefonoLimpio.substring(2, 4)}-${telefonoLimpio.substring(4, 8)}`;
      } else {
        console.error("Error: Formato de número internacional incorrecto.");
        return false;
      }
    } else if (telefonoLimpio.startsWith('09')) { // Formato celular local (con 09)
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
      if (telefonoLimpio.length === 8) { // Convencional de 8 dígitos
        formatoFinal = `(0${codigoProvincia}) ${telefonoLimpio.substring(2, 3)} - ${telefonoLimpio.substring(3, 5)} - ${telefonoLimpio.substring(5)}`;
      } else if (telefonoLimpio.length === 9) { // Convencional de 9 dígitos
        formatoFinal = `(0${codigoProvincia}) ${telefonoLimpio.substring(2, 4)} - ${telefonoLimpio.substring(4, 6)} - ${telefonoLimpio.substring(6)}`;
      } else if (telefonoLimpio.length === 7) { // Formato local
        formatoFinal = `(${telefonoLimpio.substring(0, 1)})${telefonoLimpio.substring(1, 3)}-${telefonoLimpio.substring(3, 5)}-${telefonoLimpio.substring(5, 7)}`;
      } else {
        console.error("Error: El número convencional tiene que tener un formato correcto (ej: (02) xx-xx-xx o (02) xxx-xxxx ).");
        return false;
      }
    } else if (telefonoLimpio.length >= 7 && telefonoLimpio.length <= 10) {
      // Podría ser un celular sin '09' o convencional
      if (/^09\d{8}$/.test(telefonoLimpio)) { // Es celular sin '09'
        formatoFinal = '+593 ' + telefonoLimpio.substring(0, 1) + " " + telefonoLimpio.substring(1, 5) + " " + telefonoLimpio.substring(5, 9);
      } else { // Verificar convencional sin 0
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
    } else { // Si no inicia por nada conocido.
      console.error("Error, formato desconocido");
      return false;
    }

    if (!formatoFinal) {
      return false;
    }

    // Verificar duplicados *excluyendo* el elemento actual que se está editando (si lo hay)
    // try {
    //   const allItems = await service.getAll();
    //   const isDuplicate = allItems.some(item => item.telefono === formatoFinal && item.id !== id);
    //   if (isDuplicate) {
    //     console.error("Error: El número de teléfono ya está registrado.");
    //     return false;
    //   }
    // } catch (error) {
    //   console.error(`Error al validar teléfono ${telefono}:`, error);
    //   return false; // Falso en caso de error de DB.
    // }

    console.info(`Teléfono validado y formateado: ${formatoFinal}`);
    return formatoFinal;
  }

  static async telefonoBPT(telefono, service, id = null) {
    if (!telefono || telefono.trim() === '') {
      console.error("Error: El número de teléfono no puede estar vacío.");
      return false;
    }
    let telefonoLimpio = telefono.trim().replace(/[^0-9+]/g, ''); // Elimina caracteres no numéricos excepto '+'
    let formatoFinal = '';

    if (telefonoLimpio.startsWith('+593')) { // Formato Internacional
      telefonoLimpio = telefonoLimpio.slice(4); // Elimina '+593' al inicio
      if (telefonoLimpio.length === 9 && telefonoLimpio.startsWith('9')) {
        // Celular internacional: agrupar 2-3-4 dígitos
        formatoFinal = `+593 ${telefonoLimpio.substring(0, 2)} ${telefonoLimpio.substring(2, 5)} ${telefonoLimpio.substring(5, 9)}`;
      } else if (telefonoLimpio.length === 9 && !telefonoLimpio.startsWith('9')) {
        // Convencional internacional de 9 dígitos
        const codigoProvincia = telefonoLimpio.substring(0, 1);
        if (['2', '3', '4', '5', '6', '7'].includes(codigoProvincia)) {
          formatoFinal = `(0${codigoProvincia}) ${telefonoLimpio.substring(1, 3)} - ${telefonoLimpio.substring(3, 5)} - ${telefonoLimpio.substring(5, 9)}`;
        } else {
          console.error("Error: Formato de número convencional incorrecto.");
          return false;
        }
      } else if (telefonoLimpio.length === 8 && !telefonoLimpio.startsWith('9')) {
        // Convencional internacional de 8 dígitos
        let codigoProvincia = telefonoLimpio.substring(0, 1);
        formatoFinal = `(0${codigoProvincia})${telefonoLimpio.substring(1, 2)}-${telefonoLimpio.substring(2, 4)}-${telefonoLimpio.substring(4, 8)}`;
      } else {
        console.error("Error: Formato de número internacional incorrecto.");
        return false;
      }
    } else if (telefonoLimpio.startsWith('09')) { // Formato celular local (con 09)
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
      if (telefonoLimpio.length === 8) { // Convencional de 8 dígitos
        formatoFinal = `(0${codigoProvincia}) ${telefonoLimpio.substring(2, 3)} - ${telefonoLimpio.substring(3, 5)} - ${telefonoLimpio.substring(5)}`;
      } else if (telefonoLimpio.length === 9) { // Convencional de 9 dígitos
        formatoFinal = `(0${codigoProvincia}) ${telefonoLimpio.substring(2, 4)} - ${telefonoLimpio.substring(4, 6)} - ${telefonoLimpio.substring(6)}`;
      } else if (telefonoLimpio.length === 7) { // Formato local
        formatoFinal = `(${telefonoLimpio.substring(0, 1)})${telefonoLimpio.substring(1, 3)}-${telefonoLimpio.substring(3, 5)}-${telefonoLimpio.substring(5, 7)}`;
      } else {
        console.error("Error: El número convencional tiene que tener un formato correcto (ej: (02) xx-xx-xx o (02) xxx-xxxx ).");
        return false;
      }
    } else if (telefonoLimpio.length >= 7 && telefonoLimpio.length <= 10) {
      // Podría ser un celular sin '09' o convencional
      if (/^09\d{8}$/.test(telefonoLimpio)) { // Es celular sin '09'
        formatoFinal = '+593 ' + telefonoLimpio.substring(0, 1) + " " + telefonoLimpio.substring(1, 5) + " " + telefonoLimpio.substring(5, 9);
      } else { // Verificar convencional sin 0
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
    } else { // Si no inicia por nada conocido.
      console.error("Error, formato desconocido");
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
   * 🔰 Método estático que valida una dirección. Recibe una cadena, elimina espacios innecesarios, verifica la longitud y el formato permitido mediante expresión regular, retornando la dirección validada o null en caso de fallo.🔰.
   */
  static direccionBP(direccion) {
    if (!direccion || direccion.trim() === '') {
      console.error('La dirección no puede estar vacía.');
      return null;
    }
    const direccionFormateada = direccion.trim();

    if (direccionFormateada.length < 3 || direccionFormateada.length > 256) {
      console.error('La dirección debe tener entre 3 y 256 caracteres.');
      return null;
    }
    // Permite letras (incluyendo acentuadas y Ñ/ñ), números, espacios, #, -, , , ., : y paréntesis.
    // Debe iniciar y terminar con letra o número.
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9][A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s#,.:\-()]*[A-Za-zÁÉÍÓÚáéíóúÑñ0-9]$/;

    if (!regex.test(direccionFormateada)) {
      console.error('Dirección no válida. Solo se permiten letras (incluyendo acentos y Ñ), números, espacios, #, -, , , ., : y paréntesis. Debe iniciar y terminar con letra o número.');
      return null;
    }

    console.info(`Dirección "${direccionFormateada}" validada.`);
    return direccionFormateada;
  }


  /**
   * 🔰 Método estático que valida y formatea un valor numérico o cadena a precio con dos decimales; devuelve false en caso de error. 🔰
   */
  static precio(valor) {
    let valorNumerico;

    // Si es string, limpiamos y convertimos
    if (typeof valor === 'string') {
      // Eliminar caracteres no permitidos excepto números, punto y coma
      valorNumerico = valor.trim().replace(/[^0-9.,]/g, '');
      // Reemplazar coma por punto para consistencia
      valorNumerico = valorNumerico.replace(',', '.');
      // Convertir a número usando parseFloat para mejor precisión
      valorNumerico = parseFloat(valorNumerico);
    } else if (typeof valor === 'number') {
      valorNumerico = parseFloat(valor);
    } else {
      console.error("Error: El precio debe ser un número o una cadena.");
      return false;
    }

    // Validar que sea un número válido
    if (isNaN(valorNumerico)) {
      console.error("Error: Formato numérico no válido");
      return false;
    }

    // Validar que no sea negativo
    if (valorNumerico < 0) {
      console.error("Error: El precio no puede ser negativo.");
      return false;
    }

    // Usar una técnica más precisa para el redondeo a 2 decimales
    const precioFormateado = Math.round((valorNumerico + Number.EPSILON) * 100) / 100;

    console.info(`Precio validado: ${precioFormateado}`);
    return precioFormateado;
  }


  /**
   * 🔰Método static que valida la cantidad de stock. Verifica que el valor ingresado sea un número entero positivo mayor a 0 y lo retorna; de lo contrario, devuelve null.🔰
   */
  static cantidadStock(valor) {
    let valorNumerico;

    // Si es una cadena, convertir a número
    if (typeof valor === 'string') {
      valorNumerico = parseInt(valor.trim(), 10);
      if (isNaN(valorNumerico)) {
        console.error("Error: La cantidad debe ser un número válido");
        return null;
      }
    } else if (typeof valor === 'number') {
      valorNumerico = valor;
    } else {
      console.error("Error: Tipo de dato inválido para cantidad");
      return null;
    }

    // La cantidad debe ser un número entero
    if (!Number.isInteger(valorNumerico)) {
      console.error("Error: La cantidad debe ser un número entero");
      return null;
    }

    // Solo se permiten cantidades positivas (mayores a 0)
    if (valorNumerico <= 0) {
      console.error("Error: La cantidad debe ser un número positivo mayor a 0");
      return null;
    }

    return valorNumerico;
  }


  /**
   * 🔰 Método estático que valida y formatea una descripción, comprobando que la entrada es una cadena no vacía, que su longitud está entre 3 y 256 caracteres, y que solo contiene los caracteres permitidos.🔰
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
    // Permite letras (incluyendo tildes, acentos, Ñ, Ü), números, espacios, puntos, comas, dos puntos, paréntesis y numeral.
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s.,:()#]+$/;
    if (!regex.test(trimmedDescripcion)) {
      console.error("Error: La descripción contiene caracteres no permitidos.");
      return false;
    }
    console.info(`Descripción validada: ${trimmedDescripcion}`);
    return trimmedDescripcion;
  }
}

export {Validar};