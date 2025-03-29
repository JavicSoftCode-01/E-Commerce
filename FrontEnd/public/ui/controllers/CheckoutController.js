// FrontEnd/ui/controllers/CheckoutController.js
import {Cliente} from '../../../../BackEnd/src/models/Cliente.js';
import { CarritoController } from './CarritoController.js';
import {app} from '../AppFactory.js';

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
      app.carritoController.mostrarCarrito();
    });
  
    this.btnCloseInvoice.addEventListener('click', () => {
      this.cerrarFactura();
      if (document.getElementById('admin').classList.contains('show')) {
        document.getElementById('admin').classList.remove('hidden');
      }
    });
 
    this.btnConfirmCheckout.addEventListener('click', () => this.confirmarCompra());
    
  }

  mostrarCheckoutModal() {
    const modal = document.getElementById('checkoutOverlay');

  
    // Remove hidden class and add show class
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    
    // Load cart items into checkout summary
    this.cargarResumenPedido();
    
    // Trigger animation
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
  
        if (!nombre || !telefono || !direccion) {
          alert('Por favor, complete todos los campos del cliente.');
          return;
        }
  
        // Deshabilitar el botón mientras se procesa
        this.btnConfirmCheckout.disabled = true;
        this.btnConfirmCheckout.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
  
        // 1. Crear y guardar el cliente
        const clienteData = {
          nombre: nombre,
          telefono: telefono,
          direccion: direccion
        };
  
        const nuevoCliente = await this.clienteService.agregarCliente(clienteData);
  
        if (!nuevoCliente) {
          throw new Error('El cliente no pudo ser registrado.');
        }
  
        // 2. Generar la factura con el cliente y el carrito
        const carrito = app.carritoController.carrito;
        const factura = await this.facturaService.generarFactura(nuevoCliente, carrito);
  
        if (!factura) {
          throw new Error('La factura no pudo ser generada. Verifique el stock disponible.');
        }
  
        // Remove the animation code that was causing the error
        // and directly proceed to show the invoice
  
        // Ocultar checkout y mostrar factura
        this.ocultarCheckoutModal();
        await this.mostrarFactura(factura);
  
        // Limpiar carrito y actualizar UI
        carrito.vaciarCarrito();
        app.tiendaController.actualizarContadorCarrito();
        this.limpiarFormularioCliente();
  
      } catch (error) {
        console.error('Error durante el checkout:', error);
        alert(`Error al confirmar la compra: ${error.message}`);
      } finally {
        this.btnConfirmCheckout.disabled = false;
        this.btnConfirmCheckout.innerHTML = 'Confirmar Compra <i class="fas fa-check-circle fa-lg"></i>';
      }
    }

    async mostrarFactura(factura) {
    try {
      if (!factura || !factura.detalles || !Array.isArray(factura.detalles)) {
        throw new Error('Datos de factura inválidos');
      }
  
      const invoiceModal = document.getElementById('invoiceModal');
      const invoiceDetails = document.getElementById('invoiceDetails');
  
      if (!invoiceModal || !invoiceDetails) {
        throw new Error('Elementos del modal de factura no encontrados');
      }
  
      // Generate invoice HTML
      const detallesHTML = factura.detalles.map(item => {
        if (!item.nombre || !item.cantidad || !item.precio) {
          console.warn('Item con datos incompletos:', item);
          return '';
        }
        const subtotal = item.precio * item.cantidad;
        return `
          <tr>
            <td>${item.nombre}</td>
            <td class="text-center">${item.cantidad}</td>
            <td class="text-right">$${item.precio.toFixed(2)}</td>
            <td class="text-right">$${subtotal.toFixed(2)}</td>
          </tr>
        `;
      }).filter(html => html !== '').join('');
  
      const facturaHTML = `
        <div class="invoice-content">
          <div class="invoice-header">
            <h2>Factura #${factura.id || 'N/A'}</h2>
            <p>Fecha: ${factura.fecha ? new Date(factura.fecha).toLocaleDateString() : new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="invoice-client">
            <h3>Cliente</h3>
            <p>Nombre: ${factura.clienteNombre || 'N/A'}</p>
            <p>Teléfono: ${factura.clienteTelefono || 'N/A'}</p>
            <p>Dirección: ${factura.clienteDireccion || 'N/A'}</p>
          </div>
          
          <div class="invoice-details">
            <table class="invoice-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th class="text-center">Cantidad</th>
                  <th class="text-right">Precio Unit.</th>
                  <th class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${detallesHTML}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="text-right"><strong>Total:</strong></td>
                  <td class="text-right"><strong>$${(factura.total || 0).toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      `;
  
      invoiceDetails.innerHTML = facturaHTML;
  
      // Show modal with animation
      invoiceModal.classList.remove('hidden');
      requestAnimationFrame(() => {
        invoiceModal.classList.add('show');
        document.body.classList.add('modal-open');
      });
  
    } catch (error) {
      console.error('Error al mostrar la factura:', error);
      console.error('Datos de factura recibidos:', factura);
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