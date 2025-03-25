// FrontEnd/ui/controllers/CheckoutController.js
// import {TiendaController} from './TiendaController.js';
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

    // Configurar listeners
    // this.tiendaCarrito = new TiendaController()
    this.setupEventListeners();
  }

  // setupEventListeners, mostrarSeccionCheckout, cancelarCheckout, limpiarFormularioCliente, mostrarFactura, cerrarFactura (sin cambios)
  setupEventListeners() {
    this.btnCancelCheckout.addEventListener('click', () => this.cancelarCheckout());
    this.btnConfirmCheckout.addEventListener('click', () => this.confirmarCompra());
    this.btnCloseInvoice.addEventListener('click', () => this.cerrarFactura());
  }

  async mostrarSeccionCheckout() {
    // Ocultar secciones, y mostrar la de compra
    document.getElementById('cartSection').classList.add('hidden');
    this.checkoutSection.classList.remove('hidden');

    // tbody del carrito en checkout
    const tbody = this.checkoutCartTable.querySelector('tbody');
    tbody.innerHTML = '';
    const carrito = app.carritoController.carrito;

    if (carrito && carrito.items) {
      carrito.items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.producto.nombre}</td>
          <td>${item.cantidad}</td>
          <td>$${item.precio.toFixed(2)}</td>
          <td>$${item.subtotal.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
      });
      this.checkoutTotal.textContent = `Total: $${carrito.calcularTotalCarrito().toFixed(2)}`;
    } else {
      console.error('Carrito no está definido o no tiene items');
      this.checkoutTotal.textContent = 'Total: $0.00';
    }

    // Limpiar el formulario del cliente al mostrar la sección
    this.limpiarFormularioCliente();
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

      //  CORRECCIÓN:  Pasar el ID del cliente, no el objeto completo.
      const carrito = app.carritoController.carrito;
      const factura = await this.facturaService.generarFactura(nuevoCliente, carrito); //  <-- Aquí

      if (!factura) {
        throw new Error('La factura no pudo ser generada.');
      }

      await this.mostrarFactura(factura);
      carrito.vaciarCarrito();
      // this.tiendaCarrito.actualizarContadorCarrito();
      app.tiendaController.actualizarContadorCarrito();  //  <-- Así
      this.checkoutSection.classList.add('hidden');
      this.limpiarFormularioCliente();

    } catch (error) {
      console.error('Error durante el checkout:', error);
      alert(`Error al confirmar la compra: ${error.message}`);
    }
  }

  async mostrarFactura(factura) {
    if (!factura) return;

    const fecha = new Date(factura.fecha).toLocaleDateString();

    let detallesHTML = '';
    for (const detalle of factura.detalles) {
      detallesHTML += `
                <tr>
                  <td>${detalle.producto.nombre}</td>
                <td>${detalle.cantidad}</td>
                  <td>$${detalle.precio.toFixed(2)}</td>
                 <td>$${detalle.subtotal.toFixed(2)}</td>
              </tr>
            `;
    }

    const cliente = await this.clienteService.obtenerClientePorId(factura.cliente);
    if (!cliente) {
      console.error("No se pudo encontrar el cliente para la factura ID:", factura.cliente);
      this.invoiceDetails.innerHTML = "<p>Cliente no encontrado.</p>"; // Mejor mensaje.
      this.invoiceSection.classList.remove('hidden');
      return;
    }

    this.invoiceDetails.innerHTML = `
        <div class="invoice-header">
               <div>
                 <div class="invoice-id">Factura #${factura.id}</div>
               <div class="invoice-date">Fecha: ${fecha}</div>
              </div>
          </div>
            <div class="invoice-client">
                <h3>Cliente</h3>
               <p><strong>Nombre:</strong> ${cliente.nombre}</p>
              <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
               <p><strong>Dirección:</strong> ${cliente.direccion}</p>
            </div>
         <h3>Detalle de Compra</h3>
            <table>
            <thead>
                 <tr>
                  <th>Producto</th>
                    <th>Cantidad</th>
                   <th>Precio Unitario</th>
                    <th>Subtotal</th>
                </tr>
             </thead>
             <tbody>
                 ${detallesHTML}  <!-- Aquí se insertan las filas -->
             </tbody>
         </table>
         <div class="invoice-total">Total: $${factura.total.toFixed(2)}</div>
      `;

    this.invoiceSection.classList.remove('hidden');
  }

  async cerrarFactura() {
    this.invoiceSection.classList.add('hidden');
    await app.tiendaController.cargarProductos();
  }
}

export {CheckoutController};