class Carrito {
    constructor() {
        
      // Cargar items desde localStorage, o inicializar como arreglo vacío
      this.items = JSON.parse(localStorage.getItem('cartItems')) || [];
    }
  
    actualizarLocalStorage() {
      localStorage.setItem('cartItems', JSON.stringify(this.items));
    }
  
    agregarItem(producto) {
      // Buscar si el producto ya está en el carrito
      const index = this.items.findIndex(item => item.productoId === producto.id);
      if (index >= 0) {
        this.items[index].cantidad += 1;
        this.items[index].subtotal = this.items[index].cantidad * producto.precio;
      } else {
        this.items.push({
          productoId: producto.id,
          imagen: producto.imagen,
          nombre: producto.nombre,
          cantidad: 1,
          precio: producto.precio,
          subtotal: producto.precio
        });
      }
      this.actualizarLocalStorage();
    }
  
    eliminarItemDelCarrito(productoId) {
      this.items = this.items.filter(item => item.productoId !== productoId);
      this.actualizarLocalStorage();
    }
  
    vaciarCarrito() {
      this.items = [];
      this.actualizarLocalStorage();
    }
  
    calcularTotalCarrito() {
      return this.items.reduce((total, item) => total + item.subtotal, 0);
    }
  
    obtenerCantidadTotalItems() {
      return this.items.reduce((total, item) => total + item.cantidad, 0);
    }
  }
  
  export { Carrito };