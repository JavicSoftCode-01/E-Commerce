// BackEnd/src/services/ClienteService.js
import {IndexedDB} from '../database/indexdDB.js';
import {Validar} from '../utils/validar.js';
import {Cliente} from '../models/Cliente.js';
import GoogleSheetSync from '../database/syncGoogleSheet.js';
import GoogleSheetReader from '../database/GoogleSheetReader.js';

class ClienteService extends IndexedDB {
  static googleSheetSyncCliente = new GoogleSheetSync(
    'https://script.google.com/macros/s/AKfycbyFGaN_Hzq5ycyPXjvNChKDSsftjtyo5fg9Rq9AcrDgA87oO0JjES5ZgbZeyNHZQ0mh/exec'
  );
  static googleSheetReaderCliente = new GoogleSheetReader(
    'https://script.google.com/macros/s/AKfycbyFGaN_Hzq5ycyPXjvNChKDSsftjtyo5fg9Rq9AcrDgA87oO0JjES5ZgbZeyNHZQ0mh/exec'
  );

  static SYNC_INTERVAL = 3 * 1000;

  constructor() {
    super('mydb', 'clientes');
    this.lastSyncTime = null;
    this.startPeriodicSync();
  }

  startPeriodicSync() {
    this.syncWithGoogleSheets();
    setInterval(() => {
      this.syncWithGoogleSheets();
    }, ClienteService.SYNC_INTERVAL);
  }

  async syncWithGoogleSheets() {
    try {
      console.log('Iniciando sincronización con Google Sheets para Clientes...');
      const clientesData = await ClienteService.googleSheetReaderCliente.getData('Cliente');
      console.log(`Recibidos ${clientesData.length} registros.`);
      const clientesInstancias = clientesData.map(cData => {
        const instancia = new Cliente(
          cData.nombre,
          cData.telefono,
          cData.direccion,
          cData.estado,
          cData.fechaCreacion,
          cData.fechaActualizacion,
          cData.contador
        );
        instancia.id = cData.id;
        return instancia;
      });
      await this.clearAll();
      for (const cliente of clientesInstancias) {
        await super.add(cliente);
      }
      this.lastSyncTime = new Date();
      console.info(`Sincronización exitosa: ${clientesInstancias.length} registros a las ${this.lastSyncTime}`);
      return true;
    } catch (error) {
      console.error('Error en sincronización:', error);
      return false;
    }
  }

  async forceSyncNow() {
    this.lastSyncTime = null;
    return await this.syncWithGoogleSheets();
  }

  async obtenerTodosLosClientes() {
    try {
      if (!this.lastSyncTime || (new Date() - this.lastSyncTime) > ClienteService.SYNC_INTERVAL) {
        await this.syncWithGoogleSheets();
      }
      const clientesData = await super.getAll();
      return clientesData.map(cData => {
        const instancia = new Cliente(
          cData.nombre,
          cData.telefono,
          cData.direccion,
          cData.estado,
          cData.fechaCreacion,
          cData.fechaActualizacion,
          cData.contador
        );
        instancia.id = cData.id;
        return instancia;
      });
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      return [];
    }
  }

  async obtenerClientePorId(id) {
    try {
      if (!this.lastSyncTime || (new Date() - this.lastSyncTime) > ClienteService.SYNC_INTERVAL) {
        await this.syncWithGoogleSheets();
      }
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

  async agregarCliente(cliente) {
    try {
      await this.forceSyncNow();
      const nombreValidado = Validar.nombreBP(cliente.nombre);
      const direccionValidada = Validar.direccionBP(cliente.direccion);
      const telefonoValidado = await Validar.telefonoBPT(cliente.telefono, this);
      if (!nombreValidado || !direccionValidada || !telefonoValidado) {
        return null;
      }
      const lastId = await this.getAll().then(clientes => {
        if (clientes.length === 0) return 0;
        return Math.max(...clientes.map(c => c.id));
      });
      const nextId = lastId + 1;
      const nuevoCliente = new Cliente(nombreValidado, telefonoValidado, direccionValidada, cliente.estado, null, null, 0);
      nuevoCliente.id = nextId;
      await super.add(nuevoCliente);
      console.log(`Cliente creado localmente con ID: ${nextId}. Sincronizando...`);
      await ClienteService.googleSheetSyncCliente.sync("create", nuevoCliente);
      console.info(`Cliente con ID: ${nextId} sincronizado.`);
      await this.forceSyncNow();
      return nuevoCliente;
    } catch (error) {
      console.error('Error al agregar cliente:', error);
      return null;
    }
  }

  async actualizarCliente(id, datosActualizados) {
    try {
      console.log(`Comenzando actualización de cliente ID ${id}`, datosActualizados);
      await this.forceSyncNow();
      const clienteExistente = await this.obtenerClientePorId(id);
      if (!clienteExistente) return null;

       // Si solo estamos actualizando el estado, hacemos un proceso simplificado
    if (Object.keys(datosActualizados).length === 1 && datosActualizados.estado !== undefined) {
      console.log(`Actualizando solo estado a ${datosActualizados.estado} para cliente ID ${id}`);

      // Solo actualizamos el estado
      clienteExistente.estado = datosActualizados.estado;
      clienteExistente.prepareForUpdate();

      try {
        await super.update(id, clienteExistente);
        console.log(`Cliente con ID ${id} (solo estado) actualizado localmente.`);

        try {
          await ClienteService.googleSheetSyncCliente.sync("update", clienteExistente);
          console.info(`Cliente con ID ${id} sincronizado con Google Sheets.`);
        } catch (syncError) {
          console.error(`Error al sincronizar con Google Sheets:`, syncError);
          // Continuamos aunque haya error de sincronización
        }

        await this.forceSyncNow();
        return clienteExistente;
      } catch (updateError) {
        console.error(`Error al actualizar en IndexedDB:`, updateError);
        throw updateError;
      }
    }
      let nombreValidado = datosActualizados.nombre !== undefined ? Validar.nombreBP(datosActualizados.nombre) : clienteExistente.nombre;
      let direccionValidada = datosActualizados.direccion !== undefined ? Validar.direccionBP(datosActualizados.direccion) : clienteExistente.direccion;
      let telefonoValidado = datosActualizados.telefono !== undefined ? await Validar.telefonoBPT(datosActualizados.telefono, this, id) : clienteExistente.telefono;
      if ((datosActualizados.nombre !== undefined && !nombreValidado) ||
        (datosActualizados.direccion !== undefined && !direccionValidada) ||
        (datosActualizados.telefono !== undefined && !telefonoValidado)) {
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
      if (datosActualizados.estado !== undefined && clienteExistente.estado !== datosActualizados.estado) {
        clienteExistente.estado = datosActualizados.estado;
        huboCambios = true;
      }
      if (huboCambios) {
        clienteExistente.prepareForUpdate();
        await super.update(id, clienteExistente);
        console.log(`Cliente con ID ${id} actualizado localmente.`);
        await ClienteService.googleSheetSyncCliente.sync("update", clienteExistente);
        console.info(`Cliente con ID ${id} sincronizado.`);
        await this.forceSyncNow();
        return clienteExistente;
      }
      console.info(`Cliente con ID ${id} sin cambios.`);
      return clienteExistente;
    } catch (error) {
      console.error(`Error al actualizar cliente con ID ${id}:`, error);
      return null;
    }
  }

  async eliminarCliente(id) {
    try {
      await this.forceSyncNow();
      await super.delete(id);
      console.log(`Cliente con ID ${id} eliminado localmente.`);
      await ClienteService.googleSheetSyncCliente.sync("delete", {id: id});
      console.info(`Cliente con ID ${id} eliminado y sincronizado.`);
      await this.forceSyncNow();
      return true;
    } catch (error) {
      console.error(`Error al eliminar cliente con ID ${id}:`, error);
      return null;
    }
  }

  async clearAll() {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.clear();
      console.info('IndexedDB limpiado.');
    } catch (error) {
      console.error('Error al limpiar IndexedDB:', error);
    }
  }
}

export {ClienteService};