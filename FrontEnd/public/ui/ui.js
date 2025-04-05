// //FrontEnd/public/ui/ui.js
// import { app } from './AppFactory.js';
// import { appService } from './services/UшымтаService.js';
// import { adminController } from './controllers/AdminController.js';
//
// document.addEventListener('DOMContentLoaded', async () => {
//   try {
//     // Initialize app service first
//     await appService.init();
//
//     // Setup event listeners after initialization
//     document.getElementById('btnTienda').addEventListener('click', async () => {
//       await app.tiendaController.mostrarTienda();
//     });
//
//     document.getElementById('btnAdmin').addEventListener('click', () => {
//       adminController.mostrarPanelAdmin();
//     });
//
//     document.getElementById('btnCarrito').addEventListener('click', () => {
//       console.log('Cart button clicked');
//       app.carritoController.mostrarCarrito();
//     });
//
//     document.getElementById('closeCartModal').addEventListener('click', () => {
//       console.log('Cart button cerrar modal');
//       app.carritoController.ocultarModalCarrito();
//     });
//
//     document.getElementById('btnCheckout').addEventListener('click', () => {
//       app.carritoController.procederAlPago();
//     });
//
//     // document.getElementById('btnOpenModalDetails').addEventListener('click', () => {
//     //   adminController.openModalDetails();
//     // })
//
//     document.getElementById('btnCloseModalDetails').addEventListener('click', () => {
//       adminController.closeModalDetailsCat();
//       adminController.closeModalDetailsMar();
//     });
//
//     document.getElementById('btnCloseModalMarDetails').addEventListener('click', () => {
//       adminController.closeModalDetailsMar();
//     });
//
//     document.getElementById('btnCloseModalProdDetails').addEventListener('click', () => {
//       adminController.closeModalDetailsProd();
//     });
//
//     document.getElementById('btnCloseModalDetailsCliente').addEventListener('click', () => {
//       adminController.closeModalDetailsCli();
//     });
//
//     document.getElementById('btnCloseModalDetailsProveedor').addEventListener('click', () => {
//       adminController.closeModalDetailsProveedor();
//     });
//
//
//
//     // Load store components after event listeners
//     await app.tiendaController.cargarProductos();
//     await app.tiendaController.cargarFiltros();
//
//     // Actualizar el contador del carrito al iniciar la aplicación
//     app.tiendaController.actualizarContadorCarrito();
//
//   } catch (error) {
//     console.error('Initialization error:', error);
//   }
// });

// FrontEnd/public/ui/ui.js
import { app } from './AppFactory.js';
import { appService } from './services/UшымтаService.js';
import { adminController } from './controllers/AdminController.js';

// --- Constantes para localStorage y Admin ---
const ADMIN_STORAGE_KEY = 'lunaireAdminUser';
const CLIENT_STORAGE_KEY = 'lunaireClientUser';
const encryptedPhoneNumber = 'KzU5MyA5OSA5OTkgOTk5OQ==';
const ADMIN_PHONE_NUMBER = atob(encryptedPhoneNumber);

// --- Variables Globales para Elementos UI ---
let loginModal, loginIdentifierInput, loginErrorMsg, btnSkipLogin, closetModalAuthBtn;
let btnAdmin, btnTienda, btnCarrito;

/**
 * Intenta obtener y parsear el estado del admin desde localStorage.
 * Devuelve el objeto de admin o null si no es válido o no existe.
 */
function getAdminStatus() {
  try {
    const adminData = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!adminData) return null;

    const parsedData = JSON.parse(adminData);
    // Verifica que tenga las propiedades esperadas
    if (parsedData && parsedData.isAdmin === true && parsedData.phone === ADMIN_PHONE_NUMBER) {
      return parsedData;
    }
    // Si la data está corrupta o no coincide, la limpiamos para el próximo intento
    console.warn("Datos de admin en localStorage corruptos o inválidos. Limpiando.");
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    return null;
  } catch (error) {
    console.error('Error al leer/parsear estado admin de localStorage:', error);
    try {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    } catch (removeError) {
       console.error('Error limpiando localStorage corrupto (Admin):', removeError);
    }
    return null;
  }
}

/**
 * Comprueba si el usuario ha indicado que es cliente en localStorage.
 * Devuelve true si la clave existe y es 'true', false en caso contrario.
 */
function isClientConfirmed() {
  try {
    return localStorage.getItem(CLIENT_STORAGE_KEY) === 'true';
  } catch (error) {
    console.error('Error al leer estado cliente desde localStorage:', error);
    return false; // Asumir que no si hay error
  }
}

/** Muestra el modal de login */
function showLoginModal() {
  if (!loginModal) return;
  loginIdentifierInput.value = '';
  loginErrorMsg.style.display = 'none';
  loginModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => loginModal.classList.add('show'));
}

/** Oculta el modal de login */
function hideLoginModal() {
  if (!loginModal) return;
  loginModal.classList.remove('show');
  document.body.classList.remove('modal-open');
  setTimeout(() => {
    loginModal.classList.add('hidden');
  }, 300);
}

/** Configura la UI para el Admin */
function setupAdminUI() {
  console.log('Configurando UI para Admin');
  if (btnAdmin) btnAdmin.style.display = '';
  if (btnTienda) btnTienda.style.display = '';
  if (btnCarrito) btnCarrito.style.display = '';

  if (btnAdmin) {
    btnAdmin.removeEventListener('click', handleAdminButtonClick);
    btnAdmin.addEventListener('click', handleAdminButtonClick);
  }

  addCommonListeners();
  addAdminSpecificListeners();
}

/** Configura la UI para el Cliente */
function setupClientUI() {
  console.log('Configurando UI para Cliente');
  if (btnAdmin) btnAdmin.style.display = 'none';
  if (btnTienda) btnTienda.style.display = '';
  if (btnCarrito) btnCarrito.style.display = '';

  addCommonListeners();
  // No añadir listeners de admin
}

// --- Handlers de Navegación y Acciones ---
function handleAdminButtonClick() {
  adminController.mostrarPanelAdmin();
}

async function handleTiendaClick() {
  await app.tiendaController.mostrarTienda();
}
function handleCarritoClick() {
  app.carritoController.mostrarCarrito();
}
function handleCloseCartModal() {
   app.carritoController.ocultarModalCarrito();
}
function handleCheckoutClick() {
  app.carritoController.procederAlPago();
}

/** Lógica común para proceder como cliente */
function proceedAsClient(showWelcomeAlert = true) {
  if (showWelcomeAlert) {
    alert("Bienvenida a Lunaire");
  }
  try {
    localStorage.setItem(CLIENT_STORAGE_KEY, 'true'); // Marcar como cliente
    localStorage.removeItem(ADMIN_STORAGE_KEY); // Limpiar flag admin por si acaso
    hideLoginModal();
    setupClientUI();
    loadInitialComponents(); // Cargar componentes después de configurar UI
  } catch (error) {
    console.error('Error al guardar estado cliente o limpiar admin:', error);
    alert('Ocurrió un error al continuar. Por favor, recarga la página.');
  }
}

/** Handler para el botón 'Saltar' */
function handleSkipLogin() {
  console.log("Botón Saltar presionado.");
  proceedAsClient(true); // Muestra el alert de bienvenida
}

/** Handler para el botón 'X' (closetModalAuth) */
function handleCloseAuthClick() {
  const identifier = loginIdentifierInput.value.trim();
  loginErrorMsg.style.display = 'none'; // Siempre ocultar error al intentar

  if (identifier === ADMIN_PHONE_NUMBER) {
    // --- Es el Admin ---
    console.log("Identificador coincide: Procesando como Admin vía 'X'.");
    const adminData = { isAdmin: true, phone: ADMIN_PHONE_NUMBER };
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminData));
      localStorage.removeItem(CLIENT_STORAGE_KEY); // Limpiar flag cliente
      hideLoginModal();
      setupAdminUI();
      loadInitialComponents(); // Cargar componentes después de configurar UI
      // Podrías mostrar un mensaje sutil de bienvenida admin si quisieras
      // console.log("Acceso Admin concedido.");
    } catch (error) {
      console.error("Error guardando estado Admin (vía X):", error);
      loginErrorMsg.textContent = 'Error interno al guardar sesión admin.';
      loginErrorMsg.style.display = 'block';
       // No cerramos el modal si falla el guardado
    }
  } else {
    // --- No es el Admin (o campo vacío) ---
    console.log("Identificador NO coincide: Procesando como Cliente vía 'X'.");
    proceedAsClient(true); // Tratar como cliente y mostrar bienvenida
  }
}


/** Añade listeners comunes a Tienda y Carrito */
function addCommonListeners() {
   if (btnTienda) {
     btnTienda.removeEventListener('click', handleTiendaClick);
     btnTienda.addEventListener('click', handleTiendaClick);
   }
   if (btnCarrito) {
     btnCarrito.removeEventListener('click', handleCarritoClick);
     btnCarrito.addEventListener('click', handleCarritoClick);
   }
   const closeCartModalBtn = document.getElementById('closeCartModal');
   if (closeCartModalBtn) {
     closeCartModalBtn.removeEventListener('click', handleCloseCartModal);
     closeCartModalBtn.addEventListener('click', handleCloseCartModal);
   }
   const btnCheckoutFromCart = document.getElementById('btnCheckout');
   if (btnCheckoutFromCart) {
     btnCheckoutFromCart.removeEventListener('click', handleCheckoutClick);
     btnCheckoutFromCart.addEventListener('click', handleCheckoutClick);
   }
}

/** Añade listeners específicos para los modales del panel de Admin */
function addAdminSpecificListeners() {
    const modalClosers = [
        { id: 'btnCloseModalDetails', action: () => adminController.closeModalDetailsCat() },
        { id: 'btnCloseModalMarDetails', action: () => adminController.closeModalDetailsMar() },
        { id: 'btnCloseModalProdDetails', action: () => adminController.closeModalDetailsProd() },
        { id: 'btnCloseModalDetailsCliente', action: () => adminController.closeModalDetailsCli() },
        { id: 'btnCloseModalDetailsProveedor', action: () => adminController.closeModalDetailsProveedor() },
        { id: 'btnCloseInvoice', action: () => adminController.cerrarFactura() },
        { id: 'btnCloseModalDetailsHistorial', action: () => adminController.cerrarDetallesFactura() }
    ];

    modalClosers.forEach(closer => {
        const btn = document.getElementById(closer.id);
        if (btn) {
             // Podríamos guardar referencias a los listeners si necesitáramos removerlos,
             // pero para botones de cerrar modales, generalmente no es crítico.
             btn.addEventListener('click', closer.action);
        } else {
             console.warn(`Botón cerrar modal admin con ID "${closer.id}" no encontrado.`);
        }
    });
     // Aquí irían otros listeners específicos del panel admin si los hubiera
     // (ej. confirmar checkout si es solo admin, etc.)
}

/** Función para cargar componentes iniciales visibles */
async function loadInitialComponents() {
    console.log("Cargando componentes iniciales...");
    try {
      await app.tiendaController.cargarProductos();
      await app.tiendaController.cargarFiltros();
      app.tiendaController.actualizarContadorCarrito();
       console.log("Componentes iniciales cargados.");
    } catch(error) {
         console.error("Error cargando componentes iniciales:", error);
         // Podría mostrar un mensaje de error al usuario aquí
    }
}


// --- Punto de Entrada Principal ---
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM listo.');

  // Obtener referencias a elementos UI globales
  loginModal = document.getElementById('loginModal');
  loginIdentifierInput = document.getElementById('loginIdentifierInput');
  loginErrorMsg = document.getElementById('loginErrorMsg');
  btnSkipLogin = document.getElementById('btnSkipLogin');
  closetModalAuthBtn = document.getElementById('closetModalAuth'); // El botón 'X'
  btnAdmin = document.getElementById('btnAdmin');
  btnTienda = document.getElementById('btnTienda');
  btnCarrito = document.getElementById('btnCarrito');

  // Asegurarse de que los botones de nav están ocultos al inicio
  if (btnAdmin) btnAdmin.style.display = 'none';
  if (btnTienda) btnTienda.style.display = 'none';
  if (btnCarrito) btnCarrito.style.display = 'none';

  // Validar que los elementos del modal existan antes de continuar
   if (!loginModal || !loginIdentifierInput || !loginErrorMsg || !btnSkipLogin || !closetModalAuthBtn) {
       console.error("¡Error crítico: Faltan elementos esenciales del modal de login en el DOM! Revisar HTML.");
        // Podríamos intentar mostrar una UI mínima de cliente como fallback
        setupClientUI(); // Mostrar botones cliente como mínimo
        await loadInitialComponents(); // Intentar cargar tienda
       return; // Detener ejecución si el modal es inutilizable
   }

  try {
    // Inicializar servicios (IndexedDB, etc.)
    await appService.init();
    console.log('App Service OK.');

    // Determinar el estado del usuario desde localStorage
    const adminStatus = getAdminStatus();
    const clientConfirmed = isClientConfirmed();

    if (adminStatus) {
      // Ya es Admin
      console.log('Usuario es Admin (localStorage).');
      setupAdminUI();
      await loadInitialComponents();
    } else if (clientConfirmed) {
      // Ya es Cliente confirmado
      console.log('Usuario es Cliente (localStorage).');
      setupClientUI();
      await loadInitialComponents();
    } else {
      // Nadie confirmado -> Mostrar Modal
      console.log('Requiere identificación. Mostrando modal.');
      // Añadir listeners a los botones del modal AHORA
      btnSkipLogin.removeEventListener('click', handleSkipLogin);
      btnSkipLogin.addEventListener('click', handleSkipLogin);

      closetModalAuthBtn.removeEventListener('click', handleCloseAuthClick);
      closetModalAuthBtn.addEventListener('click', handleCloseAuthClick);

      showLoginModal();
      // Los componentes se cargarán DESPUÉS de interactuar con el modal
    }

  } catch (error) {
    console.error('Error en inicialización principal:', error);
    document.body.innerHTML = `<p style="color: red; text-align: center; margin-top: 50px; font-family: sans-serif;">Error fatal al cargar la aplicación (${error.message}). Intenta recargar.</p>`;
  }
});