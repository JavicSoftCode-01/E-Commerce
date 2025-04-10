// // FrontEnd/public/ui/controllers/CheckoutController.js

import { app } from '../AppFactory.js'; // Adjust path
import { InvoiceTemplate } from './InvoicePlantilla.js'; // Adjust path
import { Validar } from '../../../../BackEnd/src/utils/validar.js'; // Adjust path

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
