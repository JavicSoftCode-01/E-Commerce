// index.js
// Importa la instancia de app que contiene todos los servicios
import {app} from '../ui/AppFactory.js';

async function init() {
  // Intenta acceder a un servicio para verificar que todo está configurado correctamente.
  try {
    // Ejemplo: Intenta obtener todas las categorías. Esto debería funcionar
    // si IndexedDB está configurado y los servicios se instanciaron correctamente.
    const categorias = await app.categoriaService.obtenerTodasLasCategorias();
    console.log('Categorías obtenidas:', categorias);
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
  }
}

document.addEventListener('DOMContentLoaded', init);