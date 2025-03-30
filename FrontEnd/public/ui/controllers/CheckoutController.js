// FrontEnd/ui/controllers/CheckoutController.js
import {Cliente} from '../../../../BackEnd/src/models/Cliente.js';
import { CarritoController } from './CarritoController.js';
import {app} from '../AppFactory.js';
import { InvoiceTemplate } from './InvoicePlantilla.js';
import { Validar } from '../../../../BackEnd/src/utils/validar.js';


class CheckoutController {
  constructor(facturaService, clienteService) {
    this.facturaService = facturaService;
    this.clienteService = clienteService;

    // Elementos del DOM
    this.checkoutSection = document.getElementById('checkoutSection');
    this.checkoutCartTable = document.getElementById('checkoutCartTable');
    this.checkoutTotal = document.getElementById('checkoutTotal');
    this.btnCancelCheckout = document.getElementById('btnCancelCheckout');
    this.btnConfirmCheckout = document.getElementById('btnConfirmCheckout');
    this.invoiceSection = document.getElementById('invoiceSection');
    this.invoiceDetails = document.getElementById('invoiceDetails');
    this.btnCloseInvoice = document.getElementById('btnCloseInvoice');

    this.btnCloseCheckoutModal = document.getElementById('closeCheckoutModal');
    this.setupEventListeners();
  }

  // Add this new method to load cart items into checkout
  cargarResumenPedido() {
    const tbody = this.checkoutCartTable.querySelector('tbody');
    tbody.innerHTML = '';

    const cartItems = app.carritoController.carrito.items;
    let subtotal = 0;

    cartItems.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
          <td>
            <img src="${item.imagen}" alt="${item.nombre}" style="width:60px; height:70px; object-fit:cover; border-radius:50%">
          </td>
          <td >${item.nombre}</td>
          <td >${item.cantidad}</td>
          <td >$${item.precio.toFixed(2)}</td>
          <td >$${(item.precio * item.cantidad).toFixed(2)}</td>
        `;
      tbody.appendChild(tr);
      subtotal += item.precio * item.cantidad;
    });

    // Update summary values
    document.getElementById('checkoutSubtotalValue').textContent = `$${subtotal.toFixed(2)}`;
    const shipping = 0; // Or calculate shipping cost
    document.getElementById('checkoutShippingValue').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('checkoutTotal').textContent = `$${(subtotal + shipping).toFixed(2)}`;
  }


  setupEventListeners() {
    this.btnCancelCheckout.addEventListener('click', () => {
      this.ocultarCheckoutModal();
      // Mostramos nuevamente el modal del carrito
      app.carritoController.mostrarCarrito();
    });

    document.getElementById('closeCheckoutModal').addEventListener('click', () => {
      this.ocultarCheckoutModal();
     // app.carritoController.mostrarCarrito();
    });
  
    this.btnCloseInvoice.addEventListener('click', () => {
      this.cerrarFactura();
      if (document.getElementById('admin').classList.contains('show')) {
        document.getElementById('admin').classList.remove('hidden');
      }
    });
 
    this.btnConfirmCheckout.addEventListener('click', () => this.confirmarCompra());
    
  }

  async mostrarCheckoutModal() {
    const modal = document.getElementById('checkoutOverlay');
    
    // Generar número de factura y guardar toda la información temporal
    const facturaInfo = await InvoiceTemplate.generarNumeroFactura();
    this.facturaTemp = {
        numeroFactura: facturaInfo.numero,
        fecha: facturaInfo.fecha,
        hora: facturaInfo.hora
    };
    
    // Mostrar la información en el modal
    document.getElementById('invoiceNumber').textContent = this.facturaTemp.numeroFactura;
    document.getElementById('currentDate').textContent = this.facturaTemp.fecha.toLocaleDateString();
    document.getElementById('currentTime').textContent = this.facturaTemp.hora;

    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    this.cargarResumenPedido();
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}
  
  ocultarCheckoutModal() {
    const modal = document.getElementById('checkoutOverlay');
    
    // Start hide animation
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
    
    // Wait for animation to finish before hiding
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300);
  }

  cancelarCheckout() {
    this.checkoutSection.classList.add('hidden');
    document.getElementById('cartSection').classList.remove('hidden');
    this.limpiarFormularioCliente(); // Limpiar formulario al cancelar
  }

  limpiarFormularioCliente() {
    document.getElementById('checkoutNombre').value = '';
    document.getElementById('checkoutTelefono').value = '';
    document.getElementById('checkoutDireccion').value = '';
  }


async confirmarCompra() {
    try {
        const nombre = document.getElementById('checkoutNombre').value;
        const telefono = document.getElementById('checkoutTelefono').value;
        const direccion = document.getElementById('checkoutDireccion').value;

        // 1. Validar campos del cliente
        const nombreValidado = await Validar.nombreBP(nombre);
        if (!nombreValidado) {
            alert('El nombre ingresado no es válido. Debe tener entre 3 y 70 caracteres y solo contener letras, números y caracteres básicos.');
            return;
        }

        const telefonoValidado = await Validar.telefonoBP(telefono, this.clienteService);
        if (!telefonoValidado) {
            alert('El teléfono ingresado no es válido o ya está registrado. Ingrese un número válido de Ecuador.');
            return;
        }

        const direccionValidada = Validar.direccionBP(direccion);
        if (!direccionValidada) {
            alert('La dirección ingresada no es válida. Debe tener entre 3 y 256 caracteres.');
            return;
        }

        // 2. Validar stock suficiente antes de procesar
        const carrito = app.carritoController.carrito;
        const stockSuficiente = await this.validarStockCarrito(carrito);
        if (!stockSuficiente) {
            return; // El mensaje de error ya se muestra en validarStockCarrito
        }

        // 3. Si todas las validaciones pasan, proceder con la compra
        this.btnConfirmCheckout.disabled = true;
        this.btnConfirmCheckout.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

        // Crear cliente con datos validados
        const clienteData = {
            nombre: nombreValidado,
            telefono: telefonoValidado,
            direccion: direccionValidada
        };

        // Intentar guardar el cliente
        const nuevoCliente = await this.clienteService.agregarCliente(clienteData);
        if (!nuevoCliente) {
            throw new Error('No se pudo registrar el cliente. Por favor, intente nuevamente.');
        }

          // Usar la información temporal guardada
         const factura = await this.facturaService.generarFactura(
             nuevoCliente, 
             carrito, 
             this.facturaTemp
         );
 
         // Limpiar la información temporal
         this.facturaTemp = null;

        // Si todo sale bien, mostrar factura y limpiar carrito
        this.ocultarCheckoutModal();
        await this.mostrarFactura(factura);
        
        carrito.vaciarCarrito();
        app.tiendaController.actualizarContadorCarrito();
        this.limpiarFormularioCliente();

    } catch (error) {
        console.error('Error durante el checkout:', error);
        alert(`Error al confirmar la compra: ${error.message}`);
    } finally {
        this.btnConfirmCheckout.disabled = false;
        this.btnConfirmCheckout.innerHTML = 'Confirmar <i class="fas fa-check-circle fa-lg"></i>';
    }
}

// Método auxiliar para validar stock
async validarStockCarrito(carrito) {
    try {
        for (const item of carrito.items) {
            const producto = await app.productoService.obtenerProductoPorId(item.productoId);
            if (!producto) {
                alert(`El producto ${item.nombre} ya no está disponible.`);
                return false;
            }
            if (producto.stock < item.cantidad) {
                alert(`Stock insuficiente para ${item.nombre}. Stock disponible: ${producto.stock}`);
                return false;
            }
        }
        return true;
    } catch (error) {
        console.error('Error al validar stock:', error);
        alert('Error al verificar disponibilidad de productos.');
        return false;
    }
}

// En CheckoutController.js

async mostrarFactura(factura) {
    try {
        const invoiceModal = document.getElementById('invoiceModal');
        const invoiceDetails = document.getElementById('invoiceDetails');
        
        if (!invoiceModal || !invoiceDetails) {
            throw new Error('Elementos del modal de factura no encontrados');
        }

        // Generar HTML usando la plantilla
        invoiceDetails.innerHTML = InvoiceTemplate.generarHTML(factura, false);

        // Mostrar modal con animación
        invoiceModal.classList.remove('hidden');
        requestAnimationFrame(() => {
            invoiceModal.classList.add('show');
            document.body.classList.add('modal-open');
        });

    } catch (error) {
        console.error('Error al mostrar la factura:', error);
        alert('Error al mostrar la factura: ' + error.message);
    }
}

cerrarFactura() {
  const invoiceModal = document.getElementById('invoiceModal');
  
  // Start closing animation
  invoiceModal.classList.remove('show');
  document.body.classList.remove('modal-open');
  
  // Wait for animation to finish before hiding
  setTimeout(() => {
    invoiceModal.classList.add('hidden');
  }, 300); // Match CSS transition duration
}
}

export {CheckoutController};