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
    try {
      if (!factura) {
        console.error('No se recibió factura para mostrar');
        return;
      }

      console.log('Mostrando factura:', factura); // Debug

      // Formatear la fecha
      const fecha = new Date(factura.fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Generar el HTML de los detalles de productos
      const detallesHTML = factura.detalles.map(detalle => `
            <tr>
                <td class="producto-info">
                    ${detalle.imagen ? `<img src="${detalle.imagen}" alt="${detalle.nombre}" class="producto-mini-img">` : ''}
                    <span>${detalle.nombre}</span>
                </td>
                <td class="text-center">${detalle.cantidad}</td>
                <td class="text-right">$${detalle.precio.toFixed(2)}</td>
                <td class="text-right">$${(detalle.cantidad * detalle.precio).toFixed(2)}</td>
            </tr>
        `).join('');

      // Construir el HTML completo de la factura
      const facturaHTML = `
            <div class="invoice-header">
                <div class="company-info">
                    <h2>LUNAIRE</h2>
                    <p>Factura de Venta</p>
                </div>
                <div class="invoice-info">
                    <p><strong>Factura N°:</strong> ${factura.id}</p>
                    <p><strong>Fecha:</strong> ${fecha}</p>
                </div>
            </div>

            <div class="customer-info">
                <h3>Cliente</h3>
                <p><strong>Nombre:</strong> ${factura.clienteNombre}</p>
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
                            <td class="text-right"><strong>$${factura.total.toFixed(2)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div class="invoice-footer">
                <p>¡Gracias por su compra!</p>
            </div>
        `;

      // Actualizar el contenido del modal
      const invoiceDetails = document.getElementById('invoiceDetails');
      if (!invoiceDetails) {
        throw new Error('No se encontró el elemento invoiceDetails');
      }
      invoiceDetails.innerHTML = facturaHTML;

      // Mostrar el modal
      const invoiceSection = document.getElementById('invoiceSection');
      if (!invoiceSection) {
        throw new Error('No se encontró el elemento invoiceSection');
      }
      invoiceSection.classList.remove('hidden');

    } catch (error) {
      console.error('Error al mostrar la factura:', error);
      alert('Error al mostrar la factura: ' + error.message);
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
    }, {once: true});
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

      console.log('Cliente creado:', nuevoCliente); // Debug

      // 2. Generar la factura con el cliente y el carrito
      const carrito = app.carritoController.carrito;
      const factura = await this.facturaService.generarFactura(nuevoCliente, carrito);

      if (!factura) {
        throw new Error('La factura no pudo ser generada. Verifique el stock disponible.');
      }

      // 3. Mostrar mensaje de éxito
      const modal = this.checkoutSection;
      modal.classList.add('fade-out');

      // Esperar la animación
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 4. Ocultar checkout y mostrar factura
      this.ocultarCheckoutModal();
      await this.mostrarFactura(factura);

      // 5. Limpiar carrito y actualizar UI
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

  async cerrarFactura() {
    this.invoiceSection.classList.add('hidden');
    await app.tiendaController.cargarProductos();
  }
}

export {CheckoutController};