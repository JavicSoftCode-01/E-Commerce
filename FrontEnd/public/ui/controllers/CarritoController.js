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
  //  this.emptyCart = document.getElementById('emptyCart');
    this.cartActions = document.getElementById('cartActions');
    this.btnCheckout = document.getElementById('btnCheckout');
    this.btnEmptyCart = document.getElementById('btnEmptyCart');

    this.logMissingElements();

   // this.carrito = new Carrito();

    this.setupEventListeners();
  }

  logMissingElements() {
    const elements = [
      {name: 'cartSection', element: this.cartSection},
      {name: 'cartModal', element: this.cartModal},
      {name: 'cartTable', element: this.cartTable},
      {name: 'cartTotal', element: this.cartTotal},
     // {name: 'emptyCart', element: this.emptyCart},
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

  // actualizarCarrito() {
  //   const tbody = this.cartTable.querySelector('tbody');
  //   tbody.innerHTML = ''; // Limpia el contenido actual de la tabla.
  //
  //   if (this.carrito.items.length === 0) {
  //     this.cartTable.classList.add('hidden');
  //     this.cartActions.classList.add('hidden');
  //     this.emptyCart.classList.remove('hidden');
  //     this.cartTotal.textContent = "Total: $0";
  //
  //   } else {
  //     this.emptyCart.classList.add('hidden');
  //     this.cartTable.classList.remove('hidden');
  //     this.cartActions.classList.remove('hidden');
  //
  //     for (const item of this.carrito.items) {
  //       const tr = document.createElement('tr');
  //       tr.innerHTML = `
  //               <td><img src="${item.imagen}" alt="${item.nombre}" class="cart-item-image"></td>
  //                <td>${item.nombre}</td>
  //                <td>${item.cantidad}</td>
  //               <td>$${item.precio.toFixed(2)}</td>
  //                 <td>$${item.subtotal.toFixed(2)} <span style="margin-left: 50px"><button class="action-button delete-button remove-item" data-id="${item.productoId}">X</button></span></td>
  //
  //           `;
  //       tbody.appendChild(tr);
  //     }
  //
  //     this.cartTotal.textContent = `Total: $${this.carrito.calcularTotalCarrito().toFixed(2)}`;
  //   }
  // }
  // actualizarCarrito() {
  //   // Limpiar el contenedor del carrito.
  //   const container = this.cartSection;
  //   container.innerHTML = '';
  //
  //   if (this.carrito.items.length === 0) {
  //     const emptyMessage = document.createElement('div');
  //     emptyMessage.classList.add('cart-empty');
  //     emptyMessage.innerHTML = `<i class="fas fa-shopping-bag fa-3x" style="color: #ccc; margin-bottom: 15px"></i><br>Tu carrito está vacío`;
  //     container.appendChild(emptyMessage);
  //     this.cartTotal.textContent = "Total: $0";
  //     return;
  //   }
  //
  //   // Por cada item en el carrito se crea una "tarjeta".
  //   this.carrito.items.forEach(item => {
  //     const card = document.createElement('div');
  //     card.classList.add('cart-card');
  //
  //     // Imagen del producto.
  //     const img = document.createElement('img');
  //     img.src = item.imagen;
  //     img.alt = item.nombre;
  //     img.classList.add('cart-card-image');
  //     card.appendChild(img);
  //
  //     // Contenedor de detalles.
  //     const details = document.createElement('div');
  //     details.classList.add('cart-card-details');
  //     details.innerHTML = `
  //           <div class="cart-card-product">${item.nombre}</div>
  //           <div class="cart-card-info">Cantidad: ${item.cantidad}</div>
  //           <div class="cart-card-info">Precio Unitario: $${item.precio.toFixed(2)}</div>
  //           <div class="cart-card-info">Subtotal: $${item.subtotal.toFixed(2)}</div>
  //       `;
  //     card.appendChild(details);
  //
  //     // Botón para eliminar el producto.
  //     const removeBtn = document.createElement('button');
  //     removeBtn.classList.add('action-button', 'delete-button', 'remove-item');
  //     removeBtn.textContent = 'X';
  //     removeBtn.setAttribute('data-id', item.productoId);
  //     removeBtn.addEventListener('click', () => {
  //       this.carrito.eliminarItemDelCarrito(item.productoId);
  //       this.actualizarCarrito();
  //       app.tiendaController.actualizarContadorCarrito();
  //     });
  //     card.appendChild(removeBtn);
  //
  //     container.appendChild(card);
  //   });
  //
  //   this.cartTotal.textContent = `Total: $${this.carrito.calcularTotalCarrito().toFixed(2)}`;
  // }
//   actualizarCarrito() {
//     // Limpiar el contenedor principal del carrito.
//     const container = this.cartSection;
//     container.innerHTML = '';
//
//     if (this.carrito.items.length === 0) {
//       const emptyMessage = document.createElement('div');
//       emptyMessage.classList.add('cart-empty');
//       emptyMessage.innerHTML = `<i class="fas fa-shopping-bag fa-3x" style="color: #ccc; margin-bottom: 15px"></i><br>Tu carrito está vacío`;
//       container.appendChild(emptyMessage);
//       this.cartTotal.textContent = "Total: $0";
//       return;
//     }
//
//     // Crear un contenedor interno con scroll para limitar la cantidad visible (3 tarjetas)
//     const itemsWrapper = document.createElement('div');
//     itemsWrapper.classList.add('cart-items-wrapper');
//
//     // Por cada item en el carrito se crea una "tarjeta"
//     this.carrito.items.forEach(item => {
//       const card = document.createElement('div');
//       card.classList.add('cart-card');
//
//       // Imagen del producto.
//       const img = document.createElement('img');
//       img.src = item.imagen;
//       img.alt = item.nombre;
//       img.classList.add('cart-card-image');
//       card.appendChild(img);
//
//       // Contenedor de detalles.
//       const details = document.createElement('div');
//       details.classList.add('cart-card-details');
//       details.innerHTML = `
//             <div class="cart-card-product">${item.nombre}</div>
//             <div class="cart-card-info">Cantidad: ${item.cantidad}</div>
//             <div class="cart-card-info">Precio Unitario: $${item.precio.toFixed(2)}</div>
//             <div class="cart-card-info">Subtotal: $${item.subtotal.toFixed(2)}</div>
//         `;
//       card.appendChild(details);
//
//       // Botón para eliminar el producto.
//       const removeBtn = document.createElement('button');
//       removeBtn.classList.add('action-button', 'delete-button', 'remove-item');
//       removeBtn.textContent = 'X';
//       removeBtn.setAttribute('data-id', item.productoId);
//       removeBtn.addEventListener('click', () => {
//         this.carrito.eliminarItemDelCarrito(item.productoId);
//         this.actualizarCarrito();
//         app.tiendaController.actualizarContadorCarrito();
//       });
//       card.appendChild(removeBtn);
//
//       itemsWrapper.appendChild(card);
//     });
//
//     container.appendChild(itemsWrapper);
//     this.cartTotal.textContent = `Total: $${this.carrito.calcularTotalCarrito().toFixed(2)}`;
// }
  actualizarCarrito() {
    // Limpiar el contenedor principal del carrito.
    const container = this.cartSection;
    container.innerHTML = '';

    // Si no hay ítems, mostrar mensaje y ocultar acciones.
    if (this.carrito.items.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.classList.add('cart-empty');
      emptyMessage.innerHTML = `<i class="fas fa-shopping-bag fa-3x" style="color: #ccc; margin-bottom: 15px"></i><br>Tu carrito está vacío`;
      container.appendChild(emptyMessage);
      this.cartTotal.textContent = "";
      // Ocultar el footer de acciones
      if (this.cartActions) {
        this.cartActions.style.display = 'none';
      }
      return;
    }

    // Si hay ítems, asegurarse de que se muestren las acciones.
    if (this.cartActions) {
      this.cartActions.style.display = 'flex'; // O el display que uses habitualmente.
    }

    // Crear un contenedor interno con scroll que muestra hasta 3 tarjetas
    const itemsWrapper = document.createElement('div');
    itemsWrapper.classList.add('cart-items-wrapper');

    // Por cada ítem en el carrito se crea una "tarjeta"
    this.carrito.items.forEach(item => {
      const card = document.createElement('div');
      card.classList.add('cart-card');
    
      // Imagen del producto.
      const img = document.createElement('img');
      img.src = item.imagen;
      img.alt = item.nombre;
      img.classList.add('cart-card-image');
      card.appendChild(img);
    
      // Contenedor de detalles.
      const details = document.createElement('div');
      details.classList.add('cart-card-details');
      details.innerHTML = `
        <div class="cart-card-product">${item.nombre}</div>
        <div class="cart-card-info">Cantidad: ${item.cantidad}</div>
        <div class="cart-card-info">Precio Unitario: $${item.precio.toFixed(2)}</div>
        <div class="cart-card-info">Subtotal: $${item.subtotal.toFixed(2)}</div>
      `;
      card.appendChild(details);
    
      // Botón para eliminar el producto con animación.
      const removeBtn = document.createElement('button');
      removeBtn.classList.add('action-button', 'delete-button', 'remove-item');
      removeBtn.textContent = 'X';
      removeBtn.setAttribute('data-id', item.productoId);
      removeBtn.addEventListener('click', () => {
        // Aplica la animación agregando la clase 'fade-out'
        const cardElement = removeBtn.closest('.cart-card');
        if (cardElement) {
          cardElement.classList.add('fade-out');
          // Una vez terminada la transición, elimina el ítem y actualiza la IU
          cardElement.addEventListener('transitionend', () => {
            this.carrito.eliminarItemDelCarrito(item.productoId);
            this.actualizarCarrito();
            app.tiendaController.actualizarContadorCarrito();
          }, { once: true });
        }
      });
      card.appendChild(removeBtn);
    
      itemsWrapper.appendChild(card);
    });

    container.appendChild(itemsWrapper);
    this.cartTotal.textContent = `Total: $${this.carrito.calcularTotalCarrito().toFixed(2)}`;
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
      // Obtén todos los elementos de tarjeta
      const cards = this.cartSection.querySelectorAll('.cart-card');
      let transitionCount = cards.length;
      if(transitionCount === 0) {
        // Si no hay tarjetas, simplemente vacía
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
            // Una vez terminada la animación de todas las tarjetas
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
  
    // Hide cart modal with animation
    this.ocultarModalCarrito();
    
    // Show checkout modal and load cart items
    app.checkoutController.mostrarCheckoutModal();
  }

  mostrarCarrito() {
    // Remover la clase "hidden" del contenedor de items del carrito
    const cartSection = document.getElementById('cartSection');
    if (cartSection) {
        cartSection.classList.remove('hidden');
    }
    
    // Mostrar el modal del carrito
    this.cartModal.classList.remove('hidden');
    setTimeout(() => {
      this.cartModal.classList.add('show');
      document.body.classList.add('modal-open');
    }, 10);
    this.actualizarCarrito();
}

  // ocultarCarrito() {
  //   this.cartSection.classList.add('hidden'); // Metodo Ocultar
  // }
  ocultarModalCarrito() {
    // Inicia la animación de salida quitando la clase "show"
    this.cartModal.classList.remove('show');
    // Reactiva el scroll del body
    document.body.classList.remove('modal-open');
    // Espera a que la animación termine para ocultar el modal completamente
    setTimeout(() => {
      this.cartModal.classList.add('hidden');
    }, 300); // Debe coincidir con la duración de la transición en el CSS (0.3s)
  }

  // ocultarModalCarrito() {
  //   this.cartModal.classList.add('hidden'); // Metodo Ocultar
  // }
}

export {CarritoController};