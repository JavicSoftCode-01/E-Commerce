// // FrontEnd/public/ui/controllers/CheckoutController.js
// import {Cliente} from '../../../../BackEnd/src/models/Cliente.js';
//
// import {app} from '../AppFactory.js';
// import {InvoiceTemplate} from './InvoicePlantilla.js';
// import {Validar} from '../../../../BackEnd/src/utils/validar.js';
//
// class CheckoutController {
//   constructor(facturaService, clienteService) {
//     this.facturaService = facturaService;
//     this.clienteService = clienteService;
//
//     this.checkoutSection = document.getElementById('checkoutSection');
//     this.checkoutCartTable = document.getElementById('checkoutCartTable');
//     this.checkoutTotal = document.getElementById('checkoutTotal');
//     this.btnCancelCheckout = document.getElementById('btnCancelCheckout');
//     this.btnConfirmCheckout = document.getElementById('btnConfirmCheckout');
//     this.invoiceSection = document.getElementById('invoiceSection');
//     this.invoiceDetails = document.getElementById('invoiceDetails');
//     this.btnCloseInvoice = document.getElementById('btnCloseInvoice');
//     this.btnCloseCheckoutModal = document.getElementById('closeCheckoutModal');
//     this.setupEventListeners();
//   }
//
//   cargarResumenPedido() {
//     const tbody = this.checkoutCartTable.querySelector('tbody');
//     tbody.innerHTML = '';
//     const cartItems = app.carritoController.carrito.items;
//     let subtotal = 0;
//
//     cartItems.forEach(item => {
//       const tr = document.createElement('tr');
//       tr.innerHTML = `
//         <td class="text-center"><img src="${item.imagen}" alt="${item.nombre}" style="width:60px; height:70px;  border-radius:2px"></td>
//         <td class="text-center">${item.nombre}</td>
//         <td class="text-center">${item.cantidad}</td>
//         <td class="text-center">$${item.precio.toFixed(2)}</td>
//         <td class="text-center">$${(item.precio * item.cantidad).toFixed(2)}</td>
//       `;
//       tbody.appendChild(tr);
//       subtotal += item.precio * item.cantidad;
//     });
//
//     document.getElementById('checkoutSubtotalValue').textContent = `$${subtotal.toFixed(2)}`;
//     const shipping = 0;
//     document.getElementById('checkoutShippingValue').textContent = `$${shipping.toFixed(2)}`;
//     document.getElementById('checkoutTotal').textContent = `$${(subtotal + shipping).toFixed(2)}`;
//   }
//
//   setupEventListeners() {
//     this.btnCancelCheckout.addEventListener('click', () => {
//       this.ocultarCheckoutModal();
//       app.carritoController.mostrarCarrito();
//     });
//     document.getElementById('closeCheckoutModal').addEventListener('click', () => {
//       this.ocultarCheckoutModal();
//     });
//     this.btnCloseInvoice.addEventListener('click', () => {
//       this.cerrarFactura();
//       if (document.getElementById('admin').classList.contains('show')) {
//         document.getElementById('admin').classList.remove('hidden');
//       }
//     });
//     this.btnConfirmCheckout.addEventListener('click', () => this.confirmarCompra());
//   }
//
//   async mostrarCheckoutModal() {
//     const modal = document.getElementById('checkoutOverlay');
//     const facturaInfo = await InvoiceTemplate.generarNumeroFactura();
//     this.facturaTemp = {
//       numeroFactura: facturaInfo.numero,
//       fecha: facturaInfo.fecha,
//       hora: facturaInfo.hora
//     };
//
//     document.getElementById('invoiceNumber').textContent = this.facturaTemp.numeroFactura;
//     document.getElementById('currentDate').textContent = this.facturaTemp.fecha.toLocaleDateString();
//     document.getElementById('currentTime').textContent = this.facturaTemp.hora;
//
//     modal.classList.remove('hidden');
//     document.body.classList.add('modal-open');
//     this.cargarResumenPedido();
//     requestAnimationFrame(() => modal.classList.add('show'));
//   }
//
//   ocultarCheckoutModal() {
//     const modal = document.getElementById('checkoutOverlay');
//     modal.classList.remove('show');
//     document.body.classList.remove('modal-open');
//     setTimeout(() => modal.classList.add('hidden'), 300);
//   }
//
//   limpiarFormularioCliente() {
//     document.getElementById('checkoutNombre').value = '';
//     document.getElementById('checkoutTelefono').value = '';
//     document.getElementById('checkoutDireccion').value = '';
//   }
//
//   // async confirmarCompra() {
//   //   try {
//   //     const nombre = document.getElementById('checkoutNombre').value;
//   //     const telefono = document.getElementById('checkoutTelefono').value;
//   //     const direccion = document.getElementById('checkoutDireccion').value;
//   //
//   //     const nombreValidado = Validar.nombreBP(nombre);
//   //     if (!nombreValidado) {
//   //       alert('El nombre ingresado no es válido. Debe tener entre 3 y 70 caracteres y solo contener letras, números y caracteres básicos.');
//   //       return;
//   //     }
//   //
//   //     const telefonoValidado = await Validar.telefonoBP(telefono, this.clienteService);
//   //     if (!telefonoValidado) {
//   //       alert('El teléfono ingresado no es válido. Ingrese un número válido de Ecuador.');
//   //       return;
//   //     }
//   //
//   //     const direccionValidada = Validar.direccionBP(direccion);
//   //     if (!direccionValidada) {
//   //       alert('La dirección ingresada no es válida. Debe tener entre 3 y 256 caracteres.');
//   //       return;
//   //     }
//   //
//   //     const carrito = app.carritoController.carrito;
//   //     const stockSuficiente = await this.validarStockCarrito(carrito);
//   //     if (!stockSuficiente) {
//   //       return;
//   //     }
//   //
//   //     this.btnConfirmCheckout.disabled = true;
//   //     this.btnConfirmCheckout.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
//   //
//   //     // Verificar si el cliente ya existe por teléfono
//   //     let cliente = await this.clienteService.obtenerClientePorTelefono(telefonoValidado);
//   //     if (cliente) {
//   //       // Cliente existente: actualizar datos si cambiaron y aumentar contador
//   //       if (cliente.nombre !== nombreValidado || cliente.direccion !== direccionValidada) {
//   //         await this.clienteService.actualizarCliente(cliente.id, {
//   //           nombre: nombreValidado,
//   //           telefono: telefonoValidado,
//   //           direccion: direccionValidada
//   //         });
//   //         cliente = await this.clienteService.obtenerClientePorId(cliente.id); // Refrescar datos
//   //       }
//   //       await this.clienteService.incrementarContadorCliente(cliente.id);
//   //     } else {
//   //       // Cliente nuevo: crear con contador en 1
//   //       const clienteData = new Cliente(nombreValidado, telefonoValidado, direccionValidada);
//   //       cliente = await this.clienteService.agregarCliente(clienteData);
//   //       if (!cliente) {
//   //         throw new Error('No se pudo registrar el cliente.');
//   //       }
//   //       await this.clienteService.incrementarContadorCliente(cliente.id); // Primera compra
//   //     }
//   //
//   //     const factura = await this.facturaService.generarFactura(cliente, carrito, this.facturaTemp);
//   //     this.facturaTemp = null;
//   //
//   //     this.ocultarCheckoutModal();
//   //     await this.mostrarFactura(factura);
//   //
//   //     carrito.vaciarCarrito();
//   //     app.tiendaController.actualizarContadorCarrito();
//   //     this.limpiarFormularioCliente();
//   //   } catch (error) {
//   //     console.error('Error durante el checkout:', error);
//   //     alert(`Error al confirmar la compra: ${error.message}`);
//   //   } finally {
//   //     this.btnConfirmCheckout.disabled = false;
//   //     this.btnConfirmCheckout.innerHTML = 'Confirmar <i class="fas fa-check-circle fa-lg"></i>';
//   //   }
//   // }
//   // async confirmarCompra() {
//   //   try {
//   //     const nombre = document.getElementById('checkoutNombre').value;
//   //     const telefono = document.getElementById('checkoutTelefono').value;
//   //     const direccion = document.getElementById('checkoutDireccion').value;
//   //
//   //     const nombreValidado = Validar.nombreBP(nombre);
//   //     if (!nombreValidado) {
//   //       alert('El nombre ingresado no es válido. Debe tener entre 3 y 70 caracteres y solo contener letras, números y caracteres básicos.');
//   //       return;
//   //     }
//   //
//   //     const telefonoValidado = await Validar.telefonoBP(telefono, this.clienteService);
//   //     if (!telefonoValidado) {
//   //       alert('El teléfono ingresado no es válido. Ingrese un número válido de Ecuador.');
//   //       return;
//   //     }
//   //
//   //     const direccionValidada = Validar.direccionBP(direccion);
//   //     if (!direccionValidada) {
//   //       alert('La dirección ingresada no es válida. Debe tener entre 3 y 256 caracteres.');
//   //       return;
//   //     }
//   //
//   //     const carrito = app.carritoController.carrito;
//   //     const stockSuficiente = await this.validarStockCarrito(carrito);
//   //     if (!stockSuficiente) {
//   //       return;
//   //     }
//   //
//   //     this.btnConfirmCheckout.disabled = true;
//   //     this.btnConfirmCheckout.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
//   //
//   //     // Verificar si el cliente ya existe por teléfono
//   //     let cliente = await this.clienteService.obtenerClientePorTelefono(telefonoValidado);
//   //
//   //     if (cliente) {
//   //       // Cliente existente: actualizar datos si cambiaron y aumentar contador
//   //       console.log(`Cliente existente encontrado con ID ${cliente.id}. Incrementando contador.`);
//   //
//   //       if (cliente.nombre !== nombreValidado || cliente.direccion !== direccionValidada) {
//   //         await this.clienteService.actualizarCliente(cliente.id, {
//   //           nombre: nombreValidado,
//   //           telefono: telefonoValidado,
//   //           direccion: direccionValidada
//   //         });
//   //         cliente = await this.clienteService.obtenerClientePorId(cliente.id); // Refrescar datos
//   //       }
//   //
//   //       // Incrementar contador para cliente existente
//   //       await this.clienteService.incrementarContadorCliente(cliente.id);
//   //     } else {
//   //       // Cliente nuevo: crear con contador en 1
//   //       console.log('Cliente nuevo. Creando registro...');
//   //
//   //       // En lugar de asignar contador=0 por defecto y luego incrementarlo,
//   //       // creamos directamente con contador=1 para la primera compra
//   //       const clienteData = new Cliente(
//   //         nombreValidado,
//   //         telefonoValidado,
//   //         direccionValidada,
//   //         'Activo',  // estado
//   //         null,      // fechaCreacion (se asignará en el constructor)
//   //         null,      // fechaActualizacion (se asignará en el constructor)
//   //         1          // Contador iniciando en 1 para primera compra
//   //       );
//   //
//   //       cliente = await this.clienteService.agregarCliente(clienteData);
//   //       if (!cliente) {
//   //         throw new Error('No se pudo registrar el cliente.');
//   //       }
//   //
//   //       // Ya no necesitamos incrementar el contador aquí, ya que iniciamos en 1
//   //       // await this.clienteService.incrementarContadorCliente(cliente.id); // <- eliminar esta línea
//   //     }
//   //
//   //     const factura = await this.facturaService.generarFactura(cliente, carrito, this.facturaTemp);
//   //     this.facturaTemp = null;
//   //
//   //     this.ocultarCheckoutModal();
//   //     await this.mostrarFactura(factura);
//   //
//   //     carrito.vaciarCarrito();
//   //     app.tiendaController.actualizarContadorCarrito();
//   //     this.limpiarFormularioCliente();
//   //   } catch (error) {
//   //     console.error('Error durante el checkout:', error);
//   //     alert(`Error al confirmar la compra: ${error.message}`);
//   //   } finally {
//   //     this.btnConfirmCheckout.disabled = false;
//   //     this.btnConfirmCheckout.innerHTML = 'Confirmar <i class="fas fa-check-circle fa-lg"></i>';
//   //   }
//   // }
//   async confirmarCompra() {
//     try {
//       const nombre = document.getElementById('checkoutNombre').value;
//       const telefono = document.getElementById('checkoutTelefono').value;
//       const direccion = document.getElementById('checkoutDireccion').value;
//
//       const nombreValidado = Validar.nombreBP(nombre);
//       if (!nombreValidado) {
//         alert('El nombre ingresado no es válido. Debe tener entre 3 y 70 caracteres y solo contener letras, números y caracteres básicos.');
//         return;
//       }
//
//       const telefonoValidado = await Validar.telefonoBP(telefono, this.clienteService);
//       if (!telefonoValidado) {
//         alert('El teléfono ingresado no es válido. Ingrese un número válido de Ecuador.');
//         return;
//       }
//
//       const direccionValidada = Validar.direccionBP(direccion);
//       if (!direccionValidada) {
//         alert('La dirección ingresada no es válida. Debe tener entre 3 y 256 caracteres.');
//         return;
//       }
//
//       const carrito = app.carritoController.carrito;
//       const stockSuficiente = await this.validarStockCarrito(carrito);
//       if (!stockSuficiente) {
//         return;
//       }
//
//       this.btnConfirmCheckout.disabled = true;
//       this.btnConfirmCheckout.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
//
//       // Force sync to ensure the latest data is available
//       await this.clienteService.forceSyncNow();
//
//       // Verificar si el cliente ya existe por teléfono
//       let cliente = await this.clienteService.obtenerClientePorTelefono(telefonoValidado);
//
//       if (cliente) {
//         // Cliente existente: actualizar datos si cambiaron y aumentar contador
//         console.log(`Cliente existente encontrado con ID ${cliente.id}. Incrementando contador.`);
//
//         if (cliente.nombre !== nombreValidado || cliente.direccion !== direccionValidada) {
//           await this.clienteService.actualizarCliente(cliente.id, {
//             nombre: nombreValidado,
//             telefono: telefonoValidado,
//             direccion: direccionValidada
//           });
//           cliente = await this.clienteService.obtenerClientePorId(cliente.id); // Refrescar datos
//         }
//
//         // Incrementar contador para cliente existente
//         await this.clienteService.incrementarContadorCliente(cliente.id);
//         cliente = await this.clienteService.obtenerClientePorId(cliente.id); // Refrescar datos después de incrementar
//       } else {
//         // Cliente nuevo: crear con contador en 1
//         console.log('Cliente nuevo. Creando registro...');
//
//         const clienteData = new Cliente(
//           nombreValidado,
//           telefonoValidado,
//           direccionValidada,
//           'Activo',  // estado
//           null,      // fechaCreacion (se asignará en el constructor)
//           null,      // fechaActualizacion (se asignará en el constructor)
//           1          // Contador iniciando en 1 para primera compra
//         );
//
//         cliente = await this.clienteService.agregarCliente(clienteData);
//         if (!cliente) {
//           throw new Error('No se pudo registrar el cliente.');
//         }
//       }
//
//       const factura = await this.facturaService.generarFactura(cliente, carrito, this.facturaTemp);
//       this.facturaTemp = null;
//
//       this.ocultarCheckoutModal();
//       await this.mostrarFactura(factura);
//
//       carrito.vaciarCarrito();
//       app.tiendaController.actualizarContadorCarrito();
//       this.limpiarFormularioCliente();
//     } catch (error) {
//       console.error('Error durante el checkout:', error);
//       alert(`Error al confirmar la compra: ${error.message}`);
//     } finally {
//       this.btnConfirmCheckout.disabled = false;
//       this.btnConfirmCheckout.innerHTML = 'Confirmar <i class="fas fa-check-circle fa-lg"></i>';
//     }
//   }
//
//   async validarStockCarrito(carrito) {
//     try {
//       for (const item of carrito.items) {
//         const producto = await app.productoService.obtenerProductoPorId(item.productoId);
//         if (!producto) {
//           alert(`El producto ${item.nombre} ya no está disponible.`);
//           return false;
//         }
//         if (producto.stock < item.cantidad) {
//           alert(`Stock insuficiente para ${item.nombre}. Stock disponible: ${producto.stock}`);
//           return false;
//         }
//       }
//       return true;
//     } catch (error) {
//       console.error('Error al validar stock:', error);
//       alert('Error al verificar disponibilidad de productos.');
//       return false;
//     }
//   }
//
//   async mostrarFactura(factura) {
//     try {
//       const invoiceModal = document.getElementById('invoiceModal');
//       const invoiceDetails = document.getElementById('invoiceDetails');
//       if (!invoiceModal || !invoiceDetails) {
//         throw new Error('Elementos del modal de factura no encontrados');
//       }
//       invoiceDetails.innerHTML = InvoiceTemplate.generarHTML(factura, false);
//       invoiceModal.classList.remove('hidden');
//       requestAnimationFrame(() => {
//         invoiceModal.classList.add('show');
//         document.body.classList.add('modal-open');
//       });
//     } catch (error) {
//       console.error('Error al mostrar la factura:', error);
//       alert('Error al mostrar la factura: ' + error.message);
//     }
//   }
//
//   cerrarFactura() {
//     const invoiceModal = document.getElementById('invoiceModal');
//     invoiceModal.classList.remove('show');
//     document.body.classList.remove('modal-open');
//     setTimeout(() => invoiceModal.classList.add('hidden'), 300);
//   }
// }
//

// export {CheckoutController};
// FrontEnd/public/ui/controllers/CheckoutController.js
import { Cliente } from '../../../../BackEnd/src/models/Cliente.js'; // Adjust path
import { app } from '../AppFactory.js'; // Adjust path
import { InvoiceTemplate } from './InvoicePlantilla.js'; // Adjust path
import { Validar } from '../../../../BackEnd/src/utils/validar.js'; // Adjust path
// Optionally import normalizePhoneNumber if you need it directly here,
// but preferably let the service handle it internally.
// import { normalizePhoneNumber } from '../services/ClienteService.js';


class CheckoutController {
    constructor(facturaService, clienteService) {
        this.facturaService = facturaService;
        this.clienteService = clienteService;

        // DOM Elements
        this.checkoutSection = document.getElementById('checkoutSection');
        this.checkoutCartTable = document.getElementById('checkoutCartTable');
        this.checkoutTotal = document.getElementById('checkoutTotal');
        this.btnCancelCheckout = document.getElementById('btnCancelCheckout');
        this.btnConfirmCheckout = document.getElementById('btnConfirmCheckout');
        this.invoiceSection = document.getElementById('invoiceSection'); // Assuming invoice is shown here
        this.invoiceDetails = document.getElementById('invoiceDetails');
        this.btnCloseInvoice = document.getElementById('btnCloseInvoice');
        this.btnCloseCheckoutModal = document.getElementById('closeCheckoutModal');
        this.checkoutNombreInput = document.getElementById('checkoutNombre');
        this.checkoutTelefonoInput = document.getElementById('checkoutTelefono');
        this.checkoutDireccionInput = document.getElementById('checkoutDireccion');
        this.checkoutOverlay = document.getElementById('checkoutOverlay');
        this.invoiceModal = document.getElementById('invoiceModal');


        // State
        this.isProcessing = false; // Prevent concurrent checkouts
        this.facturaTemp = null; // Holds temporary invoice number/date

        this.setupEventListeners();
         console.log("CheckoutController Initialized");
    }

    cargarResumenPedido() {
        console.log("[CHECKOUT] Loading order summary.");
        const tbody = this.checkoutCartTable.querySelector('tbody');
        if (!tbody) {
           console.error("Checkout cart table body not found!");
           return;
        }
        tbody.innerHTML = '';
        const cartItems = app.carritoController.carrito.items;
        let subtotal = 0;

        if (cartItems.length === 0) {
            console.warn("[CHECKOUT] Cart is empty, cannot load summary.");
            // Optionally display a message in the table
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">El carrito está vacío.</td></tr>';
             document.getElementById('checkoutSubtotalValue').textContent = '$0.00';
             document.getElementById('checkoutShippingValue').textContent = '$0.00';
             document.getElementById('checkoutTotal').textContent = '$0.00';
            return;
        }

        cartItems.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="text-center align-middle"><img src="${item.imagen}" alt="${item.nombre}" style="width:60px; height:70px; border-radius:2px; object-fit: cover;"></td>
                <td class="text-center align-middle">${item.nombre}</td>
                <td class="text-center align-middle">${item.cantidad}</td>
                <td class="text-center align-middle">$${item.precio.toFixed(2)}</td>
                <td class="text-center align-middle">$${(item.precio * item.cantidad).toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
            subtotal += item.precio * item.cantidad;
        });

        // Assuming fixed shipping or getting it from elsewhere
        const shipping = 0;
        document.getElementById('checkoutSubtotalValue').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('checkoutShippingValue').textContent = `$${shipping.toFixed(2)}`; // Display shipping even if 0
        this.checkoutTotal.textContent = `$${(subtotal + shipping).toFixed(2)}`;
    }

    setupEventListeners() {
        console.log("[CHECKOUT] Setting up event listeners.");
        if(this.btnCancelCheckout) this.btnCancelCheckout.addEventListener('click', () => {
            this.ocultarCheckoutModal();
            app.carritoController.mostrarCarrito(); // Show cart sidebar again
        });

        if(this.btnCloseCheckoutModal) this.btnCloseCheckoutModal.addEventListener('click', () => {
            this.ocultarCheckoutModal();
        });

        if(this.btnCloseInvoice) this.btnCloseInvoice.addEventListener('click', () => {
            this.cerrarFactura();
             // If admin section exists and is relevant here
             const adminSection = document.getElementById('admin');
              if (adminSection && adminSection.classList.contains('show')) {
                 adminSection.classList.remove('hidden'); // Or manage visibility as needed
             }
        });

         if(this.btnConfirmCheckout) {
           this.btnConfirmCheckout.addEventListener('click', () => this.confirmarCompra());
         } else {
           console.error("Confirm Checkout button not found!");
         }
    }

    async mostrarCheckoutModal() {
         if (app.carritoController.carrito.items.length === 0) {
           console.warn("[CHECKOUT] Cannot open checkout modal: Cart is empty.");
           alert("Su carrito está vacío. Agregue productos antes de proceder al pago.");
           return;
         }

        console.log("[CHECKOUT] Showing checkout modal.");
        if (!this.checkoutOverlay) {
          console.error("Checkout modal overlay not found!");
          return;
        }

        try {
             const facturaInfo = await InvoiceTemplate.generarNumeroFactura(); // Ensure this is async if needed
             this.facturaTemp = {
                 numeroFactura: facturaInfo.numero,
                 fecha: facturaInfo.fecha, // Should be Date object
                 hora: facturaInfo.hora // Should be string HH:MM:SS
             };
              console.log("[CHECKOUT] Generated temp invoice info:", this.facturaTemp);

              // Populate invoice number/date/time in the modal
             document.getElementById('invoiceNumber').textContent = this.facturaTemp.numeroFactura;
              document.getElementById('currentDate').textContent = this.facturaTemp.fecha.toLocaleDateString(); // Format date
              document.getElementById('currentTime').textContent = this.facturaTemp.hora; // Use formatted time


             this.cargarResumenPedido(); // Load cart summary into modal table
              this.limpiarFormularioCliente(); // Clear previous customer info

              // Show modal using CSS transitions
              this.checkoutOverlay.classList.remove('hidden');
              document.body.classList.add('modal-open'); // Prevent body scrolling
              // Use rAF to ensure the 'hidden' removal is rendered before adding 'show' for transition
              requestAnimationFrame(() => {
                  this.checkoutOverlay.classList.add('show');
              });

        } catch (error) {
           console.error("[CHECKOUT] Error preparing checkout modal:", error);
            alert("Error al preparar el checkout. Por favor, intente de nuevo.");
        }
    }

    ocultarCheckoutModal() {
        console.log("[CHECKOUT] Hiding checkout modal.");
         if (!this.checkoutOverlay) return;

         this.checkoutOverlay.classList.remove('show');
         document.body.classList.remove('modal-open');
         // Wait for transition to finish before adding 'hidden' for display: none
         setTimeout(() => {
            this.checkoutOverlay.classList.add('hidden');
         }, 300); // Match transition duration
    }

    limpiarFormularioCliente() {
        console.log("[CHECKOUT] Clearing customer form.");
        if (this.checkoutNombreInput) this.checkoutNombreInput.value = '';
        if (this.checkoutTelefonoInput) this.checkoutTelefonoInput.value = '';
        if (this.checkoutDireccionInput) this.checkoutDireccionInput.value = '';
         // Clear any previous validation states if applicable
    }

    async confirmarCompra() {
        if (this.isProcessing) {
            console.warn('[CHECKOUT][CONFIRM] Purchase already in progress.');
            alert('Por favor, espere. Se está procesando la compra actual.');
            return;
        }

        console.log('[CHECKOUT][CONFIRM] Starting purchase confirmation process...');
        this.isProcessing = true;
        this.btnConfirmCheckout.disabled = true;
        this.btnConfirmCheckout.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

        let clienteFinalParaFactura = null; // Holds the client object used for invoice generation

        try {
            // --- 1. Get & Validate Form Inputs ---
            const nombreInput = this.checkoutNombreInput.value;
            const telefonoInput = this.checkoutTelefonoInput.value;
            const direccionInput = this.checkoutDireccionInput.value;

            const nombreValidado = Validar.nombreBP(nombreInput);
            if (!nombreValidado) {
                 alert('El nombre ingresado no es válido.');
                 throw new Error("Nombre inválido");
            }

             // Basic format check ONLY here. Uniqueness check is done by service.
             // We use the *raw* input for lookup; service normalizes.
             if (!Validar.telefonoBP(telefonoInput)) { // Assuming telefonoBP is just format
                 alert('El número de teléfono ingresado no parece válido.');
                 throw new Error("Teléfono inválido (formato)");
             }

            const direccionValidada = Validar.direccionBP(direccionInput);
            if (!direccionValidada) {
                 alert('La dirección ingresada no es válida.');
                 throw new Error("Dirección inválida");
            }
            console.log("[CHECKOUT][CONFIRM] Inputs validated:", { nombre: nombreValidado, telefono: telefonoInput, direccion: direccionValidada });


             // --- 2. Validate Stock ---
             console.log("[CHECKOUT][CONFIRM] Validating cart stock...");
             const carrito = app.carritoController.carrito;
             const stockSuficiente = await this.validarStockCarrito(carrito);
             if (!stockSuficiente) {
                 // Alert shown within validarStockCarrito
                 throw new Error("Stock insuficiente");
             }
             console.log("[CHECKOUT][CONFIRM] Stock validation passed.");


            // --- 3. Force Sync & Find/Create Customer ---
             console.log("[CHECKOUT][CONFIRM] Forcing client data sync...");
             await this.clienteService.forceSyncNow(); // Ensure we have latest client data

            console.log(`[CHECKOUT][CONFIRM] Searching for client with phone (raw): "${telefonoInput}"`);
             let cliente = await this.clienteService.obtenerClientePorTelefono(telefonoInput); // Service handles normalization for lookup


             if (cliente) {
                  // --- 4a. EXISTING CUSTOMER ---
                  console.log(`[CHECKOUT][CONFIRM] Existing client found (ID: ${cliente.id}). Checking for updates & incrementing counter.`);

                   // Check if name or address from form differs from stored (normalized) data
                   let needsUpdate = false;
                   const updateData = {};
                   // Compare form input directly with stored value
                   if (nombreValidado !== cliente.nombre) {
                       updateData.nombre = nombreValidado;
                       needsUpdate = true;
                   }
                   if (direccionValidada !== cliente.direccion) {
                        updateData.direccion = direccionValidada;
                        needsUpdate = true;
                   }
                   // IMPORTANT: Do NOT attempt to update phone number automatically here based on input.
                   // Phone is the identifier. If it needs changing, it's a separate admin task.

                   if (needsUpdate) {
                        console.log(`[CHECKOUT][CONFIRM] Updating existing client ID ${cliente.id} with data:`, updateData);
                        const clienteActualizado = await this.clienteService.actualizarCliente(cliente.id, updateData);
                         if (!clienteActualizado) {
                              // Alert potentially shown in service, or throw generic error
                              throw new Error('Error al actualizar los datos del cliente.');
                         }
                         cliente = clienteActualizado; // Use updated data for counter increment
                         console.log(`[CHECKOUT][CONFIRM] Client ID ${cliente.id} updated successfully.`);
                   } else {
                        console.log(`[CHECKOUT][CONFIRM] No data changes needed for existing client ID ${cliente.id}.`);
                   }

                    // Increment counter for the existing client
                    console.log(`[CHECKOUT][CONFIRM] Incrementing counter for client ID ${cliente.id}`);
                    const clienteConContadorInc = await this.clienteService.incrementarContadorCliente(cliente.id);
                    if (!clienteConContadorInc) {
                        // Log error, but potentially proceed if critical failure didn't occur
                        console.error(`[CHECKOUT][CONFIRM] Failed to increment counter for client ID ${cliente.id}, but proceeding.`);
                        // Use the 'cliente' object we have, even without confirmed counter sync
                         clienteFinalParaFactura = cliente; // Assign existing client data
                    } else {
                        clienteFinalParaFactura = clienteConContadorInc; // Use the latest state after increment
                         console.log(`[CHECKOUT][CONFIRM] Counter incremented successfully for client ID ${clienteFinalParaFactura.id}. New count: ${clienteFinalParaFactura.contador}`);
                    }

             } else {
                  // --- 4b. NEW CUSTOMER ---
                  console.log(`[CHECKOUT][CONFIRM] No existing client found for phone "${telefonoInput}". Creating new client.`);

                    // Create client data object, pass raw phone - service normalizes
                    // Initialize counter to 1 for the first purchase
                    const nuevoClienteData = {
                        nombre: nombreValidado,
                        telefono: telefonoInput, // Pass raw, service normalizes
                        direccion: direccionValidada,
                        estado: 'Activo',
                        contador: 1
                    };

                   const clienteCreado = await this.clienteService.agregarCliente(nuevoClienteData);
                   if (!clienteCreado) {
                        // Alert likely shown in service (e.g., duplicate check failed unexpectedly)
                       throw new Error('No se pudo registrar al nuevo cliente. Revise los datos o intente más tarde.');
                   }
                   console.log(`[CHECKOUT][CONFIRM] New client created successfully (ID: ${clienteCreado.id}).`);
                   clienteFinalParaFactura = clienteCreado; // Use the newly created client for the invoice
             }


             // --- 5. Generate Invoice ---
             if (!clienteFinalParaFactura || !clienteFinalParaFactura.id) {
                 console.error("[CHECKOUT][CONFIRM] Critical error: Client object is invalid before generating invoice.", clienteFinalParaFactura);
                 throw new Error('Error inesperado al obtener los datos del cliente para la factura.');
             }
              if (!this.facturaTemp) {
                 console.error("[CHECKOUT][CONFIRM] Critical error: Temp invoice data missing.");
                 throw new Error('Error inesperado: Faltan datos de la pre-factura.');
              }

              console.log(`[CHECKOUT][CONFIRM] Generating invoice for client ID ${clienteFinalParaFactura.id} with temp details:`, this.facturaTemp);
              const factura = await this.facturaService.generarFactura(clienteFinalParaFactura, carrito, this.facturaTemp);
              console.log("[CHECKOUT][CONFIRM] Invoice generated successfully:", factura); // Log generated invoice data if needed
              this.facturaTemp = null; // Clear temporary data


             // --- 6. Post-Purchase Actions ---
              this.ocultarCheckoutModal();
              await this.mostrarFactura(factura); // Show the final invoice modal

              console.log("[CHECKOUT][CONFIRM] Clearing cart and form...");
              carrito.vaciarCarrito();
              app.tiendaController.actualizarContadorCarrito(); // Update cart icon in header
              this.limpiarFormularioCliente(); // Already called in mostrar, but good to ensure here too? Maybe not needed.

               console.log('[CHECKOUT][CONFIRM] Purchase completed successfully!');

        } catch (error) {
            console.error('[CHECKOUT][CONFIRM] Error during purchase confirmation:', error);
             // Only show generic alert if specific alerts weren't potentially shown by service/validation
             if (!error.message.includes("Stock insuficiente") && !error.message.includes("válido") && !error.message.includes("Error al actualizar") && !error.message.includes("No se pudo registrar") ) {
               alert(`Ocurrió un error al procesar su compra: ${error.message}. Por favor, intente de nuevo.`);
             }

        } finally {
            // --- 7. Cleanup / Reset UI State ---
            this.isProcessing = false;
            this.btnConfirmCheckout.disabled = false;
            this.btnConfirmCheckout.innerHTML = 'Confirmar <i class="fas fa-check-circle fa-lg"></i>';
             console.log('[CHECKOUT][CONFIRM] Purchase processing finished (finally block).');
        }
    }


    async validarStockCarrito(carrito) {
       console.log("[VALIDATION][STOCK] Validating stock for cart items...");
       try {
         for (const item of carrito.items) {
             console.log(`[VALIDATION][STOCK] Checking product ID ${item.productoId} (${item.nombre}), need ${item.cantidad}`);
             // Assume product service caches or efficiently fetches product data
             const producto = await app.productoService.obtenerProductoPorId(item.productoId);
             if (!producto) {
                 console.error(`[VALIDATION][STOCK] Product ID ${item.productoId} (${item.nombre}) not found.`);
                 alert(`El producto ${item.nombre} ya no está disponible en nuestra tienda.`);
                 return false;
             }
              console.log(`[VALIDATION][STOCK] Product ID ${item.productoId} found. Stock: ${producto.stock}`);
             if (producto.stock < item.cantidad) {
                 console.error(`[VALIDATION][STOCK] Insufficient stock for ${item.nombre}. Needed: ${item.cantidad}, Available: ${producto.stock}`);
                 alert(`Stock insuficiente para "${item.nombre}". Solo quedan ${producto.stock} unidades disponibles.`);
                 // Optional: Update cart item quantity to max available? Or just block checkout?
                  // Example: item.cantidad = producto.stock; // (Would need to update display)
                 return false; // Block checkout
             }
         }
         console.log("[VALIDATION][STOCK] All cart items have sufficient stock.");
         return true; // All items checked successfully
       } catch (error) {
         console.error('[VALIDATION][STOCK] Error validating product stock:', error);
         alert('Error al verificar la disponibilidad de los productos. Por favor, intente de nuevo.');
         return false;
       }
    }


   async mostrarFactura(factura) {
        console.log("[INVOICE] Showing invoice modal for:", factura);
       try {
         if (!this.invoiceModal || !this.invoiceDetails) {
             console.error('[INVOICE] Invoice modal elements not found!');
             throw new Error('Elementos del modal de factura no encontrados');
         }
          // Ensure invoice data is valid before generating HTML
         if (!factura || !factura.cliente || !factura.items || !factura.numeroFactura) {
             console.error('[INVOICE] Invalid invoice data received:', factura);
              // throw new Error('Datos de factura inválidos o incompletos.');
         }

          this.invoiceDetails.innerHTML = InvoiceTemplate.generarHTML(factura, false); // false for not printing immediately

         this.invoiceModal.classList.remove('hidden');
          document.body.classList.add('modal-open');
          requestAnimationFrame(() => {
              this.invoiceModal.classList.add('show');
          });
          console.log("[INVOICE] Invoice modal displayed.");
       } catch (error) {
         console.error('[INVOICE] Error displaying invoice:', error);
         alert('Error al mostrar la factura: ' + error.message);
         // Ensure modal is hidden if it failed to display correctly
         this.cerrarFactura();
       }
   }

    cerrarFactura() {
        console.log("[INVOICE] Closing invoice modal.");
         if (!this.invoiceModal) return;

         this.invoiceModal.classList.remove('show');
         document.body.classList.remove('modal-open');
         setTimeout(() => {
             this.invoiceModal.classList.add('hidden');
         }, 300); // Match transition time
    }
}

export { CheckoutController };
// import {Cliente} from '../../../../BackEnd/src/models/Cliente.js';
//
// import {app} from '../AppFactory.js';
// import {InvoiceTemplate} from './InvoicePlantilla.js';
// import {Validar} from '../../../../BackEnd/src/utils/validar.js';
//
// class CheckoutController {
//   constructor(facturaService, clienteService) {
//     this.facturaService = facturaService;
//     this.clienteService = clienteService;
//
//     this.checkoutSection = document.getElementById('checkoutSection');
//     this.checkoutCartTable = document.getElementById('checkoutCartTable');
//     this.checkoutTotal = document.getElementById('checkoutTotal');
//     this.btnCancelCheckout = document.getElementById('btnCancelCheckout');
//     this.btnConfirmCheckout = document.getElementById('btnConfirmCheckout');
//     this.invoiceSection = document.getElementById('invoiceSection');
//     this.invoiceDetails = document.getElementById('invoiceDetails');
//     this.btnCloseInvoice = document.getElementById('btnCloseInvoice');
//     this.btnCloseCheckoutModal = document.getElementById('closeCheckoutModal');
//     this.isProcessing = false; // Add a flag to track if a purchase is in progress
//     this.setupEventListeners();
//   }
//
//   cargarResumenPedido() {
//     const tbody = this.checkoutCartTable.querySelector('tbody');
//     tbody.innerHTML = '';
//     const cartItems = app.carritoController.carrito.items;
//     let subtotal = 0;
//
//     cartItems.forEach(item => {
//       const tr = document.createElement('tr');
//       tr.innerHTML = `
//         <td class="text-center"><img src="${item.imagen}" alt="${item.nombre}" style="width:60px; height:70px;  border-radius:2px"></td>
//         <td class="text-center">${item.nombre}</td>
//         <td class="text-center">${item.cantidad}</td>
//         <td class="text-center">$${item.precio.toFixed(2)}</td>
//         <td class="text-center">$${(item.precio * item.cantidad).toFixed(2)}</td>
//       `;
//       tbody.appendChild(tr);
//       subtotal += item.precio * item.cantidad;
//     });
//
//     document.getElementById('checkoutSubtotalValue').textContent = `$${subtotal.toFixed(2)}`;
//     const shipping = 0;
//     document.getElementById('checkoutShippingValue').textContent = `$${shipping.toFixed(2)}`;
//     document.getElementById('checkoutTotal').textContent = `$${(subtotal + shipping).toFixed(2)}`;
//   }
//
//   setupEventListeners() {
//     this.btnCancelCheckout.addEventListener('click', () => {
//       this.ocultarCheckoutModal();
//       app.carritoController.mostrarCarrito();
//     });
//     document.getElementById('closeCheckoutModal').addEventListener('click', () => {
//       this.ocultarCheckoutModal();
//     });
//     this.btnCloseInvoice.addEventListener('click', () => {
//       this.cerrarFactura();
//       if (document.getElementById('admin').classList.contains('show')) {
//         document.getElementById('admin').classList.remove('hidden');
//       }
//     });
//     this.btnConfirmCheckout.addEventListener('click', () => this.confirmarCompra());
//   }
//
//   async mostrarCheckoutModal() {
//     const modal = document.getElementById('checkoutOverlay');
//     const facturaInfo = await InvoiceTemplate.generarNumeroFactura();
//     this.facturaTemp = {
//       numeroFactura: facturaInfo.numero,
//       fecha: facturaInfo.fecha,
//       hora: facturaInfo.hora
//     };
//
//     document.getElementById('invoiceNumber').textContent = this.facturaTemp.numeroFactura;
//     document.getElementById('currentDate').textContent = this.facturaTemp.fecha.toLocaleDateString();
//     document.getElementById('currentTime').textContent = this.facturaTemp.hora;
//
//     modal.classList.remove('hidden');
//     document.body.classList.add('modal-open');
//     this.cargarResumenPedido();
//     requestAnimationFrame(() => modal.classList.add('show'));
//   }
//
//   ocultarCheckoutModal() {
//     const modal = document.getElementById('checkoutOverlay');
//     modal.classList.remove('show');
//     document.body.classList.remove('modal-open');
//     setTimeout(() => modal.classList.add('hidden'), 300);
//   }
//
//   limpiarFormularioCliente() {
//     document.getElementById('checkoutNombre').value = '';
//     document.getElementById('checkoutTelefono').value = '';
//     document.getElementById('checkoutDireccion').value = '';
//   }
//
//   // async confirmarCompra() {
//   //   // If a purchase is already in progress, wait for it to complete
//   //   if (this.isProcessing) {
//   //     console.log('Another purchase is in progress, please wait...');
//   //     alert('Por favor, espere. Se está procesando otra compra.');
//   //     return;
//   //   }
//   //
//   //   this.isProcessing = true; // Set the lock
//   //   try {
//   //     const nombre = document.getElementById('checkoutNombre').value;
//   //     const telefono = document.getElementById('checkoutTelefono').value;
//   //     const direccion = document.getElementById('checkoutDireccion').value;
//   //
//   //     const nombreValidado = Validar.nombreBP(nombre);
//   //     if (!nombreValidado) {
//   //       alert('El nombre ingresado no es válido. Debe tener entre 3 y 70 caracteres y solo contener letras, números y caracteres básicos.');
//   //       return;
//   //     }
//   //
//   //     const telefonoValidado = await Validar.telefonoBP(telefono, this.clienteService);
//   //     if (!telefonoValidado) {
//   //       alert('El teléfono ingresado no es válido. Ingrese un número válido de Ecuador.');
//   //       return;
//   //     }
//   //
//   //     const direccionValidada = Validar.direccionBP(direccion);
//   //     if (!direccionValidada) {
//   //       alert('La dirección ingresada no es válida. Debe tener entre 3 y 256 caracteres.');
//   //       return;
//   //     }
//   //
//   //     const carrito = app.carritoController.carrito;
//   //     const stockSuficiente = await this.validarStockCarrito(carrito);
//   //     if (!stockSuficiente) {
//   //       return;
//   //     }
//   //
//   //     this.btnConfirmCheckout.disabled = true;
//   //     this.btnConfirmCheckout.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
//   //
//   //     // Force sync to ensure the latest data is available
//   //     await this.clienteService.forceSyncNow();
//   //
//   //     // Verificar si el cliente ya existe por teléfono
//   //     let cliente = await this.clienteService.obtenerClientePorTelefono(telefonoValidado);
//   //
//   //     if (cliente) {
//   //       // Cliente existente: actualizar datos si cambiaron y aumentar contador
//   //       console.log(`Cliente existente encontrado con ID ${cliente.id}. Incrementando contador.`);
//   //
//   //       if (cliente.nombre !== nombreValidado || cliente.direccion !== direccionValidada) {
//   //         await this.clienteService.actualizarCliente(cliente.id, {
//   //           nombre: nombreValidado,
//   //           telefono: telefonoValidado,
//   //           direccion: direccionValidada
//   //         });
//   //         cliente = await this.clienteService.obtenerClientePorId(cliente.id); // Refrescar datos
//   //       }
//   //
//   //       // Incrementar contador para cliente existente
//   //       await this.clienteService.incrementarContadorCliente(cliente.id);
//   //       cliente = await this.clienteService.obtenerClientePorId(cliente.id); // Refrescar datos después de incrementar
//   //     } else {
//   //       // Cliente nuevo: crear con contador en 1
//   //       console.log('Cliente nuevo. Creando registro...');
//   //
//   //       const clienteData = new Cliente(
//   //         nombreValidado,
//   //         telefonoValidado,
//   //         direccionValidada,
//   //         'Activo',  // estado
//   //         null,      // fechaCreacion (se asignará en el constructor)
//   //         null,      // fechaActualizacion (se asignará en el constructor)
//   //         1          // Contador iniciando en 1 para primera compra
//   //       );
//   //
//   //       cliente = await this.clienteService.agregarCliente(clienteData);
//   //       if (!cliente) {
//   //         throw new Error('No se pudo registrar el cliente.');
//   //       }
//   //     }
//   //
//   //     const factura = await this.facturaService.generarFactura(cliente, carrito, this.facturaTemp);
//   //     this.facturaTemp = null;
//   //
//   //     this.ocultarCheckoutModal();
//   //     await this.mostrarFactura(factura);
//   //
//   //     carrito.vaciarCarrito();
//   //     app.tiendaController.actualizarContadorCarrito();
//   //     this.limpiarFormularioCliente();
//   //   } catch (error) {
//   //     console.error('Error durante el checkout:', error);
//   //     alert(`Error al confirmar la compra: ${error.message}`);
//   //   } finally {
//   //     this.btnConfirmCheckout.disabled = false;
//   //     this.btnConfirmCheckout.innerHTML = 'Confirmar <i class="fas fa-check-circle fa-lg"></i>';
//   //     this.isProcessing = false; // Release the lock
//   //   }
//   // }
//   async confirmarCompra() {
//     if (this.isProcessing) {
//       console.warn('Compra ya en progreso. Esperando...');
//       alert('Por favor, espere. Se está procesando la compra anterior.');
//       return;
//     }
//
//     this.isProcessing = true; // Lock processing
//     this.btnConfirmCheckout.disabled = true;
//     this.btnConfirmCheckout.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
//
//     try {
//       const nombreInput = document.getElementById('checkoutNombre').value;
//       const telefonoInput = document.getElementById('checkoutTelefono').value;
//       const direccionInput = document.getElementById('checkoutDireccion').value;
//
//       // --- 1. Validation ---
//       const nombreValidado = Validar.nombreBP(nombreInput);
//       if (!nombreValidado) {
//         alert('El nombre ingresado no es válido. Debe tener entre 3 y 70 caracteres y solo contener letras, números y caracteres básicos.');
//         throw new Error("Nombre inválido"); // Throw error to ensure finally block runs
//       }
//
//       // Use basic validation first; uniqueness check comes later
//       const telefonoValidado = await Validar.telefonoBP(telefonoInput); // Using basic format validation initially
//       if (!telefonoValidado) {
//         alert('El teléfono ingresado no es válido. Ingrese un número válido de Ecuador.');
//         throw new Error("Teléfono inválido");
//       }
//
//       const direccionValidada = Validar.direccionBP(direccionInput);
//       if (!direccionValidada) {
//         alert('La dirección ingresada no es válida. Debe tener entre 3 y 256 caracteres.');
//         throw new Error("Dirección inválida");
//       }
//
//       // --- 2. Stock Validation ---
//       const carrito = app.carritoController.carrito;
//       const stockSuficiente = await this.validarStockCarrito(carrito);
//       if (!stockSuficiente) {
//         // Alert is shown inside validarStockCarrito
//         throw new Error("Stock insuficiente");
//       }
//
//       // --- 3. Get Latest Customer Data & Check Existence ---
//       console.log('Forzando sincronización antes de buscar cliente...');
//       await this.clienteService.forceSyncNow(); // Ensure local data is current
//
//       console.log(`Buscando cliente con teléfono: ${telefonoValidado}`);
//       let cliente = await this.clienteService.obtenerClientePorTelefono(telefonoValidado);
//       let clienteIdParaFactura;
//
//       // --- 4. Handle Existing vs. New Customer ---
//       if (cliente) {
//         // --- 4a. EXISTING CUSTOMER ---
//         console.log(`Cliente existente encontrado con ID ${cliente.id}. Verificando datos y incrementando contador.`);
//         clienteIdParaFactura = cliente.id;
//
//         // Check if name or address needs update based on form input
//         let datosParaActualizar = {};
//         let necesitaActualizacion = false;
//         if (cliente.nombre !== nombreValidado) {
//           datosParaActualizar.nombre = nombreValidado;
//           necesitaActualizacion = true;
//         }
//         if (cliente.direccion !== direccionValidada) {
//           datosParaActualizar.direccion = direccionValidada;
//           necesitaActualizacion = true;
//         }
//         // DO NOT update phone number here automatically - it's the identifier.
//         // If phone needed changing, it should be a separate user action in an admin panel.
//
//         if (necesitaActualizacion) {
//           console.log(`Actualizando datos para cliente ID ${cliente.id}:`, datosParaActualizar);
//           const clienteActualizado = await this.clienteService.actualizarCliente(cliente.id, datosParaActualizar);
//           if (!clienteActualizado) {
//             throw new Error('Error al actualizar los datos del cliente existente.');
//           }
//           cliente = clienteActualizado; // Use updated data
//         }
//
//         // Increment counter for existing customer
//         console.log(`Incrementando contador para cliente ID ${cliente.id}`);
//         const clienteConContadorIncrementado = await this.clienteService.incrementarContadorCliente(cliente.id);
//         if (!clienteConContadorIncrementado) {
//           // Handle case where increment failed but user exists. Maybe proceed? Log error.
//           console.error(`Error al incrementar contador para cliente ID ${cliente.id}, pero el cliente existe. Continuando con la compra.`);
//           // Still use the 'cliente' object we have, even if counter increment failed sync/DB update
//         } else {
//           cliente = clienteConContadorIncrementado; // Use the very latest data with incremented counter
//         }
//
//       } else {
//         // --- 4b. NEW CUSTOMER ---
//         console.log(`Cliente nuevo con teléfono ${telefonoValidado}. Creando registro...`);
//
//         const nuevoClienteData = new Cliente(
//           nombreValidado,
//           telefonoValidado,
//           direccionValidada,
//           'Activo', // Default status for new customer
//           null,     // fechaCreacion - handled by service/DB
//           null,     // fechaActualizacion - handled by service/DB
//           1         // Start counter at 1 for the first purchase
//         );
//
//         const clienteCreado = await this.clienteService.agregarCliente(nuevoClienteData);
//         if (!clienteCreado) {
//           // The agregarCliente method should have already logged the specific error (e.g., duplicate phone after all)
//           alert('Error: No se pudo registrar al nuevo cliente. Es posible que el teléfono ya exista o haya ocurrido un error de sincronización. Intente nuevamente.');
//           throw new Error('No se pudo registrar el nuevo cliente.');
//         }
//         console.log(`Nuevo cliente creado con ID: ${clienteCreado.id}`);
//         cliente = clienteCreado; // Use the newly created customer object
//         clienteIdParaFactura = cliente.id;
//       }
//
//       // --- 5. Generate Invoice ---
//       if (!cliente || !cliente.id) {
//         throw new Error('Error crítico: No se pudo obtener o crear la información del cliente para la factura.');
//       }
//
//       console.log(`Generando factura para cliente ID ${cliente.id}...`);
//       // Fetch the absolute latest client state just before invoicing
//       const clienteFinalParaFactura = await this.clienteService.obtenerClientePorId(cliente.id);
//       if (!clienteFinalParaFactura) {
//         throw new Error(`Error crítico: No se encontró el cliente con ID ${cliente.id} justo antes de generar la factura.`);
//       }
//
//
//       const factura = await this.facturaService.generarFactura(clienteFinalParaFactura, carrito, this.facturaTemp);
//       this.facturaTemp = null; // Clear temp invoice number details
//
//       // --- 6. Post-Purchase Actions ---
//       this.ocultarCheckoutModal();
//       await this.mostrarFactura(factura);
//
//       carrito.vaciarCarrito();
//       app.tiendaController.actualizarContadorCarrito();
//       this.limpiarFormularioCliente();
//       console.log(`Compra completada exitosamente para cliente ID ${clienteFinalParaFactura.id}.`);
//
//
//     } catch (error) {
//       console.error('Error durante el proceso de confirmar compra:', error);
//       // Avoid showing overly technical errors to the user
//       if (error.message !== "Stock insuficiente" && error.message !== "Nombre inválido" && error.message !== "Teléfono inválido" && error.message !== "Dirección inválida" && !error.message.includes("No se pudo registrar")) {
//         alert(`Ocurrió un error inesperado al procesar la compra. Por favor, intente de nuevo más tarde.`);
//       }
//       // No need to show alerts again if they were already shown for validation errors
//
//     } finally {
//       // --- 7. Cleanup / Reset UI ---
//       this.btnConfirmCheckout.disabled = false;
//       this.btnConfirmCheckout.innerHTML = 'Confirmar <i class="fas fa-check-circle fa-lg"></i>';
//       this.isProcessing = false; // Release the lock
//     }
//   }
//
//   async validarStockCarrito(carrito) {
//     try {
//       for (const item of carrito.items) {
//         const producto = await app.productoService.obtenerProductoPorId(item.productoId);
//         if (!producto) {
//           alert(`El producto ${item.nombre} ya no está disponible.`);
//           return false;
//         }
//         if (producto.stock < item.cantidad) {
//           alert(`Stock insuficiente para ${item.nombre}. Stock disponible: ${producto.stock}`);
//           return false;
//         }
//       }
//       return true;
//     } catch (error) {
//       console.error('Error al validar stock:', error);
//       alert('Error al verificar disponibilidad de productos.');
//       return false;
//     }
//   }
//
//   async mostrarFactura(factura) {
//     try {
//       const invoiceModal = document.getElementById('invoiceModal');
//       const invoiceDetails = document.getElementById('invoiceDetails');
//       if (!invoiceModal || !invoiceDetails) {
//         throw new Error('Elementos del modal de factura no encontrados');
//       }
//       invoiceDetails.innerHTML = InvoiceTemplate.generarHTML(factura, false);
//       invoiceModal.classList.remove('hidden');
//       requestAnimationFrame(() => {
//         invoiceModal.classList.add('show');
//         document.body.classList.add('modal-open');
//       });
//     } catch (error) {
//       console.error('Error al mostrar la factura:', error);
//       alert('Error al mostrar la factura: ' + error.message);
//     }
//   }
//
//   cerrarFactura() {
//     const invoiceModal = document.getElementById('invoiceModal');
//     invoiceModal.classList.remove('show');
//     document.body.classList.remove('modal-open');
//     setTimeout(() => invoiceModal.classList.add('hidden'), 300);
//   }
// }
//
// export {CheckoutController};