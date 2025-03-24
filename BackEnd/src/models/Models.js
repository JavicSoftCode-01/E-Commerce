// BackEnd/src/models/Models.js
import {IdGenerator} from '../database/indexdDB.js'

/**
 * 🔰🔰Clase abstracta que define el comportamiento general de los modelos de la aplicación.🔰🔰
 */
class Model {
  constructor() {
    if (this.constructor === Model) {
      throw new Error("Clase abstracta 'Model' no puede ser instanciada directamente");
    }
  }

  /**
   * Método estático que genera un ID único para un modelo específico.
   * @param {string} modelName - Nombre del modelo (e.g., 'Categoria', 'Producto').
   * @param {IdGenerator} idGeneratorService - Instancia de IdGenerator.
   * @returns {Promise<number>} Promesa que resuelve al ID generado.
   */
  static async generateId(modelName, idGeneratorService) {
    try {
      let lastId = await idGeneratorService.getLastId(modelName);
      lastId++;
      await idGeneratorService.setLastId(modelName, lastId);
      console.info(`Generado nuevo ID para ${modelName}: ${lastId}`);
      return lastId;
    } catch (error) {
      console.error(`Error generando ID para ${modelName}:`, error);
      throw error;  // Es importante propagar el error
    }
  }
}

export {Model};