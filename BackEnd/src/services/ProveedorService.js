// BackEnd/src/services/ProveedorService.js
import {IndexedDB} from '../database/indexdDB.js';
import {Validar} from '../utils/validar.js';
import {Proveedor} from '../models/Proveedor.js';
import {ProductoService} from './ProductoService.js';
import GoogleSheetSync from '../database/syncGoogleSheet.js';

/**
 * 🔰 Servicio para la gestión de proveedores.
 * Extiende de IndexedDB para interactuar con la base de datos.
 */
class ProveedorService extends IndexedDB {
  static googleSheetSyncProveedor = new GoogleSheetSync(
    'https://script.google.com/macros/s/AKfycbw2HqffG73garOu-4_0Bbv8Qw0iylYAKhQZmehlOzz_2BEZqv3iUxoTcIa6RyfkvK1N/exec'
  );

  constructor() {
    super('mydb', 'proveedores');
  }

  /**
   * Agrega un nuevo proveedor a la base de datos.
   * @param {Proveedor} proveedor - Objeto proveedor a agregar.
   * @returns {Promise<number|null>} - El ID del proveedor agregado o null si falla.
   */
  async agregarProveedor(proveedor) {
    try {
      // 1. Validación
      const nombreValidado = Validar.nombreBP(proveedor.nombre);
      const direccionValidada = Validar.direccionBP(proveedor.direccion);
      const telefonoValidado = await Validar.telefonoBPT(proveedor.telefono, this);
      if (!nombreValidado || !direccionValidada || !telefonoValidado) {
        return null; // Los errores de validación se manejan en los métodos de Validar.
      }

      // 2. Obtener el último ID y generar el siguiente
      const lastId = await this.getAll()
        .then(proveedores => {
          if (proveedores.length === 0) return 0;
          return Math.max(...proveedores.map(p => p.id));
        });
      const nextId = lastId + 1;

      // 3. Crear instancia de Proveedor con ID
      const nuevoProveedor = new Proveedor(nombreValidado, telefonoValidado, direccionValidada);
      nuevoProveedor.id = nextId; // Asignar el ID antes de guardar

      // 4. Agregar a IndexedDB
      await super.add(nuevoProveedor);
      console.info(`Proveedor agregado con ID: ${nextId}`);
      return nextId;

    } catch (error) {
      console.error('Error al agregar proveedor:', error);
      return null;
    }
  }

  /**
   * Actualiza un proveedor existente en la base de datos.
   * @param {number} id - ID del proveedor a actualizar.
   * @param {Proveedor} proveedorActualizado - Objeto proveedor con los datos actualizados.
   * @returns {Promise<number|null>} - El ID del proveedor actualizado o null si falla.
   */
  async actualizarProveedor(id, proveedorActualizado) {
    try {
      // 1. Obtener la instancia actual del proveedor
      const proveedorExistente = await this.obtenerProveedorPorId(id);
      if (!proveedorExistente) {
        console.warn(`No se encontró proveedor con ID ${id}`);
        return null;
      }

      // 2. Validar cada campo solo si se proporcionó un nuevo valor,
      //    y en caso contrario, usar el valor existente.
      let nombreValidado = proveedorActualizado.nombre !== undefined
        ? await Validar.nombreBP(proveedorActualizado.nombre)
        : proveedorExistente.nombre;
      let direccionValidada = proveedorActualizado.direccion !== undefined
        ? Validar.direccionBP(proveedorActualizado.direccion)
        : proveedorExistente.direccion;
      let telefonoValidado = proveedorActualizado.telefono !== undefined
        ? await Validar.telefonoBPT(proveedorActualizado.telefono, this, id)
        : proveedorExistente.telefono;

      // Si se pasó un campo para actualizar y falla la validación, se retorna null.
      if ((proveedorActualizado.nombre !== undefined && !nombreValidado) ||
        (proveedorActualizado.direccion !== undefined && !direccionValidada) ||
        (proveedorActualizado.telefono !== undefined && !telefonoValidado)) {
        return null;
      }

      // 3. Comparar si hubo cambios reales
      let huboCambios = false;
      if (proveedorExistente.nombre !== nombreValidado) {
        proveedorExistente.nombre = nombreValidado;
        huboCambios = true;
      }
      if (proveedorExistente.direccion !== direccionValidada) {
        proveedorExistente.direccion = direccionValidada;
        huboCambios = true;
      }
      if (proveedorExistente.telefono !== telefonoValidado) {
        proveedorExistente.telefono = telefonoValidado;
        huboCambios = true;
      }

      // Verificar cambios en el estado
      if (proveedorActualizado.estado !== undefined && proveedorExistente.estado !== proveedorActualizado.estado) {
        proveedorExistente.estado = proveedorActualizado.estado;
        huboCambios = true;
      }

      // 4. Si no hubo cambios, retornamos el ID sin actualizar
      if (!huboCambios) {
        console.info(`Proveedor con ID ${id} no tuvo cambios detectados.`);
        return id;
      }

      // 5. Si hubo cambios, actualizar el timestamp y guardar en la BD
      proveedorExistente.prepareForUpdate();
      await super.update(id, proveedorExistente);
      console.info(`Proveedor con ID ${id} actualizado correctamente.`);
      return proveedorExistente;
    } catch (error) {
      console.error(`Error al actualizar proveedor con ID ${id}:`, error);
      return proveedorExistente;
    }
  }


  /**
   * Obtiene todos los proveedores.
   * @returns {Promise<Array<Proveedor>>} - Un array con todos los proveedores o un array vacío en caso de error.
   */
  async obtenerTodosLosProveedores() {
    try {
      const proveedores = await super.getAll();
      // Convertir a instancias de Proveedor.
      const proveedoresInstancias = proveedores.map(proveedor => {
        const nuevoProveedor = new Proveedor(proveedor.nombre, proveedor.telefono, proveedor.direccion, proveedor.estado, proveedor.fechaCreacion, proveedor.fechaActualizacion);
        nuevoProveedor.id = proveedor.id
        return nuevoProveedor
      });
      console.info('Proveedores obtenidos:', proveedoresInstancias);
      return proveedoresInstancias; // Devuelve el array de instancias
    } catch (error) {
      console.error('Error al obtener todos los proveedores:', error);
      return []; // Devuelve un array vacío
    }
  }

  /**
   * Obtiene un proveedor por su ID.
   * @param {number} id - ID del proveedor a obtener.
   * @returns {Promise<Proveedor|null>} - El proveedor encontrado o null si no se encuentra.
   */
  async obtenerProveedorPorId(id) {
    try {
      const proveedor = await super.getById(id);
      if (proveedor) {
        //Crear la instancia de proveedor
        const nuevoProveedor = new Proveedor(proveedor.nombre, proveedor.telefono, proveedor.direccion, proveedor.estado, proveedor.fechaCreacion, proveedor.fechaActualizacion);
        nuevoProveedor.id = proveedor.id;
        console.info(`Proveedor con ID ${id} obtenido:`, nuevoProveedor);
        return nuevoProveedor; // Retorna la instancia.
      } else {
        console.warn(`No se encontró ningún proveedor con ID ${id}.`);
        return null;
      }
    } catch (error) {
      console.error(`Error al obtener proveedor con ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Elimina un proveedor por su ID.
   * @param {number} id - ID del proveedor a eliminar.
   * @returns {Promise<void|null>} - Devuelve void si se elimino con exito, o null en caso de error
   */
  async eliminarProveedor(id) {
    try {
      // Verificar dependencias con productos
      const productoService = new ProductoService(null, null, this);
      const dependencias = await productoService.verificarDependencias('proveedor', id);

      if (dependencias && dependencias.hasDependencies) {
        alert(`No se puede eliminar el proveedor porque está siendo utilizado por ${dependencias.count} producto(s).`);
        console.warn(`Imposible eliminar: El proveedor con ID ${id} está siendo utilizado por ${dependencias.count} producto(s).`);
        return false;
      }

      // Si no hay dependencias, proceder con la eliminación
      await super.delete(id);
      // Sincronizar con Google Sheets
      ProveedorService.googleSheetSyncProveedor.sync("delete", {id: id}); // << CAMBIO AQUÍ
      alert(`Proveedor con ID ${id} eliminado correctamente.`);
      console.info(`Proveedor con ID ${id} eliminado correctamente.`);
      return true;

    } catch (error) {
      console.error(`Error al eliminar proveedor con ID ${id}:`, error);
      return null;
    }
  }

}

export {ProveedorService};