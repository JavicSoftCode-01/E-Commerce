// BackEnd/src/utils/validar.js
import { IndexedDB } from '../database/indexdDB.js'; //  importación correcta

/**
 *  🔰🔰Clase con métodos de validación.  Todos los métodos son estáticos.🔰🔰
 */
export class Validar {


/**
 * Valida un nombre para categorías o marcas, con restricciones avanzadas de formato
 * @param {string} nombre - El nombre a validar.
 * @param {IndexedDB} service  Instancia del servicio (CategoriaService, MarcaService, etc.).
 * @param {number} [id=null] -  ID para excluir en la validación de duplicados (para actualizaciones).
 * @returns {Promise<string|null>} El nombre validado si es válido, o null si no lo es.
 */
static async nombreBM(nombre, service, id = null) {
    // Validación inicial
    if (!nombre || nombre.trim() === '') {
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

    // Expresión regular mejorada:
    // - Solo letras (incluyendo acentuadas y Ñ)
    // - Permite espacios solo entre palabras
    // - No permite números ni símbolos
    const regex = /^[A-Za-zÁÉÍÓÚÑáéíóúñ]+(?:\s+[A-Za-zÁÉÍÓÚÑáéíóúñ]+)*$/;

    if (!regex.test(nombreFormateado)) {
        console.error('El nombre solo debe contener letras (con acentos y Ñ). No se permiten números, símbolos o espacios al inicio/final.');
        return null;
    }

    try {
        // Determinar qué método getAll usar según el tipo de servicio
        let items = [];
        if (service instanceof service.constructor) {
            if (service.storeName === 'categorias') {
                items = await service.obtenerTodasLasCategorias();
            } else if (service.storeName === 'marcas') {
                items = await service.obtenerTodasLasMarcas();
            } else {
                console.error('Servicio no reconocido en validación de nombre.');
                return null;
            }
        }

        // Verificación de nombre duplicado (case-insensitive)
        const existe = items.some(item =>
            item.nombre.toLowerCase() === nombreFormateado.toLowerCase() && item.id !== id
        );

        if (existe) {
            console.error(`Ya existe un registro con el nombre: ${nombreFormateado}.`);
            return null;
        }

        console.info(`Nombre ${nombreFormateado} validado`);
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
    static async telefonoBP(telefono, service, id = null) {
        if (!telefono || telefono.trim() === '') {
            console.error('El número de teléfono no puede estar vacío.');
            return null;
        }
        const telefonoFormateado = telefono.replace(/\s/g, '').trim(); // Elimina espacios

        if (telefonoFormateado.length < 7 || telefonoFormateado.length > 20) {
            console.error('El teléfono debe tener entre 7 y 20 caracteres.');
            return null;
        }

        // Mejor expresión regular: permite números, espacios, guiones y puntos opcionales,
        const regex = /^[0-9+\-().\s]*$/;
        if (!regex.test(telefono)) {
            console.error('El número de teléfono no es válido.  Solo números, +, -, ., ( ).');
            return null;
        }

        try {

            // Determinar qué método getAll usar según el tipo de servicio
            let items = [];
           if (service instanceof service.constructor) {
               if(service.storeName === 'clientes') {
                items = await service.obtenerTodosLosClientes();

               } else if(service.storeName === 'proveedores') {
                   items = await service.obtenerTodosLosProveedores();
                } else {
                console.error('Servicio no reconocido en validación de nombre.');
                return null;
                }
            }

            // Verificación de duplicados, considerando la edición
            const existe = items.some(item => {
                // Si se proporciona un ID, *excluimos* ese ítem de la búsqueda de duplicados (es una edición).
                // Si id es null, verificamos contra todos (es una inserción).
                return item.telefono === telefonoFormateado && item.id !== id;
            });
            if (existe) {
                console.error(`El telefono ya existe`);
                return null
            }

            console.info(`Teléfono "${telefonoFormateado}" validado.`);
            return telefonoFormateado;
        } catch (error) {
            console.error("Error durante la validación de teléfono:", error);
            return null;
        }
    }

    /**
     * Valida una dirección, permite letras, números, espacios y algunos caracteres especiales
     * @param {string} direccion - La dirección a validar.
     * @returns {string|null} La dirección validada si es válida, o null si no lo es.
     */
    static direccionBP(direccion) {
        if (!direccion || direccion.trim() === '') {
            console.error('La direccion no puede ser vacia.')
            return null
        }
        const direccionFormateada = direccion.trim()

        if (direccionFormateada.length < 5 || direccionFormateada.length > 100) {
            console.error('La direccion debe tener entre 5 y 100 caracteres.');
            return null
        }
        //Permite letras, números, espacios, #, -, y coma. Empieza/termina con letra/número.
        const regex = /^[a-zA-Z0-9][a-zA-Z0-9\s#,-]*[a-zA-Z0-9]$/;

        if (!regex.test(direccionFormateada)) {
            console.error('Dirección no válida. Solo letras, números, espacios, #, -, y comas. Debe empezar/terminar con letra/número.');
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