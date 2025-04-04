import {app} from '../AppFactory.js';
import {Carrito} from '../../../../BackEnd/src/models/Carrito.js';

class CarritoController {
  constructor() {
    this.carrito = new Carrito();
    this.sincronizarCarrito();
    this.cartSection = document.getElementById('cartSection');
    this.cartModal = document.getElementById('cartModal');
    this.cartTable = document.getElementById('cartTable');
    this.cartTotal = document.getElementById('cartTotal');
    this.cartActions = document.getElementById('cartActions');
    this.btnCheckout = document.getElementById('btnCheckout');
    this.btnEmptyCart = document.getElementById('btnEmptyCart');

    this.logMissingElements();
    this.setupEventListeners();
  }

  async sincronizarCarrito() {
    try {
      const actualizado = await this.carrito.sincronizarCarritoConProductos(app.productoService);
      if (actualizado) {
        console.log('Carrito sincronizado con datos actualizados');
        this.actualizarCarrito();
      }
    } catch (error) {
      console.error('Error al sincronizar carrito:', error);
    }
  }

  logMissingElements() {
    const elements = [
      {name: 'cartSection', element: this.cartSection},
      {name: 'cartModal', element: this.cartModal},
      {name: 'cartTable', element: this.cartTable},
      {name: 'cartTotal', element: this.cartTotal},
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
    }
    if (this.btnEmptyCart) {
      this.btnEmptyCart.addEventListener('click', this.vaciarCarrito.bind(this));
    }
    this.setupEliminarItemListeners();
  }

  actualizarCarrito() {
    const container = this.cartSection;
    container.innerHTML = '';

    if (this.carrito.items.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.classList.add('cart-empty');
      emptyMessage.innerHTML = `<i class="fas fa-shopping-bag fa-3x" style="color: #ccc; margin-bottom: 15px"></i><br>Tu carrito está vacío`;
      container.appendChild(emptyMessage);
      this.cartTotal.textContent = "";
      if (this.cartActions) {
        this.cartActions.style.display = 'none';
      }
      return;
    }

    if (this.cartActions) {
      this.cartActions.style.display = 'flex';
    }

    const itemsWrapper = document.createElement('div');
    itemsWrapper.classList.add('cart-items-wrapper');

    this.carrito.items.forEach(item => {
      const card = document.createElement('div');
      card.classList.add('cart-card');

      const img = document.createElement('img');
      img.src = item.imagen;
      img.alt = item.nombre;
      img.classList.add('cart-card-image');
      card.appendChild(img);

      const details = document.createElement('div');
      details.classList.add('cart-card-details');
      details.innerHTML = `
        <div class="cart-card-product">${item.nombre}</div>
        <div class="cart-card-quantity">
          Cantidad: 
          <button class="quantity-btn decrease" data-id="${item.productoId}">-</button>
          <span class="quantity-value">${item.cantidad}</span>
          <button class="quantity-btn increase" data-id="${item.productoId}">+</button>
<!--          (Stock: ${item.stock})-->
        </div>
        <div class="cart-card-info">Precio: $${item.precio.toFixed(2)}</div>
        <div class="cart-card-info">Subtotal: $${item.subtotal.toFixed(2)}</div>
      `;
      card.appendChild(details);

      const removeBtn = document.createElement('button');
      removeBtn.classList.add('action-button', 'delete-button', 'remove-item');
      removeBtn.textContent = 'X';
      removeBtn.setAttribute('data-id', item.productoId);
      removeBtn.addEventListener('click', () => {
        const cardElement = removeBtn.closest('.cart-card');
        if (cardElement) {
          cardElement.classList.add('fade-out');
          cardElement.addEventListener('transitionend', () => {
            this.carrito.eliminarItemDelCarrito(item.productoId);
            this.actualizarCarrito();
            app.tiendaController.actualizarContadorCarrito();
          }, { once: true });
        }
      });
      card.appendChild(removeBtn);

      // Agregar event listeners para los botones de cantidad
      const decreaseBtn = details.querySelector('.decrease');
      const increaseBtn = details.querySelector('.increase');

      decreaseBtn.addEventListener('click', async () => {
        if (item.cantidad > 1) {
          item.cantidad--;
          item.subtotal = item.precio * item.cantidad;
          this.actualizarCarrito();
          app.tiendaController.actualizarContadorCarrito();
        }
      });

      increaseBtn.addEventListener('click', async () => {
        const producto = await app.productoService.obtenerProductoPorId(item.productoId);
        if (item.cantidad < producto.stock) {
          item.cantidad++;
          item.subtotal = item.precio * item.cantidad;
          this.actualizarCarrito();
          app.tiendaController.actualizarContadorCarrito();
        } else {
          alert(`No hay suficiente stock para ${item.nombre}. Stock disponible: ${producto.stock}`);
        }
      });

      itemsWrapper.appendChild(card);
    });

    container.appendChild(itemsWrapper);
    this.cartTotal.textContent = `Total: $${this.carrito.calcularTotalCarrito().toFixed(2)}`;
  }

  setupEliminarItemListeners() {
    this.cartTable.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-item')) {
        const productoId = parseInt(e.target.dataset.id);
        this.carrito.eliminarItemDelCarrito(productoId);
        this.actualizarCarrito();
        app.tiendaController.actualizarContadorCarrito();
      }
    });
  }

  vaciarCarrito() {
    if (confirm("¿Estás seguro de vaciar el carrito?")) {
      const cards = this.cartSection.querySelectorAll('.cart-card');
      let transitionCount = cards.length;
      if (transitionCount === 0) {
        this.carrito.vaciarCarrito();
        this.actualizarCarrito();
        app.tiendaController.actualizarContadorCarrito();
        return;
      }
      cards.forEach(card => {
        card.classList.add('fade-out');
        card.addEventListener('transitionend', () => {
          transitionCount--;
          if (transitionCount === 0) {
            this.carrito.vaciarCarrito();
            this.actualizarCarrito();
            app.tiendaController.actualizarContadorCarrito();
          }
        }, { once: true });
      });
    }
  }

  async procederAlPago() {
    if (this.carrito.items.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    this.ocultarModalCarrito();
    app.checkoutController.mostrarCheckoutModal();
  }

  mostrarCarrito() {
    this.sincronizarCarrito().then(() => {
      const cartSection = document.getElementById('cartSection');
      if (cartSection) {
        cartSection.classList.remove('hidden');
      }

      this.cartModal.classList.remove('hidden');
      setTimeout(() => {
        this.cartModal.classList.add('show');
        document.body.classList.add('modal-open');
      }, 10);
      this.actualizarCarrito();
    });
  }

  ocultarModalCarrito() {
    this.cartModal.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
      this.cartModal.classList.add('hidden');
    }, 300);
  }
}

export {CarritoController};