// FrontEnd/ui/controllers/CheckoutController.js
import {Cliente} from '../../../../BackEnd/src/models/Cliente.js';
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
            <img src="${item.imagen}" alt="${item.nombre}" style="width:50px; height:50px; object-fit:cover; border-radius:50%">
            ${item.nombre}
          </td>
          <td class="text-center">${item.cantidad}</td>
          <td class="text-right">$${item.precio.toFixed(2)}</td>
          <td class="text-right">$${(item.precio * item.cantidad).toFixed(2)}</td>
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


async mostrarFactura(factura) {
  if (!factura) return;

  const fecha = new Date(factura.fecha).toLocaleDateString();

  let detallesHTML = '';
  for (const detalle of factura.detalles) {
    detallesHTML += `
      <tr>
        <td style="width: 50px; height: 50px; border-radius: 50%;">
          <img src="${detalle.imagen || 'default.png'}" alt="${detalle.nombre}" 
               style="width:50px; height:50px; object-fit:cover;">
        </td>
        <td>${detalle.nombre}</td>
        <td class="text-center">${detalle.cantidad}</td>
        <td class="text-right">$${detalle.precio.toFixed(2)}</td>
        <td class="text-right">$${(detalle.precio * detalle.cantidad).toFixed(2)}</td>
      </tr>
    `;
  }
}

  setupEventListeners() {
    this.btnCancelCheckout.addEventListener('click', () => {
      this.ocultarCheckoutModal();
      // Mostramos nuevamente el modal del carrito
      app.carritoController.mostrarCarrito();
    });
    this.btnConfirmCheckout.addEventListener('click', () => this.confirmarCompra());
    this.btnCloseInvoice.addEventListener('click', () => this.cerrarFactura());
  }

  mostrarCheckoutModal() {
    const modal = this.checkoutSection;
    const overlay = document.getElementById('checkoutOverlay');
    
    // Remove hidden class
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    
    // Load cart items into checkout summary
    this.cargarResumenPedido();
    
    // Animate modal
    requestAnimationFrame(() => {
      modal.classList.add('show');
      overlay.classList.add('show');
    });
  }
 

  ocultarCheckoutModal() {
    const modal = this.checkoutSection;
    const overlay = document.getElementById('checkoutOverlay');
  
    modal.classList.remove('show');
    overlay.classList.remove('show');
  
    // Espera a que termine la transición para volver a ocultar
    modal.addEventListener('transitionend', () => {
      modal.classList.add('hidden');
      overlay.classList.add('hidden');
    }, { once: true });
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
  const nombre = document.getElementById('checkoutNombre').value;
  const telefono = document.getElementById('checkoutTelefono').value;
  const direccion = document.getElementById('checkoutDireccion').value;

  if (!nombre || !telefono || !direccion) {
    alert('Por favor, complete todos los campos del cliente.');
    return;
  }

  try {
    const cliente = new Cliente(nombre, telefono, direccion);
    const nuevoCliente = await this.clienteService.agregarCliente(cliente);

    if (!nuevoCliente) {
      throw new Error('El cliente no pudo ser registrado.');
    }

    const carrito = app.carritoController.carrito;
    // Create invoice with cart items
    const factura = await this.facturaService.generarFactura(nuevoCliente, carrito);

    if (!factura) {
      throw new Error('La factura no pudo ser generada.');
    }

    // Hide checkout modal
    this.ocultarCheckoutModal();
    
    // Show invoice
    await this.mostrarFactura(factura);
    
    // Clear cart and update UI
    carrito.vaciarCarrito();
    app.tiendaController.actualizarContadorCarrito();
    this.limpiarFormularioCliente();

  } catch (error) {
    console.error('Error durante el checkout:', error);
    alert(`Error al confirmar la compra: ${error.message}`);
  }
}

  async cerrarFactura() {
    this.invoiceSection.classList.add('hidden');
    await app.tiendaController.cargarProductos();
  }
}

export {CheckoutController};