class Carrito {
  constructor() {
      this.items = JSON.parse(localStorage.getItem('cartItems')) || [];
      
  }

  actualizarLocalStorage() {
      localStorage.setItem('cartItems', JSON.stringify(this.items));
  }

 async sincronizarCarritoConProductos(productoService) {
    try {
        let actualizacionNecesaria = false;
        
        for (let item of this.items) {
            // Obtener datos actualizados del producto
            const productoActualizado = await productoService.obtenerProductoPorId(item.productoId);
            
            if (productoActualizado) {
                // Verificar cambios en el pvp
                if (item.precio !== productoActualizado.pvp) {
                    console.log(`Actualizando precio de ${item.nombre} de ${item.precio} a ${productoActualizado.pvp}`);
                    item.precio = productoActualizado.pvp;
                    item.subtotal = item.cantidad * productoActualizado.pvp;
                    actualizacionNecesaria = true;
                }
                
                // Actualizar otros campos relevantes
                if (item.nombre !== productoActualizado.nombre) {
                    item.nombre = productoActualizado.nombre;
                    actualizacionNecesaria = true;
                }
                if (item.imagen !== productoActualizado.imagen) {
                    item.imagen = productoActualizado.imagen;
                    actualizacionNecesaria = true;
                }
            }
        }
        
        if (actualizacionNecesaria) {
            this.actualizarLocalStorage();
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error al sincronizar carrito:', error);
        return false;
    }
}

  agregarItem(producto) {
      // Buscar si el producto ya está en el carrito
      const index = this.items.findIndex(item => item.productoId === producto.id);
      if (index >= 0) {
          this.items[index].cantidad += 1;
          this.items[index].subtotal = this.items[index].cantidad * producto.pvp; // Usar pvp
      } else {
          this.items.push({
              productoId: producto.id,
              imagen: producto.imagen,
              nombre: producto.nombre,
              cantidad: 1,
              precio: producto.pvp, // Usar pvp en lugar de precio
              subtotal: producto.pvp, // Usar pvp
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