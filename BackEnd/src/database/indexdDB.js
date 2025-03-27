// BackEnd/src/database/indexdDB.js
/**
 * 🔰🔰Clase que proporciona una interfaz simplificada para interactuar con IndexedDB.
 *  Permite operaciones CRUD (Crear, Leer, Actualizar, Eliminar) en un almacén de objetos.🔰🔰
 */
class IndexedDB {

    /**
     * Crea una instancia de IndexedDB.
     * @param {string} dbName - Nombre de la base de datos.
     * @param {string} storeName - Nombre del almacén de objetos.
     * @param {number} [version=1] - Versión de la base de datos.
     */
    constructor(dbName, storeName, version = 1) {
        this.dbName = dbName;
        this.storeName = storeName;
        this.version = version;
        this.dbPromise = this.openDB();  // La promesa se guarda para reutilizar la conexión.
    }

    /**
     * Abre la conexión a la base de datos IndexedDB.
     * @returns {Promise<IDBDatabase>} Promesa que resuelve a la instancia de la base de datos.
     */
    openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onerror = (event) => {
                console.error(`Error abriendo la base de datos ${this.dbName}:`, event.target.error);
                reject(event.target.error);
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.info(`Actualizando/creando estructura de la base de datos ${this.dbName}`);
                // uso el bucle para crear los almacenes de objetos de forma dinámica
                const stores = ['categorias', 'marcas', 'proveedores', 'clientes', 'productos', 'facturas', 'idGenerator'];
                for (const storeName of stores) {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true }); //  autoIncrement: true
                        console.info(`Se creó el object store '${storeName}'`);
                    }
                }
            };
            request.onsuccess = (event) => {
                console.info(`Base de datos ${this.dbName} abierta con éxito.`);
                resolve(event.target.result);
            };
        });
    }

    /**
     * obtengo todos los registros del almacén de objetos.
     */
    async getAll() {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            request.onsuccess = () => {
                console.info(`Obtenidos todos los registros de ${this.storeName}.`);
                resolve(request.result);
            };
            request.onerror = (event) => {
                console.error(`Error al obtener todos los registros de ${this.storeName}:`, event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * Obtiene un registro por su ID.
     * @param {any} id - ID del registro a obtener.
     * @returns {Promise<any|null>} Promesa que resuelve al registro encontrado o null si no se encuentra.
     */
    async getById(id) {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], "readonly");
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get(id);
            request.onsuccess = event => {
                console.info(`Registro obtenido de ${this.storeName} con id ${id}:`, request.result);
                resolve(request.result);
            }
            request.onerror = event => {
                console.error(`Error al obtener registro de ${this.storeName} con id ${id}:`, event.target.error);
                reject(event.target.error);
            }
        });
    }

    /**
     * Agrega un nuevo registro al almacén de objetos.
     * @param {any} item - El objeto a agregar.
     * @returns {Promise<any>} Promesa que resuelve a la clave del nuevo registro.
     */
async add(item) {
    try {
        const db = await this.dbPromise;
        
        // Convert the item to a plain object regardless of its type
        const plainItem = {};
        Object.assign(plainItem, item);

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const request = store.add(plainItem);
            
            request.onsuccess = () => {
                console.info(`Registro agregado en ${this.storeName}:`, plainItem);
                resolve(request.result);
            };
            
            request.onerror = (event) => {
                console.error(`Error al agregar registro en ${this.storeName}:`, event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('Error in add method:', error);
        throw error;
    }
}

    /**
     * Actualiza un registro existente en el almacén de objetos.
     * @param {any} id - ID del registro a actualizar.
     * @param {any} updatedItem - El objeto con los datos actualizados.  Debe incluir la clave primaria (id).
     * @returns {Promise<any>} Promesa que resuelve a la clave del registro actualizado.
     */
    async update(id, updatedItem) {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(updatedItem); // Usamos put para actualizar, que requiere el objeto completo.
            request.onsuccess = () => {
                console.info(`Registro actualizado en ${this.storeName} con id ${id}:`, updatedItem);
                resolve(request.result); // Resuelve con el ID
            };
            request.onerror = (event) => {
                console.error(`Error al actualizar registro en ${this.storeName} con id ${id}:`, event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * Elimina un registro del almacén de objetos por su ID.
     * @param {any} id - ID del registro a eliminar.
     * @returns {Promise<any>} Promesa que resuelve a la clave del registro eliminado.
     */
    async delete(id) {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);
            request.onsuccess = () => {
                console.info(`Registro eliminado en ${this.storeName} con id ${id}`);
                resolve(request.result); // Devuelve undefined si la eliminación es exitosa, lo cual está bien.
            };
            request.onerror = (event) => {
                console.error(`Error al eliminar registro en ${this.storeName} con id ${id}:`, event.target.error);
                reject(event.target.error);
            };
        });
    }
}


/**
 * 🔰 Clase para manejar la generación y almacenamiento de IDs secuenciales para diferentes modelos en IndexedDB.
 */
class IdGenerator extends IndexedDB {
    constructor() {
        super('mydb', 'idGenerator');
    }

    async getNextId(entityName) {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            return new Promise((resolve, reject) => {
                const getRequest = store.get(entityName);
                
                getRequest.onsuccess = async () => {
                    let record = getRequest.result;
                    
                    if (!record) {
                        record = { entity: entityName, lastId: 0 };
                    }
                    
                    record.lastId += 1;
                    
                    const putRequest = store.put(record);
                    
                    putRequest.onsuccess = () => {
                        resolve(record.lastId);
                    };
                    
                    putRequest.onerror = () => {
                        reject(putRequest.error);
                    };
                };
                
                getRequest.onerror = () => {
                    reject(getRequest.error);
                };
            });
            
        } catch (error) {
            console.error(`Error getting next ID for ${entityName}:`, error);
            throw error;
        }
    }


    async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'entity' });
                }
            };
        });
    }

    /**
     * Obtiene el último ID utilizado para un modelo específico.
     * @param {string} modelName - Nombre del modelo.
     * @returns {Promise<number>} Promesa que resuelve al último ID utilizado o 0 si no existe.
     */
    async getLastId(modelName) {
        try {
            const idObject = await this.getById(modelName);
            console.info(`Obtenido lastId para el modelo ${modelName}:`, idObject);
            return idObject ? idObject.lastId : 0;
        } catch (error) {
            console.error(`Error al obtener lastId para el modelo ${modelName}:`, error);
            return 0; // Valor predeterminado en caso de error.
        }
    }

    /**
     * Establece el último ID utilizado para un modelo específico.
     * @param {string} modelName - Nombre del modelo.
     * @param {number} lastId - El último ID a almacenar.
     * @returns {Promise<void>} Promesa que se resuelve una vez que el ID ha sido actualizado.
     */
    async setLastId(modelName, lastId) {
        try {
           // const registroExistente = await this.getById(modelName);  // Intenta encontrar registro

             // Actualiza, pero usando put, y ahora requiere registro completo.
             await this.update(modelName, { id: modelName, lastId });  //

            console.info(`Actualizado lastId para el modelo ${modelName} a ${lastId}`);
        } catch (error) {
            console.error(`Error al actualizar lastId para el modelo ${modelName}:`, error);
        }
    }

    /**
     * Asegura que exista un registro de ID inicial para un modelo dado. Si no existe, lo crea.
     * @param {string} modelName - Nombre del modelo.
     * @returns {Promise<void>}  Promesa que se resuelve una vez que se ha verificado/creado el registro.
     */
    async ensureIdExists(entityName) {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            return new Promise((resolve, reject) => {
                const getRequest = store.get(entityName);
                
                getRequest.onsuccess = async () => {
                    if (!getRequest.result) {
                        const putRequest = store.put({ entity: entityName, lastId: 0 });
                        putRequest.onsuccess = () => resolve();
                        putRequest.onerror = () => reject(putRequest.error);
                    } else {
                        resolve();
                    }
                };
                
                getRequest.onerror = () => reject(getRequest.error);
            });
        } catch (error) {
            console.error(`Error ensuring ID exists for ${entityName}:`, error);
            throw error;
        }
    }


  


}

export { IndexedDB, IdGenerator };