// FrontEnd/ui/controllers/CarritoController.js

import {app} from '../AppFactory.js';
import {Carrito} from '../../../../BackEnd/src/models/Carrito.js';

class CarritoController {
  constructor() {

    this.carrito = new Carrito(); // Ahora, el carrito es parte de CarritoController, es independiente

    this.cartSection = document.getElementById('cartSection');
    this.cartModal = document.getElementById('cartModal');
    this.cartTable = document.getElementById('cartTable');
    this.cartTotal = document.getElementById('cartTotal');
    this.emptyCart = document.getElementById('emptyCart');
    this.cartActions = document.getElementById('cartActions');
    this.btnCheckout = document.getElementById('btnCheckout');
    this.btnEmptyCart = document.getElementById('btnEmptyCart');

    this.logMissingElements();

    this.carrito = new Carrito();

    this.setupEventListeners();
  }

  logMissingElements() {
    const elements = [
      {name: 'cartSection', element: this.cartSection},
      {name: 'cartModal', element: this.cartModal},
      {name: 'cartTable', element: this.cartTable},
      {name: 'cartTotal', element: this.cartTotal},
      {name: 'emptyCart', element: this.emptyCart},
      {name: 'cartActions', element: this.cartActions},
      {name: 'btnCheckout', element: this.btnCheckout},
      {name: 'btnEmptyCart', element: this.btnEmptyCart}
    ];

    elements.forEach(el => {
      if (!el.element) {
        console.error(`Element not found: ${el.name}`);
      }
    });
  }

  setupEventListeners() {
    if (this.btnCheckout) {
      this.btnCheckout.addEventListener('click', this.procederAlPago.bind(this));
    } else {
      console.error('Checkout button not found');
    }

    if (this.btnEmptyCart) {
      this.btnEmptyCart.addEventListener('click', this.vaciarCarrito.bind(this));
    } else {
      console.error('Empty cart button not found');
    }

    this.setupEliminarItemListeners();
  }

  actualizarCarrito() {
    const tbody = this.cartTable.querySelector('tbody');
    tbody.innerHTML = ''; // Limpia el contenido actual de la tabla.

    if (this.carrito.items.length === 0) {
      this.cartTable.classList.add('hidden');
      this.cartActions.classList.add('hidden');
      this.emptyCart.classList.remove('hidden');
      this.cartTotal.textContent = "Total: $0";

    } else {
      this.emptyCart.classList.add('hidden');
      this.cartTable.classList.remove('hidden');
      this.cartActions.classList.remove('hidden');

      for (const item of this.carrito.items) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
                 <td>${item.nombre}</td>
                 <td>${item.cantidad}</td>
                <td>$${item.precio.toFixed(2)}</td>
                  <td>$${item.subtotal.toFixed(2)}</td>
                <td>
                    <button class="action-button delete-button remove-item" data-id="${item.productoId}">X</button>
                   </td>
            `;
        tbody.appendChild(tr);
      }

      this.cartTotal.textContent = `Total: $${this.carrito.calcularTotalCarrito().toFixed(2)}`;
    }
  }

  setupEliminarItemListeners() {
    this.cartTable.addEventListener('click', (e) => { // Usa delegación de eventos
      if (e.target.classList.contains('remove-item')) { // Verifica si es un boton de eliminar
        const productoId = parseInt(e.target.dataset.id);
        this.carrito.eliminarItemDelCarrito(productoId);
        this.actualizarCarrito();          // Actualizar IU
        app.tiendaController.actualizarContadorCarrito(); // Llama al método *correcto*.
      }
    });
  }

  vaciarCarrito() {
    if (confirm("¿Estás seguro de vaciar el carrito?")) {
      this.carrito.vaciarCarrito(); //  método en *esta* instancia.
      this.actualizarCarrito();    // Actualiza *esta* vista.
      // Actualizar *también* el contador en la tienda:
      app.tiendaController.actualizarContadorCarrito(); // Llama al método *correcto*.
    }
  }

  async procederAlPago() {
    if (this.carrito.items.length === 0) {
      alert('El carrito está vacío');
      return;
    }
// Ocultar el carrito y mostrar la sección de checkout
    this.ocultarCarrito(); // Oculta antes de mostrar el checkout.
    await app.checkoutController.mostrarSeccionCheckout(); // instancia correcta.
  }

  mostrarCarrito() {
    // Add comprehensive error checking
    console.log('Intentando mostrar carrito');

    if (!this.cartSection) {
      console.error('cartSection element is null');
      return;
    }

    if (!this.cartModal) {
      console.error('cartModal element is null');
      return;
    }

    // Remove 'hidden' class from both cart section and cart modal
    this.cartSection.classList.remove('hidden');
    this.cartModal.classList.remove('hidden');

    this.actualizarCarrito();

    // Scroll to the top of the cart section if possible
    if (this.cartSection) {
      window.scrollTo(0, this.cartSection.offsetTop - 20);
    }
  }

  ocultarCarrito() {
    this.cartSection.classList.add('hidden'); // Metodo Ocultar
  }
}

export {CarritoController};