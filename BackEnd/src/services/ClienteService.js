// BackEnd/src/services/ClienteService.js
import {IndexedDB} from '../database/indexdDB.js';
import {Validar} from '../utils/validar.js';
import {Cliente} from '../models/Cliente.js';

class ClienteService extends IndexedDB {
  constructor(idGeneratorService) { //  Inyecta IdGenerator
    super('mydb', 'clientes');
    this.idGeneratorService = idGeneratorService; //  Guarda la referencia
  }


  async agregarCliente(clienteData) {
    try {
        // Validate data
        const nombre = await Validar.nombreBP(clienteData.nombre);
        const telefono = await Validar.telefonoBP(clienteData.telefono, this);
        const direccion = Validar.direccionBP(clienteData.direccion);

        if (!nombre || !telefono || !direccion) {
            console.error('Validation failed for cliente data');
            return null;
        }

        // Create a Cliente instance first
        const nuevoCliente = new Cliente(nombre, telefono, direccion);
        
        // Obtener todos los clientes existentes para encontrar el ID más alto
        const clientes = await this.obtenerTodosLosClientes();
        const lastId = clientes.length > 0 
            ? Math.max(...clientes.map(c => c.id))
            : 0;
        const nextId = lastId + 1;
        
        // Asignar el nuevo ID
        nuevoCliente.id = nextId;
        
        // Guardar el cliente
        await super.add(nuevoCliente);
        
        // Actualizar el último ID usado
        if (this.idGeneratorService) {
            await this.idGeneratorService.setLastId('clientes', nextId);
        }

        console.log('Cliente agregado exitosamente:', nuevoCliente);
        return nuevoCliente;

    } catch (error) {
        console.error('Error al agregar cliente:', error);
        return null;
    }
}


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
        if (!id) {
            throw new Error('ID de cliente no proporcionado');
        }
        
        const cliente = await super.getById(id);
        if (!cliente) {
            console.warn(`Cliente con ID ${id} no encontrado`);
            return null;
        }
        
        console.log(`Cliente encontrado:`, cliente);
        return cliente;
    } catch (error) {
        console.error('Error al obtener cliente:', error);
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