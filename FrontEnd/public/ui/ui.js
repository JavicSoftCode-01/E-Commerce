//FrontEnd/public/ui/ui.js
import {app} from './AppFactory.js';
import {appService} from './services/UшымтаService.js';
import {adminController} from './controllers/AdminController.js';

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
      console.log('Cart button clicked');
      app.carritoController.mostrarCarrito();
    });

    document.getElementById('closeCartModal').addEventListener('click', () => {
      console.log('Cart button cerrar modal');
      app.carritoController.ocultarModalCarrito();
    });

    document.getElementById('btnCheckout').addEventListener('click', () => {
      app.carritoController.procederAlPago();
    });

    // Load store components after event listeners
    await app.tiendaController.cargarProductos();
    await app.tiendaController.cargarFiltros();

  } catch (error) {
    console.error('Initialization error:', error);
    alert('Error al inicializar la aplicación');
  }
});