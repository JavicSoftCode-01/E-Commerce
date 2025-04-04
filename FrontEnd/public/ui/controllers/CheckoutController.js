// FrontEnd/public/ui/controllers/CheckoutController.js
import { Cliente } from '../../../../BackEnd/src/models/Cliente.js';

import { app } from '../AppFactory.js';
import { InvoiceTemplate } from './InvoicePlantilla.js';
import { Validar } from '../../../../BackEnd/src/utils/validar.js';

class CheckoutController {
  constructor(facturaService, clienteService) {
    this.facturaService = facturaService;
    this.clienteService = clienteService;

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

  cargarResumenPedido() {
    const tbody = this.checkoutCartTable.querySelector('tbody');
    tbody.innerHTML = '';
    const cartItems = app.carritoController.carrito.items;
    let subtotal = 0;

    cartItems.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="text-center"><img src="${item.imagen}" alt="${item.nombre}" style="width:60px; height:70px;  border-radius:2px"></td>
        <td class="text-center">${item.nombre}</td>
        <td class="text-center">${item.cantidad}</td>
        <td class="text-center">$${item.precio.toFixed(2)}</td>
        <td class="text-center">$${(item.precio * item.cantidad).toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
      subtotal += item.precio * item.cantidad;
    });

    document.getElementById('checkoutSubtotalValue').textContent = `$${subtotal.toFixed(2)}`;
    const shipping = 0;
    document.getElementById('checkoutShippingValue').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('checkoutTotal').textContent = `$${(subtotal + shipping).toFixed(2)}`;
  }

  setupEventListeners() {
    this.btnCancelCheckout.addEventListener('click', () => {
      this.ocultarCheckoutModal();
      app.carritoController.mostrarCarrito();
    });
    document.getElementById('closeCheckoutModal').addEventListener('click', () => {
      this.ocultarCheckoutModal();
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
    const facturaInfo = await InvoiceTemplate.generarNumeroFactura();
    this.facturaTemp = {
      numeroFactura: facturaInfo.numero,
      fecha: facturaInfo.fecha,
      hora: facturaInfo.hora
    };

    document.getElementById('invoiceNumber').textContent = this.facturaTemp.numeroFactura;
    document.getElementById('currentDate').textContent = this.facturaTemp.fecha.toLocaleDateString();
    document.getElementById('currentTime').textContent = this.facturaTemp.hora;

    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    this.cargarResumenPedido();
    requestAnimationFrame(() => modal.classList.add('show'));
  }

  ocultarCheckoutModal() {
    const modal = document.getElementById('checkoutOverlay');
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(() => modal.classList.add('hidden'), 300);
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

      const nombreValidado = Validar.nombreBP(nombre);
      if (!nombreValidado) {
        alert('El nombre ingresado no es válido. Debe tener entre 3 y 70 caracteres y solo contener letras, números y caracteres básicos.');
        return;
      }

      const telefonoValidado = await Validar.telefonoBP(telefono, this.clienteService);
      if (!telefonoValidado) {
        alert('El teléfono ingresado no es válido. Ingrese un número válido de Ecuador.');
        return;
      }

      const direccionValidada = Validar.direccionBP(direccion);
      if (!direccionValidada) {
        alert('La dirección ingresada no es válida. Debe tener entre 3 y 256 caracteres.');
        return;
      }

      const carrito = app.carritoController.carrito;
      const stockSuficiente = await this.validarStockCarrito(carrito);
      if (!stockSuficiente) {
        return;
      }

      this.btnConfirmCheckout.disabled = true;
      this.btnConfirmCheckout.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

      // Verificar si el cliente ya existe por teléfono
      let cliente = await this.clienteService.obtenerClientePorTelefono(telefonoValidado);
      if (cliente) {
        // Cliente existente: actualizar datos si cambiaron y aumentar contador
        if (cliente.nombre !== nombreValidado || cliente.direccion !== direccionValidada) {
          await this.clienteService.actualizarCliente(cliente.id, {
            nombre: nombreValidado,
            telefono: telefonoValidado,
            direccion: direccionValidada
          });
          cliente = await this.clienteService.obtenerClientePorId(cliente.id); // Refrescar datos
        }
        await this.clienteService.incrementarContadorCliente(cliente.id);
      } else {
        // Cliente nuevo: crear con contador en 1
        const clienteData = new Cliente(nombreValidado, telefonoValidado, direccionValidada);
        cliente = await this.clienteService.agregarCliente(clienteData);
        if (!cliente) {
          throw new Error('No se pudo registrar el cliente.');
        }
        await this.clienteService.incrementarContadorCliente(cliente.id); // Primera compra
      }

      const factura = await this.facturaService.generarFactura(cliente, carrito, this.facturaTemp);
      this.facturaTemp = null;

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

  async mostrarFactura(factura) {
    try {
      const invoiceModal = document.getElementById('invoiceModal');
      const invoiceDetails = document.getElementById('invoiceDetails');
      if (!invoiceModal || !invoiceDetails) {
        throw new Error('Elementos del modal de factura no encontrados');
      }
      invoiceDetails.innerHTML = InvoiceTemplate.generarHTML(factura, false);
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
    invoiceModal.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(() => invoiceModal.classList.add('hidden'), 300);
  }
}

export { CheckoutController };