import { IndexedDB } from '../database/indexdDB.js';
import { Validar } from '../utils/validar.js';
import { Cliente } from '../models/Cliente.js';
import GoogleSheetSync from "../database/syncGoogleSheet.js";

class ClienteService extends IndexedDB {
    static googleSheetSyncCliente = new GoogleSheetSync(
    'https://script.google.com/macros/s/AKfycbz3HgLCJkEZ3-NUZ-fCPUbJLwpfnuR_80DiijfuJSooFSueIBORx-4lWc5pMt-5Taqh/exec'
  );
  constructor(idGeneratorService) {
    super('mydb', 'clientes');
    this.idGeneratorService = idGeneratorService;
  }

  async agregarCliente(clienteData) {
    try {
      const nombre = Validar.nombreBP(clienteData.nombre);
      const telefono = await Validar.telefonoBP(clienteData.telefono, this);
      const direccion = Validar.direccionBP(clienteData.direccion);

      if (!nombre || !telefono || !direccion) {
        console.error('Validation failed for cliente data');
        return null;
      }

      // Verificar si el teléfono ya existe
      const clienteExistente = await this.obtenerClientePorTelefono(telefono);
      if (clienteExistente) {
        console.error('Error: El número de teléfono ya está registrado.');
        return null; // No permitir duplicados en registro manual
      }

      const nuevoCliente = new Cliente(nombre, telefono, direccion);
      const clientes = await this.obtenerTodosLosClientes();
      const lastId = clientes.length > 0 ? Math.max(...clientes.map(c => c.id)) : 0;
      const nextId = lastId + 1;

      nuevoCliente.id = nextId;
      await super.add(nuevoCliente);
      ClienteService.googleSheetSyncCliente.sync("create", nuevoCliente);


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

  // async actualizarCliente(id, clienteActualizado) {
  //   try {
  //     const nombreValidado = Validar.nombreBP(clienteActualizado.nombre);
  //     const direccionValidada = Validar.direccionBP(clienteActualizado.direccion);
  //     const telefonoValidado = await Validar.telefonoBP(clienteActualizado.telefono, this, id);
  //
  //     if (!nombreValidado || !direccionValidada || !telefonoValidado) {
  //       return null;
  //     }
  //
  //     const clienteExistente = await this.obtenerClientePorId(id);
  //     if (!clienteExistente) {
  //       return null;
  //     }
  //
  //     // Verificar si el teléfono ya está en uso por otro cliente
  //     const otroCliente = await this.obtenerClientePorTelefono(telefonoValidado);
  //     if (otroCliente && otroCliente.id !== id) {
  //       console.error('Error: El número de teléfono ya está registrado por otro cliente.');
  //       return null;
  //     }
  //
  //     let huboCambios = false;
  //     if (clienteExistente.nombre !== nombreValidado) {
  //       clienteExistente.nombre = nombreValidado;
  //       huboCambios = true;
  //     }
  //     if (clienteExistente.direccion !== direccionValidada) {
  //       clienteExistente.direccion = direccionValidada;
  //       huboCambios = true;
  //     }
  //     if (clienteExistente.telefono !== telefonoValidado) {
  //       clienteExistente.telefono = telefonoValidado;
  //       huboCambios = true;
  //     }
  //
  //     if (huboCambios) {
  //       clienteExistente.prepareForUpdate();
  //       const updatedId = await super.update(id, clienteExistente);
  //       console.info(`Cliente con ID ${id} actualizado correctamente porque hubo cambios.`);
  //       return updatedId;
  //     } else {
  //       console.info(`Cliente con ID ${id} no tuvo cambios.`);
  //       return id;
  //     }
  //   } catch (error) {
  //     console.error(`Error al actualizar cliente con ID ${id}:`, error);
  //     return null;
  //   }
  // }
             async actualizarCliente(id, clienteActualizado) {
  try {
    const nombreValidado = Validar.nombreBP(clienteActualizado.nombre);
    const direccionValidada = Validar.direccionBP(clienteActualizado.direccion);
    const telefonoValidado = await Validar.telefonoBP(clienteActualizado.telefono, this, id);

    if (!nombreValidado || !direccionValidada || !telefonoValidado) {
      return null;
    }

    const clienteExistente = await this.obtenerClientePorId(id);
    if (!clienteExistente) {
      return null;
    }

    // Verificar si el teléfono ya está en uso por otro cliente
    const otroCliente = await this.obtenerClientePorTelefono(telefonoValidado);
    if (otroCliente && otroCliente.id !== id) {
      console.error('Error: El número de teléfono ya está registrado por otro cliente.');
      return null;
    }

    let huboCambios = false;
    if (clienteExistente.nombre !== nombreValidado) {
      clienteExistente.nombre = nombreValidado;
      huboCambios = true;
    }
    if (clienteExistente.direccion !== direccionValidada) {
      clienteExistente.direccion = direccionValidada;
      huboCambios = true;
    }
    if (clienteExistente.telefono !== telefonoValidado) {
      clienteExistente.telefono = telefonoValidado;
      huboCambios = true;
    }

    if (huboCambios) {
      clienteExistente.prepareForUpdate();
      const updatedId = await super.update(id, clienteExistente);

      // Añadir la sincronización con Google Sheets
      ClienteService.googleSheetSyncCliente.sync("update", clienteExistente);

      console.info(`Cliente con ID ${id} actualizado correctamente porque hubo cambios.`);
      return clienteExistente; // Retornar el objeto completo en lugar de solo el ID
    } else {
      console.info(`Cliente con ID ${id} no tuvo cambios.`);
      return clienteExistente; // Retornar el objeto completo en lugar de solo el ID
    }
  } catch (error) {
    console.error(`Error al actualizar cliente con ID ${id}:`, error);
    return null;
  }
}
  async obtenerTodosLosClientes() {
    try {
      const clientes = await super.getAll();
      return clientes.map(cliente => {
        const nuevoCliente = new Cliente(cliente.nombre, cliente.telefono, cliente.direccion, cliente.estado, cliente.fechaCreacion, cliente.fechaActualizacion, cliente.contador);
        nuevoCliente.id = cliente.id;
        return nuevoCliente;
      });
    } catch (error) {
      console.error('Error al obtener todos los clientes:', error);
      return [];
    }
  }

  async obtenerClientePorId(id) {
    try {
      const clienteData = await super.getById(id);
      if (clienteData) {
        const instanciaCliente = new Cliente(
          clienteData.nombre,
          clienteData.telefono,
          clienteData.direccion,
          clienteData.estado,
          clienteData.fechaCreacion,
          clienteData.fechaActualizacion,
          clienteData.contador
        );
        instanciaCliente.id = clienteData.id;
        return instanciaCliente;
      }
      return null;
    } catch (error) {
      console.error(`Error al obtener cliente con ID ${id}:`, error);
      return null;
    }
  }

  async obtenerClientePorTelefono(telefono) {
    try {
      const clientes = await this.obtenerTodosLosClientes();
      return clientes.find(cliente => cliente.telefono === telefono) || null;
    } catch (error) {
      console.error(`Error al buscar cliente por teléfono ${telefono}:`, error);
      return null;
    }
  }

  async incrementarContadorCliente(id) {
    try {
      const cliente = await this.obtenerClientePorId(id);
      if (!cliente) {
        console.error(`Cliente con ID ${id} no encontrado`);
        return null;
      }
      cliente.incrementarContador();
      const updatedId = await super.update(id, cliente);
      console.info(`Contador incrementado para cliente con ID ${id}. Nuevo valor: ${cliente.contador}`);
      return updatedId;
    } catch (error) {
      console.error(`Error al incrementar contador para cliente con ID ${id}:`, error);
      return null;
    }
  }

  async eliminarCliente(id) {
    try {
      await super.delete(id);
      ClienteService.googleSheetSyncCliente.sync("delete", {id: id});
      console.info(`Cliente con ID ${id} eliminado correctamente.`);
    } catch (error) {
      console.error(`Error al eliminar cliente con ID ${id}:`, error);
      return null;
    }
  }
}

export { ClienteService };