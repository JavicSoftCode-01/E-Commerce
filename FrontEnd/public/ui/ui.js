import { app } from './AppFactory.js';
import { appService } from './services/UшымтаService.js';
import { adminController } from './controllers/AdminController.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize app service first
    await appService.init();

    // Setup event listeners after initialization
    document.getElementById('btnTienda').addEventListener('click', async () => {
      await app.tiendaController.mostrarTienda();
    });

    document.getElementById('btnAdmin').addEventListener('click', () => {
      adminController.mostrarPanelAdmin();
    });

    document.getElementById('btnCarrito').addEventListener('click', () => {
      app.carritoController.mostrarCarrito();
    });

    document.getElementById('btnCheckout').addEventListener('click', () => {
      app.checkoutController.procederAlPago();
    });

    // Load store components after event listeners
    await app.tiendaController.cargarProductos();
    await app.tiendaController.cargarFiltros();

  } catch (error) {
    console.error('Initialization error:', error);
    alert('Error al inicializar la aplicación');
  }
});