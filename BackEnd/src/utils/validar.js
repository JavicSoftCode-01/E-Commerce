// BackEnd/src/utils/validar.js
import {IndexedDB} from '../database/indexdDB.js'; //  importación correcta

/**
 *  🔰🔰Clase con métodos de validación.  Todos los métodos son estáticos.🔰🔰
 */
export class Validar {


  /**
   * Valida un nombre para categorías o marcas o producto, con restricciones avanzadas de formato
   * @param {string} nombre - El nombre a validar.
   * @param {IndexedDB} service  Instancia del servicio (CategoriaService, MarcaService, etc.).
   * @param {number} [id=null] -  ID para excluir en la validación de duplicados (para actualizaciones).
   * @returns {Promise<string|null>} El nombre validado si es válido, o null si no lo es.
   */
  // static async nombreBM(nombre, service, id = null) {
  //   // Validación inicial
  //   if (!nombre || nombre.trim() === '') {
  //     console.error('El nombre no puede estar vacío.');
  //     return null;
  //   }
  //
  //   // Eliminar espacios al inicio y al final
  //   const nombreFormateado = nombre.trim();
  //
  //   // Validación de longitud
  //   if (nombreFormateado.length < 3 || nombreFormateado.length > 50) {
  //     console.error('El nombre debe tener entre 3 y 50 caracteres.');
  //     return null;
  //   }
  //
  //   // Expresion regular mejorada: Solo letras, números, espacios.  Comienza/termina con letra/número.
  //   const regex = /^[a-zA-Z0-9][a-zA-Z0-9\s]*[a-zA-Z0-9]$/; //Ahora permite numeros y letras
  //   if (!regex.test(nombreFormateado)) {
  //     console.error('El nombre no es válido.  Solo letras, números, y espacios. No espacios al inicio/final.');
  //     return null;
  //   }
  //
  //
  //   try {
  //     // Determinar qué método getAll usar según el tipo de servicio
  //     let items = [];
  //     if (service instanceof service.constructor) {
  //
  //       if (service.storeName === 'categorias') {
  //         items = await service.obtenerTodasLasCategorias();
  //       } else if (service.storeName === 'marcas') {
  //         items = await service.obtenerTodasLasMarcas();
  //
  //       } else if (service.storeName === 'productos') { //  <--- Aquí se valida los productos
  //         items = await service.obtenerProductos()
  //
  //       } else {
  //         console.error('Servicio no reconocido en validación de nombre.');
  //         return null; //  importante en caso de un service no esperado.
  //       }
  //     }
  //
  //
  //     // Adaptación para manejar la verificación para edición o creación
  //     const existe = items.some(item => {
  //
  //       // Si estamos actualizando (id !== null), excluimos el item actual
  //       // Si estamos creando un nuevo item (id === null), se verifican todos.
  //       return item.nombre.toLowerCase() === nombreFormateado.toLowerCase() && item.id !== id;
  //     });
  //     if (existe) {
  //       console.error(`Ya existe un registro con el nombre: ${nombreFormateado}.`);
  //       return null;
  //     }
  //     console.info(`Nombre ${nombreFormateado} validado`);
  //     return nombreFormateado;
  //   } catch (error) {
  //     console.error("Error al validar el nombre:", error);
  //     return null; //  retorna null
  //   }
  // }
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

    // Expresión regular:
    // - Permite letras mayúsculas y minúsculas, incluidas acentuadas y la Ñ/ñ
    // - Permite números, espacios, comas (,) y puntos (.)
    // - El primer carácter debe ser letra o número.
    // - El último carácter puede ser letra, número o punto.
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9](?:[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s,\.]*[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\.])?$/;
    if (!regex.test(nombreFormateado)) {
      console.error('El nombre no es válido. Solo se permiten letras (incluyendo acentos y la Ñ), números, espacios, comas y puntos, sin espacios, comas o puntos al inicio.');
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
   * Valida un nombre de Proveedor o Cliente.
   * Permite caracteres alfanuméricos, espacios y algunos caracteres especiales comunes en nombres y
   * con una longuitud de entre 3 y 70 caracteres
   * @param {string} nombre - El nombre a validar.
   * @returns {string|null} El nombre validado si es válido, o null si no lo es.
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
    // Solo letras, números, espacios, y ciertos caracteres especiales.
    const regex = /^[a-zA-Z0-9][a-zA-Z0-9\s.,'-]*[a-zA-Z0-9.]$/;
    if (!regex.test(nombreFormateado)) {
      console.error('El nombre para Proveedor o Cliente no es válido.  Solo letras/números/espacios/.,-\'');
      return null;
    }

    console.info(`Nombre "${nombreFormateado}" validado.`);
    return nombreFormateado;
  }

  /**
   * Valida un número de teléfono, permite diferentes formatos, espacios, guiones, puntos
   * @param {string} telefono - El número de teléfono a validar.
   * @param {IndexedDB} service  Instancia del servicio (ClienteService, etc.)
   * @param {number} [id=null] -  ID para excluir en la validación de duplicados (para actualizaciones).
   * @returns {Promise<string|null>} El número de teléfono validado si es válido, o null si no lo es.  También verifica duplicados en DB.
   */

  // static async telefonoBP(telefono, service, id = null) {
  //   if (!telefono || telefono.trim() === '') {
  //     console.error("Error: El número de teléfono no puede estar vacío.");
  //     return false;
  //   }
  //   // Elimina espacios y caracteres no numéricos (se conserva el '+' si existe)
  //   let telefonoLimpio = telefono.trim().replace(/[^0-9+]/g, '');
  //   let formatoFinal = '';
  //
  //   // Caso 1: Formato Internacional (+593...)
  //   if (telefonoLimpio.startsWith('+593')) {
  //     telefonoLimpio = telefonoLimpio.slice(4); // Se remueve el prefijo +593
  //     // Caso 1.a: Celular internacional (9 dígitos, inicia con 9)
  //     if (/^9\d{8}$/.test(telefonoLimpio)) {
  //       formatoFinal = telefonoLimpio.replace(/^9(\d{4})(\d{4})$/, '+593 9 $1 $2');
  //     }
  //     // Caso 1.b: Convencional internacional con 9 dígitos (sin el 0 inicial)
  //     else if (/^[2-7]\d{8}$/.test(telefonoLimpio)) {
  //       formatoFinal = telefonoLimpio.replace(/^([2-7])(\d{2})(\d{2})(\d{4})$/, '(0$1) $2-$3-$4');
  //     }
  //     // Caso 1.c: Convencional internacional con 8 dígitos (sin el 0)
  //     else if (/^[2-7]\d{7}$/.test(telefonoLimpio)) {
  //       formatoFinal = telefonoLimpio.replace(/^([2-7])(\d{1})(\d{2})(\d{4})$/, '(0$1) $2-$3-$4');
  //     } else {
  //       console.error("Error: Formato de número internacional incorrecto.");
  //       return false;
  //     }
  //   }
  //   // Caso 2: Móvil local que inicia con "09" (10 dígitos totales)
  //   else if (/^09\d{8}$/.test(telefonoLimpio)) {
  //     // Formatea a: +593 XX XXX XXXX
  //     formatoFinal = telefonoLimpio.replace(/^09(\d{2})(\d{3})(\d{4})$/, '+593 $1 $2 $3');
  //   }
  //   // Caso 3: Números convencionales que inician con "0"
  //   else if (telefonoLimpio.startsWith('0')) {
  //     const codigoProvincia = telefonoLimpio.substring(1, 2);
  //     if (!['2', '3', '4', '5', '6', '7'].includes(codigoProvincia)) {
  //       console.error("Error: Código de provincia inválido.");
  //       return false;
  //     }
  //     // Caso 3.a: Convencional con 10 dígitos totales (0 + 9 dígitos)
  //     // Ejemplo: "0456789012" → (04) 5678-9012
  //     if (telefonoLimpio.length === 10) {
  //       formatoFinal = telefonoLimpio.replace(/^(0[2-7])(\d{4})(\d{4})$/, '($1) $2-$3');
  //     }
  //     // Caso 3.b: Convencional con 9 dígitos totales (0 + 8 dígitos)
  //     else if (telefonoLimpio.length === 9) {
  //       formatoFinal = telefonoLimpio.replace(/^0([2-7])(\d{2})(\d{2})(\d{4})$/, '(0$1) $2-$3-$4');
  //     }
  //     // Caso 3.c: Convencional con 8 dígitos totales (0 + 7 dígitos)
  //     else if (telefonoLimpio.length === 8) {
  //       formatoFinal = telefonoLimpio.replace(/^0([2-7])(\d{1})(\d{2})(\d{4})$/, '(0$1) $2-$3-$4');
  //     }
  //     // Caso 3.d: Formato local (7 dígitos sin 0)
  //     else if (telefonoLimpio.length === 7) {
  //       formatoFinal = telefonoLimpio.replace(/^([2-7])(\d{2})(\d{2})(\d{2})$/, '(0$1) $2-$3-$4');
  //     } else {
  //       console.error("Error: El número convencional tiene que tener un formato correcto (ej: (02) xx-xx-xx o (02) xxxx-xxxx).");
  //       return false;
  //     }
  //   }
  //   // Caso 4: Números sin prefijo conocido (podrían ser celulares sin 09 o convencionales sin 0)
  //   else if (/^\d{7,10}$/.test(telefonoLimpio)) {
  //     // Si comienza con 9 y tiene 9 dígitos, se asume móvil sin 0 inicial
  //     if (telefonoLimpio.startsWith('9') && telefonoLimpio.length === 9) {
  //       formatoFinal = telefonoLimpio.replace(/^9(\d{4})(\d{4})$/, '+593 9 $1 $2');
  //     }
  //     // Si es convencional sin 0 y tiene 8 dígitos (ej: 45678901 → (04) 5678-901)
  //     else if (/^[2-7]\d{7}$/.test(telefonoLimpio)) {
  //       formatoFinal = telefonoLimpio.replace(/^([2-7])(\d{4})(\d{4})$/, '(0$1) $2-$3');
  //     } else {
  //       console.error("Error: Formato desconocido");
  //       return false;
  //     }
  //   } else {
  //     console.error("Error, formato desconocido");
  //     return false;
  //   }
  //
  //   if (!formatoFinal) {
  //     return false;
  //   }
  //
  //   // Verificar duplicados, excluyendo el elemento actual (si se está editando)
  //   try {
  //     const allItems = await service.getAll();
  //     const isDuplicate = allItems.some(item => item.telefono === formatoFinal && item.id !== id);
  //     if (isDuplicate) {
  //       console.error("Error: El número de teléfono ya está registrado.");
  //       return false;
  //     }
  //   } catch (error) {
  //     console.error(`Error al validar teléfono ${telefono}:`, error);
  //     return false;
  //   }
  //   console.info(`Teléfono validado y formateado: ${formatoFinal}`);
  //   return formatoFinal;
  // }

  // static async telefonoBP(telefono, service, id = null) {
  //   if (!telefono || telefono.trim() === '') {
  //     console.error("Error: El número de teléfono no puede estar vacío.");
  //     return false;
  //   }
  //   let telefonoLimpio = telefono.trim().replace(/[^0-9+]/g, ''); // Elimina caracteres no numéricos excepto '+'
  //   // Detectar si es un número de celular o convencional
  //   let formatoFinal = '';
  //   if (telefonoLimpio.startsWith('+593')) { //Formato Internacional
  //     telefonoLimpio = telefonoLimpio.slice(4); // Elimina '+593' al inicio
  //     if (telefonoLimpio.length === 9 && telefonoLimpio.startsWith('9')) {
  //       //Celular
  //       formatoFinal = `+593 ${telefonoLimpio.substring(0, 1)} ${telefonoLimpio.substring(1, 5)} ${telefonoLimpio.substring(5, 9)}`;
  //     } else if (telefonoLimpio.length === 9 && !telefonoLimpio.startsWith('9')) {
  //       //Convencional
  //       const codigoProvincia = telefonoLimpio.substring(0, 1);
  //       if (['2', '3', '4', '5', '6', '7'].includes(codigoProvincia)) {
  //         formatoFinal = `(0${codigoProvincia}) ${telefonoLimpio.substring(1, 3)} - ${telefonoLimpio.substring(3, 5)} - ${telefonoLimpio.substring(5, 9)}`;
  //       } else {
  //         console.error("Error: Formato de número convencional incorrecto.");
  //         return false;
  //       }
  //     } else if (telefonoLimpio.length === 8 && !telefonoLimpio.startsWith('9')) {
  //       //Convencional de 8 dígitos
  //       let codigoProvincia = telefonoLimpio.substring(0, 1);
  //       formatoFinal = `(0${codigoProvincia})${telefonoLimpio.substring(1, 2)}-${telefonoLimpio.substring(2, 4)}-${telefonoLimpio.substring(4, 8)}`;
  //     } else {
  //       console.error("Error: Formato de número internacional incorrecto.");
  //       return false;
  //     }
  //   } else if (telefonoLimpio.startsWith('09')) {//Formato celular
  //     if (telefonoLimpio.length !== 10) {
  //       console.error("Error: El número de celular debe tener 10 dígitos (incluyendo el 0 inicial).");
  //       return false;
  //     }
  //     formatoFinal = `+593 ${telefonoLimpio.substring(1, 3)} ${telefonoLimpio.substring(3, 6)} ${telefonoLimpio.substring(6)}`;
  //   } else if (telefonoLimpio.startsWith('0')) {  // Formato convencional con 0 inicial
  //     const codigoProvincia = telefonoLimpio.substring(1, 2);
  //     if (!['2', '3', '4', '5', '6', '7'].includes(codigoProvincia)) {
  //       console.error("Error: Código de provincia inválido.");
  //       return false;
  //     }
  //     if (telefonoLimpio.length === 8) { //Valida si es de 8
  //       formatoFinal = `(0${codigoProvincia}) ${telefonoLimpio.substring(2, 3)} - ${telefonoLimpio.substring(3, 5)} - ${telefonoLimpio.substring(5)}`;
  //     } else if (telefonoLimpio.length === 9) {// Formato convencional, asume 9 dígitos.
  //       formatoFinal = `(0${codigoProvincia}) ${telefonoLimpio.substring(2, 4)} - ${telefonoLimpio.substring(4, 6)} - ${telefonoLimpio.substring(6)}`;
  //     } else if (telefonoLimpio.length === 7) {//formato local
  //       formatoFinal = `(${telefonoLimpio.substring(0, 1)})${telefonoLimpio.substring(1, 3)}-${telefonoLimpio.substring(3, 5)}-${telefonoLimpio.substring(5, 7)}`;
  //     } else {
  //       console.error("Error: El número convencional tiene que tener un formato correcto (ej: (02) xx-xx-xx o (02) xxx-xxxx ).");
  //       return false;
  //     }
  //   } else if (telefonoLimpio.length >= 7 && telefonoLimpio.length <= 10) {
  //
  //     //Podria ser un celular sin 09 o convencional
  //     if (/^09\d{8}$/.test(telefonoLimpio))//Es celular sin 09
  //     {
  //       formatoFinal = '+593 ' + telefonoLimpio.substring(0, 1) + " " + telefonoLimpio.substring(1, 5) + " " + telefonoLimpio.substring(5, 9)
  //     } else { //Verificar convencional sin 0
  //       const posiblesCodigos = ['2', '3', '4', '5', '6', '7'];
  //       let codigoEncontrado = false;
  //       for (const cod of posiblesCodigos) {
  //         if (telefonoLimpio.startsWith(cod)) {
  //           if (telefonoLimpio.length === 8) {
  //             formatoFinal = `(0${cod}) ${telefonoLimpio.substring(1, 2)} - ${telefonoLimpio.substring(2, 4)} - ${telefonoLimpio.substring(4, 8)}`;
  //             codigoEncontrado = true;
  //             break;
  //           } else if (telefonoLimpio.length === 7) {
  //             formatoFinal = `(0${cod}) ${telefonoLimpio.substring(1, 3)} - ${telefonoLimpio.substring(3, 5)} - ${telefonoLimpio.substring(5)}`;
  //             codigoEncontrado = true;
  //           } else if (telefonoLimpio.length === 6) {
  //             formatoFinal = `(0${cod}) ${telefonoLimpio.substring(1, 2)} - ${telefonoLimpio.substring(2, 4)} - ${telefonoLimpio.substring(4)}`;
  //             codigoEncontrado = true;
  //           }
  //           break;
  //         }
  //       }
  //     }
  //   } else { //Si no inicia por nada conocido.
  //     console.error("Error, formato desconocido")
  //     return false;
  //   }
  //   if (!formatoFinal) {
  //     return false;
  //   }
  //   // Verificar duplicados *excluyendo* el elemento actual que se está editando (si lo hay)
  //   try {
  //     const allItems = await service.getAll();
  //     const isDuplicate = allItems.some(item => item.telefono === formatoFinal && item.id !== id);
  //     if (isDuplicate) {
  //       console.error("Error: El número de teléfono ya está registrado.");
  //       return false;
  //     }
  //   } catch (error) {
  //     console.error(`Error al validar teléfono ${telefono}:`, error);
  //     return false; // Falso en caso de error de DB.
  //   }
  //   console.info('Teléfono validado y formateado: ${formatoFinal}');
  //   return formatoFinal;
  // }
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
   * Valida una dirección, permite letras, números, espacios y algunos caracteres especiales
   * @param {string} direccion - La dirección a validar.
   * @returns {string|null} La dirección validada si es válida, o null si no lo es.
   */
  static direccionBP(direccion) {
    if (!direccion || direccion.trim() === '') {
      console.error('La dirección no puede estar vacía.');
      return null;
    }
    const direccionFormateada = direccion.trim();

    if (direccionFormateada.length < 5 || direccionFormateada.length > 100) {
      console.error('La dirección debe tener entre 5 y 100 caracteres.');
      return null;
    }
    // Permite letras (incluyendo acentuadas y Ñ/ñ), números, espacios, #, - y ,.
    // Debe iniciar y terminar con letra o número.
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9][A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s#,-]*[A-Za-zÁÉÍÓÚáéíóúÑñ0-9]$/;

    if (!regex.test(direccionFormateada)) {
      console.error('Dirección no válida. Solo se permiten letras (incluyendo acentos y Ñ), números, espacios, #, - y comas. Debe iniciar y terminar con letra o número.');
      return null;
    }

    console.info(`Dirección "${direccionFormateada}" validada.`);
    return direccionFormateada;
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
  //static cantidadStock(valor) {
  //  let valorNumerico;
  //  if (typeof valor === 'string') {
  //    valorNumerico = valor.trim();//Eliminar Espacios
  //    if (/[^0-9]/.test(valorNumerico)) { //Si contiene valor no numerico
  //      console.error("Error: La cantidad/stock debe ser un número entero.");
  //      return false;
  //    }
  //    valorNumerico = Number(valorNumerico);
  //    //Verificar si es entero
  //    if (!Number.isInteger(valorNumerico)) {
  //      console.error("Error, Formato invalido, debe ser un entero");
  //      return false
  //    }
  //  } else if (typeof valor === 'number') {
  //    valorNumerico = valor;
  //    if (!Number.isInteger(valorNumerico)) {
  //      console.error("Error, Debe ser entero, no se admite decimales");
  //      return false;
  //    }
  //  } else {
  //    console.error("Error: La cantidad/stock debe ser un número o una cadena.");
  //    return false;
  //  }
  //  //Verifica si es negativo
  //  if (valorNumerico < 0) {
  //    console.error("Error: La cantidad/stock no puede ser negativo.");
  //    return false;
  //  }
  //  console.info(`Cantidad/stock validado: ${valorNumerico}`);
  //  return valorNumerico;
  //}
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
  
      // Para actualizaciones de stock por venta, permitimos números negativos
      // pero para cantidad inicial o reposición, debe ser positivo
      if (!Number.isInteger(valorNumerico)) {
          console.error("Error: La cantidad debe ser un número entero");
          return null;
      }
  
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