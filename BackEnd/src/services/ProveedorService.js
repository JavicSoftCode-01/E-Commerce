// BackEnd/src/services/ProveedorService.js
import {IndexedDB} from '../database/indexdDB.js';
import {Validar} from '../utils/validar.js';
import {Proveedor} from '../models/Proveedor.js';

/**
 * 🔰 Servicio para la gestión de proveedores.
 * Extiende de IndexedDB para interactuar con la base de datos.
 */
class ProveedorService extends IndexedDB {
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
      const nombreValidado = await Validar.nombreBP(proveedor.nombre);
      const direccionValidada = Validar.direccionBP(proveedor.direccion);
      const telefonoValidado = await Validar.telefonoBP(proveedor.telefono, this);
      if (!nombreValidado || !direccionValidada || !telefonoValidado) {
        return null; // Los errores de validación se manejan en los métodos de Validar.
      }
      // Crear instancia de Proveedor.
      const nuevoProveedor = new Proveedor(nombreValidado, telefonoValidado, direccionValidada);
      nuevoProveedor.id = await super.add(nuevoProveedor);  // Guarda instancia.
      console.info(`Proveedor agregado con ID: ${nuevoProveedor.id}`);
      return nuevoProveedor.id;
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
      const nombreValidado = await Validar.nombreBP(proveedorActualizado.nombre);
      const direccionValidada = Validar.direccionBP(proveedorActualizado.direccion);
      const telefonoValidado = await Validar.telefonoBP(proveedorActualizado.telefono, this, id);
      if (!nombreValidado || !direccionValidada || !telefonoValidado) {
        return null; // Los errores de validación se manejan en los métodos de Validar.
      }
      //Obtener instancia
      const proveedorExistente = await this.obtenerProveedorPorId(id);
      if (!proveedorExistente) {
        return null
      }
      //Actualizar datos.
      proveedorExistente.nombre = nombreValidado;
      proveedorExistente.direccion = direccionValidada;
      proveedorExistente.telefono = telefonoValidado;
      const updatedId = await super.update(id, proveedorExistente); // Guarda instancia
      console.info(`Proveedor con ID ${id} actualizado correctamente.`);
      return updatedId;
    } catch (error) {
      console.error(`Error al actualizar proveedor con ID ${id}:`, error);
      return null;
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
        const nuevoProveedor = new Proveedor(proveedor.nombre, proveedor.telefono, proveedor.direccion);
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
        const nuevoProveedor = new Proveedor(proveedor.nombre, proveedor.telefono, proveedor.direccion);
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
      await super.delete(id);
      alert(`Proveedor con ID ${id} eliminado correctamente`);
      console.info(`Proveedor con ID ${id} eliminado correctamente.`);
    } catch (error) {
      console.error(`Error al eliminar proveedor con ID ${id}:`, error);
      return null;
    }
  }
}

export {ProveedorService};