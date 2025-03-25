// FrontEnd/ui/controllers/CarritoController.js
import {app} from '../AppFactory.js'; //  INSTANCIA ÚNICA!
import {Carrito} from '../../../../BackEnd/src/models/Carrito.js';

/**
 * Controlador para la gestión del carrito de compras.
 */
class CarritoController {
  constructor() {
    //this.carrito = tiendaController.carrito; // ¡YA NO! El carrito se accede desde app.
    this.carrito = new Carrito(); // Ahora, el carrito es parte de CarritoController, es independiente
    // Elementos del DOM
    this.cartSection = document.getElementById('cartSection');
    this.cartTable = document.getElementById('cartTable');
    this.cartTotal = document.getElementById('cartTotal');
    this.emptyCart = document.getElementById('emptyCart');
    this.cartActions = document.getElementById('cartActions');
    this.btnCheckout = document.getElementById('btnCheckout');
    this.btnEmptyCart = document.getElementById('btnEmptyCart');

    // Inicializar listeners de eventos
    this.setupEventListeners();
  }

  setupEventListeners() {
    //Botones
    this.btnCheckout.addEventListener('click', this.procederAlPago.bind(this));
    this.btnEmptyCart.addEventListener('click', this.vaciarCarrito.bind(this));
    this.setupEliminarItemListeners(); // Aseguramos que esté aquí. Y se ejecuta al inicio.
  }

  /**
   * Actualiza la vista del carrito, mostrando los productos y el total.
   */
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

      for (const item of this.carrito.items) { // Usa for...of
        const tr = document.createElement('tr');
        tr.innerHTML = `
                 <td>${item.producto.nombre}</td>
                 <td>${item.cantidad}</td>
                <td>$${item.precio.toFixed(2)}</td>
                  <td>$${item.subtotal.toFixed(2)}</td>
                <td>
                    <button class="action-button delete-button remove-item" data-id="${item.producto.id}">X</button>
                   </td>
            `;
        tbody.appendChild(tr);
      }

      this.cartTotal.textContent = `Total: $${this.carrito.calcularTotalCarrito().toFixed(2)}`;
    }
  }

  //Aquí no va por que es parte de los listeners
  setupEliminarItemListeners() {
    this.cartTable.addEventListener('click', (e) => { // Usa delegación de eventos
      if (e.target.classList.contains('remove-item')) { // Verifica si es un boton de eliminar
        const productoId = parseInt(e.target.dataset.id);
        this.carrito.eliminarItemDelCarrito(productoId);
        this.actualizarCarrito();          // Actualizar IU
        // Actualiza el contador en la tienda:
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
    async procederAlPago(){
      if (this.carrito.items.length === 0) {
        alert('El carrito está vacío');
        return;
      }
// Ocultar el carrito y mostrar la sección de checkout
      this.ocultarCarrito(); // Oculta antes de mostrar el checkout.
      await app.checkoutController.mostrarSeccionCheckout(); // instancia correcta.
    }
    mostrarCarrito()
    {
      this.cartSection.classList.remove('hidden'); // Mostrar
      this.actualizarCarrito(); // Actualizar visualización.
      window.scrollTo(0, this.cartSection.offsetTop - 20);
    }

    ocultarCarrito()
    {
      this.cartSection.classList.add('hidden'); // Metodo Ocultar
    }
    //const carritoController = new CarritoController(); // INSTANCIA YA NO SE CREA AQUI
}
export {CarritoController}; // Exporta la clase