// FrontEnd/ui/controllers/TiendaController.js
import {app} from '../AppFactory.js';
import {appService} from '../services/UшымтаService.js';

class TiendaController {
  constructor(productoService) {
    this.productoService = productoService;
    this.tiendaSection = document.getElementById('tienda');
    this.productList = document.getElementById('productList');
    this.cartCount = document.getElementById('cartCount');

    //  Delegación de eventos:
    this.productList.addEventListener('click', this.handleAddToCartClick.bind(this));
    this.aplicarFiltros = this.aplicarFiltros.bind(this); // Mantener esto para los filtros.
  }

  async handleAddToCartClick(event) {
    const addToCartButton = event.target.closest('.add-to-cart');
    if (!addToCartButton) return;
  
    const productoId = parseInt(addToCartButton.dataset.id);
  
    if (isNaN(productoId)) {
      console.error("handleAddToCartClick: productoId es NaN!", event.target);
      alert("Error: ID de producto inválido.");
      return;
    }
  
    if (!this.productoService) {
      console.error("handleAddToCartClick: this.productoService es undefined!");
      alert("Error: Servicio de productos no disponible.");
      return;
    }
  
    try {
      const producto = await this.productoService.obtenerProductoPorId(productoId);
  
      if (producto && producto.stock > 0) {
        // Se cambia la llamada de agregarItemAlCarrito a agregarItem
        app.carritoController.carrito.agregarItem(producto);
        this.actualizarContadorCarrito();
  
        addToCartButton.textContent = "✓ Agregado";
        setTimeout(() => {
          addToCartButton.textContent = "Agregar al Carrito";
        }, 1500);
      } else {
        alert("Lo sentimos, no hay stock disponible para este producto.");
      }
    } catch (error) {
      console.error("Error al agregar producto al carrito:", error);
      alert("Hubo un error al agregar el producto al carrito.");
    }
  }

  async cargarProductos(filters = {}) {
    try {
      const productos = await this.productoService.obtenerProductos(filters);

      if (!productos || !Array.isArray(productos)) {
        this.productList.innerHTML = '<div class="cart-empty">No se encontraron productos</div>';
        return;
      }

      this.productList.innerHTML = ''; // Limpiar los productos anteriores.

      productos.forEach(producto => {
        const productElement = this.createProductElement(producto);
        this.productList.appendChild(productElement);
      });

    } catch (error) {
      console.error("Error fetching products:", error);
      this.productList.innerHTML = '<div class="cart-empty">Error al cargar productos</div>';
    }
  }

  createProductElement(producto) {
    const productElement = document.createElement('div');
    productElement.className = 'product';
    productElement.innerHTML = `
          <img src="${producto.imagen}" alt="${producto.nombre}" class="product-image">
          <div class="product-info">
            <div class="product-title">${producto.nombre}</div>
            <div class="product-category">Categoría: ${producto.categoriaNombre}</div>
            <div class="product-brand">Marca: ${producto.marcaNombre}</div>
            <div class="product-price">$${producto.pvp}</div>
            <div class="product-description">${producto.descripcion}</div>
            <button class="btn btn-primary btn-block add-to-cart" data-id="${producto.id}">
              Agregar al Carrito
            </button>
          </div>
        `;
    return productElement;
  }

  async cargarFiltros() {
    const categoriaSelect = document.getElementById('filterCategoria');
    const marcaSelect = document.getElementById('filterMarca');

    try {
      // Usar datos en caché vía appService
      const categorias = await appService.getCategorias();
      const marcas = await appService.getMarcas();

      // Llenar los selects, con datos obtenidos.
      categoriaSelect.innerHTML = '<option value="">Todas las categorías</option>';
      categorias.forEach(categoria => {
        categoriaSelect.innerHTML += `<option value="${categoria.id}">${categoria.nombre}</option>`;
      });
      marcaSelect.innerHTML = '<option value="">Todas las marcas</option>';
      marcas.forEach(marca => {
        marcaSelect.innerHTML += `<option value="${marca.id}">${marca.nombre}</option>`;
      });

    } catch (error) {
      console.error("Error al cargar los filtros:", error);
      alert("No se pudieron cargar los filtros.");
    }
    this.setupFiltroListeners();
  }

  setupFiltroListeners() {
    // Obtener todos los elementos
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    const filterCategoria = document.getElementById('filterCategoria');
    const filterMarca = document.getElementById('filterMarca');
    const sortBy = document.getElementById('sortBy');
    // Clonar, para que tenga unicos eventListener:
    const newSearchButton = searchButton.cloneNode(true);
    searchButton.parentNode.replaceChild(newSearchButton, searchButton);

    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);

    const newFilterCategoria = filterCategoria.cloneNode(true);
    filterCategoria.parentNode.replaceChild(newFilterCategoria, filterCategoria);

    const newFilterMarca = filterMarca.cloneNode(true);
    filterMarca.parentNode.replaceChild(newFilterMarca, filterMarca);

    const newSortBy = sortBy.cloneNode(true);
    sortBy.parentNode.replaceChild(newSortBy, sortBy);

    // Poner todos los listeners ahora, en los nuevos ya clonados.
    newSearchButton.addEventListener('click', async () => {
      await this.aplicarFiltros();
    });
    newSearchInput.addEventListener('keyup', async (e) => {
      if (e.key === 'Enter') {
        await this.aplicarFiltros(); //
      }
    });

    newFilterCategoria.addEventListener('change', () => this.aplicarFiltros()); //
    newFilterMarca.addEventListener('change', () => this.aplicarFiltros()); //
    newSortBy.addEventListener('change', () => this.aplicarFiltros()); //
  }

  async aplicarFiltros() {
    const categoriaValue = document.getElementById('filterCategoria').value;  // Select.
    const marcaValue = document.getElementById('filterMarca').value;       //
    const searchValue = document.getElementById('searchInput').value;       //
    const sortValue = document.getElementById('sortBy').value;

    const filters = {  // Crea el objeto, con propiedades de los filtros
      categoria: categoriaValue ? parseInt(categoriaValue) : null,
      marca: marcaValue ? parseInt(marcaValue) : null,
      search: searchValue,
      sort: sortValue !== 'default' ? sortValue : null  //Si se ha escogido, ese valor,  Si no: null
    };
    await this.cargarProductos(filters);
  }

  actualizarContadorCarrito() {
    const cartCountEl = document.getElementById('cartCount');
    // Cambiar obtenerCantidadItems() por obtenerCantidadTotalItems()
    cartCountEl.textContent = app.carritoController.carrito.obtenerCantidadTotalItems();
}

  async mostrarTienda() {
      const adminSection = document.getElementById('admin');
      const cartSection = document.getElementById('cartSection');
      const checkoutSection = document.getElementById('checkoutSection');
      
      if (adminSection) adminSection.classList.add('hidden');
      if (cartSection) cartSection.classList.add('hidden');
      if (checkoutSection) checkoutSection.classList.add('hidden');
      
      // Actualizar la referencia al tiendaSection
      this.tiendaSection = document.getElementById('tienda');
      if (this.tiendaSection) {
          this.tiendaSection.classList.remove('hidden');
          await this.cargarProductos();
          this.tiendaSection.scrollTo(0, 0);
      }
  }
}

export {TiendaController};