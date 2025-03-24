// BackEnd/src/services/ClienteService.js
import {IndexedDB} from '../database/indexdDB.js';
import {Validar} from '../utils/validar.js';
import {Cliente} from '../models/Cliente.js'; // Importa la clase Cliente

/**
 * 🔰 Servicio para la gestión de clientes.
 *  Extiende de IndexedDB para interactuar con la base de datos.
 */
class ClienteService extends IndexedDB {
  /**
   * Constructor del servicio de Cliente.
   */
  constructor() {
    super('mydb', 'clientes');
  }

  /**
   * Agrega un nuevo cliente a la base de datos.
   * @param {Cliente} cliente - Objeto cliente a agregar.
   * @returns {Promise<number|null>} - El ID del cliente agregado o null si falla.
   */
  async agregarCliente(cliente) {
    try {
      const nombreValidado = await Validar.nombreBP(cliente.nombre);
      const direccionValidada = Validar.direccionBP(cliente.direccion);
      const telefonoValidado = await Validar.telefonoBP(cliente.telefono, this);

      if (!nombreValidado || !direccionValidada || !telefonoValidado) {
        return null; // Los errores de validación ya se registran en los métodos de Validar
      }
      // Crea instancia de Cliente
      const nuevoCliente = new Cliente(nombreValidado, telefonoValidado, direccionValidada);
      nuevoCliente.id = await super.add(nuevoCliente); // Guarda instancia

      console.info(`Cliente agregado con ID: ${nuevoCliente.id}`);
      return nuevoCliente.id;
    } catch (error) {
      console.error('Error al agregar cliente:', error);
      return null;
    }
  }

  /**
   * Actualiza un cliente existente en la base de datos.
   * @param {number} id - ID del cliente a actualizar.
   * @param {Cliente} clienteActualizado - Objeto cliente con los datos actualizados.
   * @returns {Promise<number|null>} - El ID del cliente actualizado o null si falla.
   */
  async actualizarCliente(id, clienteActualizado) {
    try {
      const nombreValidado = await Validar.nombreBP(clienteActualizado.nombre);
      const direccionValidada = Validar.direccionBP(clienteActualizado.direccion);
      const telefonoValidado = await Validar.telefonoBP(clienteActualizado.telefono, this, id);

      if (!nombreValidado || !direccionValidada || !telefonoValidado) {
        return null; // Los errores de validación ya se registran en los métodos de Validar
      }

      // Obtener el cliente existente como instancia.
      const clienteExistente = await this.obtenerClientePorId(id);
      if (!clienteExistente) {
        return null;
      }
        // Actualizar los datos.
        clienteExistente.nombre = nombreValidado;
        clienteExistente.direccion = direccionValidada;
        clienteExistente.telefono = telefonoValidado;

      const updatedId = await super.update(id, clienteExistente);  // Guardar instancia.
      console.info(`Cliente con ID ${id} actualizado correctamente.`);
      return updatedId;
    } catch (error) {
      console.error(`Error al actualizar cliente con ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Obtiene todos los clientes.
   * @returns {Promise<Array<Cliente>>} - Un array con todos los clientes o un array vacío en caso de error.
   */
  async obtenerTodosLosClientes() {
    try {
      const clientes = await super.getAll();
      // Convertir a instancias de Cliente
      const clientesInstancias = clientes.map(cliente => {
          const nuevoCliente = new Cliente(cliente.nombre, cliente.telefono, cliente.direccion);
          nuevoCliente.id = cliente.id;
          return nuevoCliente;
      });

      console.info('Clientes obtenidos:', clientesInstancias);
      return clientesInstancias;
    } catch (error) {
      console.error('Error al obtener todos los clientes:', error);
      return []; // Devuelve un array vacío en caso de error
    }
  }

  /**
   * Obtiene un cliente por su ID.
   * @param {number} id - ID del cliente a obtener.
   * @returns {Promise<Cliente|null>} - El cliente encontrado o null si no se encuentra.
   */
  async obtenerClientePorId(id) {
    try {
      const cliente = await super.getById(id);
      if (cliente) {
        //Crear instancia de cliente
        const nuevoCliente = new Cliente(cliente.nombre, cliente.telefono, cliente.direccion);
        nuevoCliente.id = cliente.id
        console.info(`Cliente con ID ${id} obtenido:`, nuevoCliente);
        return nuevoCliente; // Retornar instancia.
      } else {
        console.warn(`No se encontró ningún cliente con ID ${id}.`);
        return null;
      }
    } catch (error) {
      console.error(`Error al obtener cliente con ID ${id}:`, error);
      return null;
    }
  }
    /**
     * Elimina un cliente por su ID.
     * @param {number} id - ID del cliente a eliminar.
     * @returns {Promise<void|null>} - Devuelve void si fue eliminado con exito, o null en caso de error.
     */
    async eliminarCliente(id) {
        try {
            await super.delete(id);
            console.info(`Cliente con ID ${id} eliminado correctamente.`);
        } catch (error) {
            console.error(`Error al eliminar cliente con ID ${id}:`, error);
            return null
        }
    }
}

export {ClienteService};