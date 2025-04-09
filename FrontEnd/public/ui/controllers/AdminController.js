// FrontEnd/ui/controllers/AdminController.js
import {app} from '../AppFactory.js';
import {Categoria} from '../../../../BackEnd/src/models/Categoria.js';
import {Marca} from '../../../../BackEnd/src/models/Marca.js';
import {Proveedor} from '../../../../BackEnd/src/models/Proveedor.js';
import {Cliente} from '../../../../BackEnd/src/models/Cliente.js';
import {Producto} from '../../../../BackEnd/src/models/Producto.js';
import {appService} from '../services/UшымтаService.js';
import {InvoiceTemplate} from './InvoicePlantilla.js';
import {Factura} from '../../../../BackEnd/src/models/Factura.js';
import GoogleSheetSync from '../../../../BackEnd/src/database/syncGoogleSheet.js';
import {ProveedorService} from "../../../../BackEnd/src/services/ProveedorService.js";
import {ClienteService} from "../../../../BackEnd/src/services/ClienteService.js";
import {MarcaService} from "../../../../BackEnd/src/services/MarcaService.js";
import {CategoriaService} from "../../../../BackEnd/src/services/CategoriaService.js";
import {ProductoService} from "../../../../BackEnd/src/services/ProductoService.js";

class AdminController {

  static googleSheetSync = new GoogleSheetSync(        // categoria
    'https://script.google.com/macros/s/AKfycbx0M1Jaz4ZIHs4tqeIulSrdIsn1tsu6BW0twVwc3Vo0_YybZftwE0RR8dQL3ZZgtUg/exec'
  );
  static googleSheetSyncMarca = new GoogleSheetSync(
    'https://script.google.com/macros/s/AKfycbzrQBaqY-DyXEiKSd_BZQjrRCwGX2Q-mehjcjucQQUm2SWoDOdzu6ZJ5bbk9ubEid_i/exec'
  );

  constructor(categoriaService, marcaService, proveedorService, clienteService, productoService, facturaService, appService) {
    // this.categoriaService = categoriaService;
    // this.marcaService = marcaService;
    // this.proveedorService = proveedorService;
    // this.clienteService = clienteService;
    // this.productoService = productoService;
    this.categoriaService = categoriaService || new CategoriaService();
    this.marcaService = marcaService || new MarcaService();
    this.proveedorService = proveedorService || new ProveedorService();
    this.productoService = productoService || new ProductoService(this.categoriaService, this.marcaService, this.proveedorService);
    this.appService = appService;
    this.facturaService = facturaService;

    // Elementos DOM comunes
    this.adminSection = document.getElementById('admin');
    this.adminTabs = document.querySelectorAll('.admin-tab');
    this.adminSections = document.querySelectorAll('.admin-section');

    // Elementos Categorias   =========================================================================
    this.formCategoria = document.getElementById('formCategoria');
    this.categoriaIdInput = document.getElementById('categoriaId');
    this.categoriaNombreInput = document.getElementById('categoriaNombre');
    this.categoriaEstadoInput = document.getElementById('categoriaEstado');
    this.estadoTextoSpan = document.getElementById('estadoTexto');
    this.tablaCategorias = document.getElementById('tablaCategorias').querySelector('tbody');
    this.categoriaEstadoInput.addEventListener('change', () => {
      this.estadoTextoSpan.textContent = this.categoriaEstadoInput.checked ? 'Activo' : 'Inactivo';
    });

    // Instancia del servicio de categorías
    // this.categoriaService = new CategoriaService();
    // Iniciar la carga de categorías
    this.cargarCategorias();

    // Elementos Marcas       ========================================================================0
    this.formMarca = document.getElementById('formMarca');
    this.marcaIdInput = document.getElementById('marcaId');
    this.marcaNombreInput = document.getElementById('marcaNombre');
    this.marcaEstadoInput = document.getElementById('marcaEstado');
    this.estadoMarcaTextoSpan = document.getElementById('estadoMarcaTexto');
    this.marcaEstadoInput.addEventListener('change', () => {
      this.estadoMarcaTextoSpan.textContent = this.marcaEstadoInput.checked ? 'Activo' : 'Inactivo';
    });
    // Instancia del servicio de marca
    // this.marcaService = new MarcaService()
    // Iniciar la carga de marcas
    this.cargarMarcas();


    // Elementos Proveedores con los IDs reales  =======================================
    this.formProveedor = document.getElementById('formProveedor');
    this.proveedorIdInput = document.getElementById('proveedorId');
    this.proveedorNombreInput = document.getElementById('proveedorNombre');
    this.proveedorTelefonoInput = document.getElementById('proveedorTelefono');
    this.proveedorDireccionInput = document.getElementById('proveedorDireccion');
    this.proveedorEstadoInput = document.getElementById('proveedorEstado');
    this.estadoProveedorTextoSpan = document.getElementById('estadoProveedorTexto');
    this.tablaProveedores = document.getElementById('tablaProveedores').querySelector('tbody');
    this.proveedorEstadoInput.addEventListener('change', () => {
      this.estadoProveedorTextoSpan.textContent = this.proveedorEstadoInput.checked ? 'Activo' : 'Inactivo';
    });
    // Instancia del servicio de proveedores
    // this.proveedorService = new ProveedorService();
    // Iniciar la carga de proveedores
    this.cargarProveedores();
    //========================================================================

    // Elementos Clientes
    this.formCliente = document.getElementById('formCliente');
    this.clienteIdInput = document.getElementById('clienteId');
    this.clienteNombreInput = document.getElementById('clienteNombre');
    this.clienteTelefonoInput = document.getElementById('clienteTelefono');
    this.clienteDireccionInput = document.getElementById('clienteDireccion');
    this.clienteEstadoInput = document.getElementById('clienteEstado');
    this.estadoClienteTextoSpan = document.getElementById('estadoClienteTexto');
    this.tablaClientes = document.getElementById('tablaClientes').querySelector('tbody');
    this.clienteEstadoInput.addEventListener('change', () => {
      this.estadoClienteTextoSpan.textContent = this.clienteEstadoInput.checked ? 'Activo' : 'Inactivo';
    });
    // Instancia del servicio de clientes
    this.clienteService = new ClienteService();
// Cargar clientes de inmediato
    this.cargarClientes();

    // ======================================================================
    // Elementos Productos
    this.formProducto = document.getElementById('formProducto');
    this.productoIdInput = document.getElementById('productoId');
    this.productoNombreInput = document.getElementById('productoNombre');
    this.productoPrecioInput = document.getElementById('productoPrecio');
    this.productoCategoriaSelect = document.getElementById('productoCategoria');
    this.productoMarcaSelect = document.getElementById('productoMarca');
    this.productoProveedorSelect = document.getElementById('productoProveedor');
    this.productoStockInput = document.getElementById('productoStock');
    this.productoPVPInput = document.getElementById('productoPVP');
    this.productoDescripcionInput = document.getElementById('productoDescripcion');
    this.productoImagenInput = document.getElementById('productoImagen');
    this.productoEstadoInput = document.getElementById('productoEstado');
    this.estadoProductoTextoSpan = document.getElementById('estadoProductoTexto');
    this.tablaProductos = document.getElementById('tablaProductos').querySelector('tbody');
    this.productoEstadoInput.addEventListener('change', () => {
      this.estadoProductoTextoSpan.textContent = this.productoEstadoInput.checked ? 'Activo' : 'Inactivo';
    });
    // Iniciar la carga de productos
    this.cargarProductos();
    // Cargar opciones de formularios
    this.cargarOpcionesProductoForm();


    // =====================================================================
    // Forzamos la sincronización sin mostrar el overlay completo
    setInterval(async () => {

      await this.categoriaService.forceSyncNow();
      // Actualizamos la tabla sin usar el loader
      this.cargarCategorias(false);

      await this.marcaService.forceSyncNow();
      // Actualizamos la tabla sin usar el loader
      this.cargarMarcas(false);

      await this.proveedorService.forceSyncNow();
      // Actualizamos la tabla sin usar el loader
      this.cargarProveedores(false);

      await this.clienteService.forceSyncNow();
      // Actualizamos la tabla sin usar el loader
      this.cargarClientes(false);

      await this.productoService.forceSyncNow();
      // Actualizamos la tabla sin usar el loader
      this.cargarProductos(false);
    }, 5000);

    // Envio de formularios
    this.setupEventListeners();
  }

  // Funciones para el Loader
  showLoader() {
    requestAnimationFrame(() => {
      document.getElementById('loaderOverlay').classList.remove('hidden');
    });
  }

  hideLoader() {
    requestAnimationFrame(() => {
      document.getElementById('loaderOverlay').classList.add('hidden');
    });
  }

  // Envio de formularios
  // setupEventListeners() {
  //   this.adminTabs.forEach(tab => {
  //     tab.addEventListener('click', () => this.cargarSeccionAdmin(tab.dataset.tab));
  //   });
  //   // Eventos de los formularios usando delegación de eventos
  //   this.adminSection.addEventListener('submit', async (e) => { //Se agrega async
  //     if (e.target.id === 'formCategoria') {
  //       await this.guardarCategoria(e); //Se agrega await
  //     } else if (e.target.id === 'formMarca') {
  //       await this.guardarMarca(e);//Se agrega await
  //     } else if (e.target.id === 'formProveedor') {
  //       await this.guardarProveedor(e)//Se agrega await
  //     } else if (e.target.id === 'formCliente') {
  //       await this.guardarCliente(e)//Se agrega await
  //     } else if (e.target.id === 'formProducto') {
  //       await this.guardarProducto(e)//Se agrega await
  //     }
  //   });
  //
  //   // Botones de reset (delegación de eventos también)
  //   this.adminSection.addEventListener('click', (e) => {
  //     if (e.target.id === 'resetCategoriaForm') {
  //       this.resetFormCategoria();
  //     } else if (e.target.id === 'resetMarcaForm') {
  //       this.resetFormMarca();
  //     } else if (e.target.id === 'resetProveedorForm') {
  //       this.resetFormProveedor();
  //     } else if (e.target.id === 'resetClienteForm') {
  //       this.resetFormCliente();
  //     } else if (e.target.id === 'resetProductoForm') {
  //       this.resetFormProducto();
  //     }
  //   });
  // }
  setupEventListeners() {
    this.adminTabs.forEach(tab => {
      tab.addEventListener('click', () => this.cargarSeccionAdmin(tab.dataset.tab));
    });

    // Delegación de eventos para todos los formularios
    this.adminSection.addEventListener('submit', async (e) => {
      e.preventDefault(); // Asegura que el formulario no se envíe de forma predeterminada
      const formId = e.target.id;

      try {
        if (formId === 'formCategoria') {
          await this.guardarCategoria(e);
        } else if (formId === 'formProducto') {
          await this.guardarProducto(e);
        } else if (formId === 'formMarca') {
          await this.guardarMarca(e);
        } else if (formId === 'formProveedor') {
          await this.guardarProveedor(e);
        } else if (formId === 'formCliente') {
          await this.guardarCliente(e);
        }
      } catch (error) {
        console.error(`Error en el envío del formulario ${formId}:`, error);
        alert("Ocurrió un error al guardar. Revisa la consola.");
      }
    });

    // Delegación de eventos para botones de reset
    this.adminSection.addEventListener('click', (e) => {
      if (e.target.id === 'resetCategoriaForm') {
        this.resetFormCategoria();
      } else if (e.target.id === 'resetProductoForm') {
        this.resetFormProducto();
      } else if (e.target.id === 'resetMarcaForm') {
        this.resetFormMarca();
      } else if (e.target.id === 'resetProveedorForm') {
        this.resetFormProveedor();
      } else if (e.target.id === 'resetClienteForm') {
        this.resetFormCliente();
      }
    });
  }

  // Mostrar el panel de administración UI
  async mostrarPanelAdmin() {
    //Ocultar otros
    document.getElementById('tienda').classList.add('hidden');
    document.getElementById('cartSection').classList.add('hidden');
    // document.getElementById('checkoutSection').classList.add('hidden');
    this.adminSection.classList.remove('hidden');
    this.cargarSeccionAdmin('categorias');  // Por defecto
  }

  // Cargar la sección de administración seleccionada
  async cargarSeccionAdmin(tabName) {
    this.adminSections.forEach(section => section.classList.add('hidden'));
    document.getElementById('admin' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).classList.remove('hidden');
    this.adminTabs.forEach(tab => tab.classList.remove('active'));
    document.querySelector(`.admin-tab[data-tab="${tabName}"]`).classList.add('active');

    switch (tabName) {
      case 'categorias':
        await this.cargarCategorias();
        break;
      case 'marcas':
        await this.cargarMarcas();
        break;
      case 'proveedores':
        await this.cargarProveedores();
        break;
      case 'clientes':
        await this.cargarClientes();
        break;
      case 'productos':
        await this.cargarOpcionesProductoForm();
        await this.cargarProductos();
        break;
      case 'ventas':
        await this.cargarVentas();
        break;
    }
  }

  // formatearTelefono(telefono) {
  //   if (!telefono || typeof telefono !== 'string') return '';
  //   return telefono
  //     .replace(/[^\d+]/g, '') // Elimina todo lo que no sea número o "+"
  //     .replace(/\+/g, '');    // Elimina el "+"
  // }

  //---------------------------------------------------
  // Métodos CRUD para Categorías
  //---------------------------------------------------
  // adminController.js
  async cargarCategorias(mostrarLoader = true) {
    try {
      if (mostrarLoader) this.showLoader();
      const categorias = await this.categoriaService.obtenerTodasLasCategorias();
      this.tablaCategorias.innerHTML = '';

      if (!Array.isArray(categorias)) {
        console.error("Error: categorias no es un array.");
        return;
      }

      categorias.forEach(categoria => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td class="text-center">${categoria.nombre}</td>
        <td class="text-center">
          <i class="fa-solid fa-eye fa-lg btn-details" style="color: deepskyblue; cursor: pointer" data-id="${categoria.id}"></i>
        </td>
        <td class="text-center">
          <div class="estado-cell">
            <span class="estado-indicator hidden">${categoria.iconTrueFalse()}</span>
            <input type="checkbox" id="categoriaEstadoToggle${categoria.id}" class="toggle-input estado-toggle" data-id="${categoria.id}" ${categoria.estado ? 'checked' : ''}>
            <label for="categoriaEstadoToggle${categoria.id}" class="toggle-label"></label>
          </div>
        </td>
        <td class="text-center">
          <div class="action-buttons">
            <button class="action-button edit-button" data-id="${categoria.id}">
              <i class="fa-solid fa-pencil fa-lg" data-id="${categoria.id}"></i>
            </button>
            <button class="action-button delete-button" data-id="${categoria.id}">
              <i class="fa-solid fa-trash-can fa-lg" data-id="${categoria.id}"></i>
            </button>
          </div>
        </td>
      `;

        // Listener para abrir el modal de detalles
        tr.querySelector(".btn-details").addEventListener("click", async (e) => {
          const id = parseInt(e.currentTarget.dataset.id);
          await this.openModalDetailsCat(id);
        });

        // Listener para editar categoría
        tr.querySelector(".edit-button").addEventListener("click", async (e) => {
          const btn = e.currentTarget;
          btn.disabled = true;
          try {
            const id = parseInt(btn.dataset.id);
            const categoria = await this.categoriaService.obtenerCategoriaPorId(id);
            if (categoria) {
              this.categoriaIdInput.value = categoria.id;
              this.categoriaNombreInput.value = categoria.nombre;
              this.categoriaEstadoInput.checked = categoria.estado;
              this.estadoTextoSpan.textContent = categoria.estado ? "Activo" : "Inactivo";
              window.scrollTo(0, 0);
            }
          } finally {
            btn.disabled = false;
          }
        });

        // Listener para eliminar categoría
        tr.querySelector(".delete-button").addEventListener("click", async (e) => {
          const id = parseInt(e.currentTarget.dataset.id);
          if (confirm("¿Está seguro de eliminar?")) {
            this.showLoader();
            const result = await this.categoriaService.eliminarCategoria(id);
            if (result !== null) {
              await this.cargarCategorias(mostrarLoader);
              await this.cargarOpcionesProductoForm();
            }
            this.hideLoader();
          }
        });

        // Listener para el cambio de estado en la tabla
        const toggleEstado = tr.querySelector(".estado-toggle");
        if (toggleEstado) {
          toggleEstado.addEventListener("change", async (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            const nuevoEstado = e.currentTarget.checked;
            try {
              this.showLoader();
              const resultado = await this.categoriaService.actualizarCategoria(id, {estado: nuevoEstado});
              if (resultado !== null) {
                const tdEstado = e.currentTarget.closest("td").querySelector(".estado-indicator");
                if (tdEstado) {
                  tdEstado.innerHTML = nuevoEstado
                    ? '<i class="fa-solid fa-circle-check fa-lg" style="color: #28a745;" title="Activo"></i>'
                    : '<i class="fa-solid fa-circle-xmark fa-lg" style="color: #dc3545;" title="Inactivo"></i>';
                }
              }
            } catch (error) {
              console.error("Error al actualizar estado:", error);
              e.currentTarget.checked = !nuevoEstado;
              alert("Error al actualizar el estado de la categoría.");
            } finally {
              this.hideLoader();
            }
          });
        }

        this.tablaCategorias.appendChild(tr);
      });
    } catch (error) {
      console.error("Error al cargar las categorías:", error);
      alert("Error al cargar las categorías.");
    } finally {
      if (mostrarLoader) this.hideLoader();
    }
  }

  async guardarCategoria(e) {
    e.preventDefault();
    const categoriaId = this.categoriaIdInput.value;
    const nombre = this.categoriaNombreInput.value.trim();
    const estado = this.categoriaEstadoInput.checked;

    if (!nombre) {
      alert("El nombre de la categoría es obligatorio.");
      return;
    }

    try {
      this.showLoader();
      let resultado;
      if (categoriaId) {
        // Actualización
        const datosParaActualizar = {nombre, estado};
        resultado = await this.categoriaService.actualizarCategoria(parseInt(categoriaId), datosParaActualizar);
        if (resultado) {
          alert("Categoría ACTUALIZADA");
        }
      } else {
        // Creación
        const nuevaCategoria = new Categoria(nombre, estado);
        const categoriaCreada = await this.categoriaService.agregarCategoria(nuevaCategoria);
        if (categoriaCreada) {
          alert(`Éxito al agregar Categoría, ID ${categoriaCreada.id}`);
          resultado = categoriaCreada;
        } else {
          throw new Error('Errores en datos o validación.');
        }
      }
      if (resultado) {
        this.resetFormCategoria();
        await this.cargarCategorias();
        await this.cargarOpcionesProductoForm();
        await appService.refreshCache();
      }
    } catch (error) {
      console.error("Error en guardarCategoria:", error);
      alert("Revise consola");
    } finally {
      this.hideLoader();
    }
  }

  resetFormCategoria() {
    this.categoriaIdInput.value = '';
    this.categoriaNombreInput.value = '';
    this.categoriaEstadoInput.checked = true;
    this.estadoTextoSpan.textContent = 'Activo';
  }

  async openModalDetailsCat(categoriaId) {
    try {
      this.showLoader();
      const categoria = await this.categoriaService.obtenerCategoriaPorId(categoriaId);
      if (!categoria) {
        console.error("No se encontró la categoría");
        return;
      }
      document.getElementById('modalNombre').textContent = categoria.nombre;
      document.getElementById('modalEstado').innerHTML = categoria.iconTrueFalse();
      document.getElementById('modalFechaCreacion').textContent = categoria.formatEcuadorDateTime(categoria.fechaCreacion);
      document.getElementById('modalFechaActualizacion').textContent = categoria.formatEcuadorDateTime(categoria.fechaActualizacion);
      const modalDetails = document.getElementById('categoriaModal');
      modalDetails.classList.remove('hidden');
      document.body.classList.add('modal-open');
      requestAnimationFrame(() => {
        modalDetails.classList.add('show');
      });
    } catch (error) {
      console.error("Error abriendo el modal de detalles:", error);
    } finally {
      this.hideLoader();
    }
  }

  closeModalDetailsCat() {
    const modalDetails = document.getElementById('categoriaModal');
    modalDetails.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
      modalDetails.classList.add('hidden');
    }, 300);
  }

  //---------------------------------------------------
  // Métodos CRUD para Marcas
  //---------------------------------------------------
// AdminController.js
  // Cargar la tabla de Marcas
  async cargarMarcas(mostrarLoader = true) {
    try {
      if (mostrarLoader) this.showLoader();
      const marcas = await this.marcaService.obtenerTodasLasMarcas();
      const tabla = document.getElementById('tabla-marcas-body');
      if (!tabla) {
        console.error("Elemento tbody para marcas no encontrado");
        return;
      }
      tabla.innerHTML = ''; // Limpiar tabla

      if (!Array.isArray(marcas)) {
        console.error("Error: marcas no es un array.");
        return;
      }

      marcas.forEach(marca => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td class="text-center">${marca.nombre}</td>
        <td class="text-center">
          <i class="fa-solid fa-eye fa-lg btn-details" style="color: deepskyblue; cursor: pointer" data-id="${marca.id}"></i>
        </td>
        <td class="text-center">
          <div class="estado-cell">
            <span class="estado-indicatorMarca hidden">${marca.iconTrueFalse()}</span>
            <input type="checkbox" id="marcaEstadoToggle${marca.id}" class="toggle-input estado-toggleMarca" data-id="${marca.id}" ${marca.estado ? 'checked' : ''}>
            <label for="marcaEstadoToggle${marca.id}" class="toggle-label"></label>
          </div>
        </td>
        <td class="text-center">
          <div class="action-buttons">
            <button class="action-button edit-button" data-id="${marca.id}">
              <i class="fa-solid fa-pencil fa-lg" data-id="${marca.id}"></i>
            </button>
            <button class="action-button delete-button" data-id="${marca.id}">
              <i class="fa-solid fa-trash-can fa-lg" data-id="${marca.id}"></i>
            </button>
          </div>
        </td>
      `;

        // Listener para abrir el modal de detalles
        tr.querySelector(".btn-details").addEventListener("click", async (e) => {
          const id = parseInt(e.currentTarget.dataset.id);
          await this.openModalDetailsMar(id);
        });

        // Listener para editar marca
        tr.querySelector(".edit-button").addEventListener("click", async (e) => {
          const btn = e.currentTarget;
          btn.disabled = true;
          try {
            const id = parseInt(btn.dataset.id);
            const marca = await this.marcaService.obtenerMarcaPorId(id);
            if (marca) {
              this.marcaIdInput.value = marca.id;
              this.marcaNombreInput.value = marca.nombre;
              this.marcaEstadoInput.checked = marca.estado;
              this.estadoMarcaTextoSpan.textContent = marca.estado ? "Activo" : "Inactivo";
              window.scrollTo(0, 0);
            }
          } finally {
            btn.disabled = false;
          }
        });

        // Listener para eliminar marca
        tr.querySelector(".delete-button").addEventListener("click", async (e) => {
          const id = parseInt(e.currentTarget.dataset.id);
          if (confirm("¿Está seguro de eliminar?")) {
            this.showLoader();
            const result = await this.marcaService.eliminarMarca(id);
            if (result !== null) {
              await this.cargarMarcas(mostrarLoader);
            }
            this.hideLoader();
          }
        });

        // Listener para el cambio de estado en la tabla
        const toggleEstado = tr.querySelector(".estado-toggleMarca");
        if (toggleEstado) {
          toggleEstado.addEventListener("change", async (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            const nuevoEstado = e.currentTarget.checked;
            try {
              this.showLoader();
              const resultado = await this.marcaService.actualizarMarca(id, {estado: nuevoEstado});
              if (resultado !== null) {
                const tdEstado = e.currentTarget.closest("td").querySelector(".estado-indicatorMarca");
                if (tdEstado) {
                  tdEstado.innerHTML = nuevoEstado
                    ? '<i class="fa-solid fa-circle-check fa-lg" style="color: #28a745;" title="Activo"></i>'
                    : '<i class="fa-solid fa-circle-xmark fa-lg" style="color: #dc3545;" title="Inactivo"></i>';
                }
              }
            } catch (error) {
              console.error("Error al actualizar estado:", error);
              e.currentTarget.checked = !nuevoEstado;
              alert("Error al actualizar el estado de la marca.");
            } finally {
              this.hideLoader();
            }
          });
        }

        tabla.appendChild(tr);
      });
    } catch (error) {
      console.error("Error al cargar las marcas:", error);
      alert("Error al cargar las marcas.");
    } finally {
      if (mostrarLoader) this.hideLoader();
    }
  }

  // Enviar Formulario Marca:  CREATE y UPDATE:  (marcas)
  async guardarMarca(e) {
    e.preventDefault();
    const marcaId = this.marcaIdInput.value;
    const nombre = this.marcaNombreInput.value.trim();
    const estado = this.marcaEstadoInput.checked;

    if (!nombre) {
      alert("El nombre de la marca es obligatorio.");
      return;
    }

    try {
      this.showLoader();
      let resultado;
      if (marcaId) {
        // Actualización
        const datosParaActualizar = {nombre, estado};
        resultado = await this.marcaService.actualizarMarca(parseInt(marcaId), datosParaActualizar);
        if (resultado) {
          alert("Marca ACTUALIZADA");
        }
      } else {
        // Creación
        const nuevaMarca = new Marca(nombre, estado);
        const marcaCreada = await this.marcaService.agregarMarca(nuevaMarca);
        if (marcaCreada) {
          alert(`Éxito al agregar Marca, ID ${marcaCreada.id}`);
          resultado = marcaCreada;
        } else {
          throw new Error('Errores en datos o validación.');
        }
      }
      if (resultado) {
        this.resetFormMarca();
        await this.cargarMarcas();
        await appService.refreshCache();
      }
    } catch (error) {
      console.error("Error en guardarMarca:", error);
      alert("Revise consola");
    } finally {
      this.hideLoader();
    }
  }

// Reset
  resetFormMarca() {
    this.marcaIdInput.value = '';
    this.marcaNombreInput.value = '';
    this.marcaEstadoInput.checked = true;
    this.estadoMarcaTextoSpan.textContent = 'Activo';
  }

// Abrir modal de detalles de Marca
  async openModalDetailsMar(marcaId) {
    try {
      this.showLoader();
      const marca = await this.marcaService.obtenerMarcaPorId(marcaId);
      if (!marca) {
        console.error("No se encontró la marca");
        return;
      }
      document.getElementById('modalMarcaNombre').textContent = marca.nombre;
      document.getElementById('modalMarcaEstado').innerHTML = marca.iconTrueFalse();
      document.getElementById('modalMarcaFechaCreacion').textContent = marca.formatEcuadorDateTime(marca.fechaCreacion);
      document.getElementById('modalMarcaFechaActualizacion').textContent = marca.formatEcuadorDateTime(marca.fechaActualizacion);
      const modalDetails = document.getElementById('marcaModal');
      modalDetails.classList.remove('hidden');
      document.body.classList.add('modal-open');
      requestAnimationFrame(() => {
        modalDetails.classList.add('show');
      });
    } catch (error) {
      console.error("Error abriendo el modal de detalles:", error);
    } finally {
      this.hideLoader();
    }
  }

// Cerrar modal de detalles de Marca
  closeModalDetailsMar() {
    const modalDetails = document.getElementById('marcaModal');
    modalDetails.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
      modalDetails.classList.add('hidden');
    }, 300);
  }

  //---------------------------------------------------
  // Métodos CRUD para Proveedores
  //---------------------------------------------------

  // adminController.js
  // Cargar la tabla de Proveedores
  async cargarProveedores(mostrarLoader = true) {
    try {
      if (mostrarLoader) this.showLoader();
      // Si se requiere forzar la sincronización, se puede llamar previamente a forceSyncNow en el polling
      const proveedores = await this.proveedorService.obtenerTodosLosProveedores();
      this.tablaProveedores.innerHTML = ""; // Limpiar la tabla

      if (!Array.isArray(proveedores)) {
        console.error("Error: proveedores no es un array.");
        return;
      }

      proveedores.forEach((proveedor) => {
        const tr = document.createElement("tr");
        // Formatear el teléfono removiendo caracteres no numéricos
        const telefonoFormateado = proveedor.telefono.replace(/[^0-9]/g, "");
        tr.innerHTML = `
        <td class="text-center">${proveedor.nombre}</td>
        <td class="text-center">
          <a href="tel:${proveedor.telefono}" title="Llamar +${proveedor.telefono}" style="font-size: 22px;">
            <i class="fa fa-phone fa-lg"></i>
          </a>
          <a style="font-size: 25px;" title="Chatear por Whatsapp ${telefonoFormateado}"
             href="whatsapp://send?phone=+${telefonoFormateado}&text=Hola, ${proveedor.nombre}">
            <i class="fa-brands fa-whatsapp fa-lg" style="font-size:1.8rem;"></i>
          </a>
        </td>
        <td class="text-center">
          <i type="buttom" class="fa-solid fa-eye fa-lg btn-details" style="color: deepskyblue; cursor: pointer" data-id="${proveedor.id}"></i>
        </td>
        <td class="text-center">
          <div class="estado-cell">
            <span class="estado-indicatorProveedor hidden">${proveedor.iconTrueFalse()}</span>
            <input type="checkbox" id="proveedorEstadoToggle${proveedor.id}" class="toggle-input estado-toggleProveedor" data-id="${proveedor.id}" ${proveedor.estado ? "checked" : ""}>
            <label for="proveedorEstadoToggle${proveedor.id}" class="toggle-label"></label>
          </div>
        </td>
        <td class="text-center">
          <div class="action-buttons">
            <button class="action-button edit-button" data-id="${proveedor.id}">
              <i class="fa-solid fa-pencil fa-lg" data-id="${proveedor.id}"></i>
            </button>
            <button class="action-button delete-button" data-id="${proveedor.id}">
              <i class="fa-solid fa-trash-can fa-lg" data-id="${proveedor.id}"></i>
            </button>
          </div>
        </td>
      `;

        // Listener para abrir el modal de detalles
        tr.querySelector(".btn-details").addEventListener("click", async (e) => {
          const id = parseInt(e.currentTarget.dataset.id);
          await this.openModalDetailsProveedor(id);
        });

        // Listener para editar proveedor
        tr.querySelector(".edit-button").addEventListener("click", async (e) => {
          const btn = e.currentTarget;
          btn.disabled = true;
          try {
            const id = parseInt(btn.dataset.id);
            const proveedor = await this.proveedorService.obtenerProveedorPorId(id);
            if (proveedor) {
              this.proveedorIdInput.value = proveedor.id;
              this.proveedorNombreInput.value = proveedor.nombre;
              this.proveedorDireccionInput.value = proveedor.direccion;
              this.proveedorTelefonoInput.value = proveedor.telefono;
              this.proveedorEstadoInput.checked = proveedor.estado;
              this.estadoProveedorTextoSpan.textContent = proveedor.estado ? "Activo" : "Inactivo";
              window.scrollTo(0, 0);
            }
          } finally {
            btn.disabled = false;
          }
        });

        // Listener para eliminar proveedor
        tr.querySelector(".delete-button").addEventListener("click", async (e) => {
          const id = parseInt(e.currentTarget.dataset.id);
          if (confirm("¿Está seguro de eliminar?")) {
            this.showLoader();
            const result = await this.proveedorService.eliminarProveedor(id);
            if (result !== null) {
              // Llamada sin bloquear (loader ya se muestra antes de la operación)
              await this.cargarProveedores(mostrarLoader);
            }
            this.hideLoader();
          }
        });

        // Listener para el cambio de estado en la tabla
        const toggleEstado = tr.querySelector(".estado-toggleProveedor");
        if (toggleEstado) {
          toggleEstado.addEventListener("change", async (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            const nuevoEstado = e.currentTarget.checked;
            try {
              this.showLoader();
              const resultado = await this.proveedorService.actualizarProveedor(id, {estado: nuevoEstado});
              if (resultado !== null) {
                const tdEstado = e.currentTarget.closest("td").querySelector(".estado-indicatorProveedor");
                if (tdEstado) {
                  tdEstado.innerHTML = nuevoEstado
                    ? '<i class="fa-solid fa-circle-check fa-lg" style="color: #28a745;" title="Activo"></i>'
                    : '<i class="fa-solid fa-circle-xmark fa-lg" style="color: #dc3545;" title="Inactivo"></i>';
                }
              }
            } catch (error) {
              console.error("Error al actualizar estado:", error);
              e.currentTarget.checked = !nuevoEstado;
              alert("Error al actualizar el estado del proveedor.");
            } finally {
              this.hideLoader();
            }
          });
        }

        this.tablaProveedores.appendChild(tr);
      });
    } catch (error) {
      console.error("Error al cargar los Proveedores:", error);
      alert("Error al cargar los Proveedores.");
    } finally {
      if (mostrarLoader) this.hideLoader();
    }
  }

  // Abrir modal de detalles del proveedor
  async openModalDetailsProveedor(proveedorId) {
    try {
      this.showLoader();
      const proveedor = await this.proveedorService.obtenerProveedorPorId(proveedorId);
      if (!proveedor) {
        console.error("No se encontró el proveedor");
        return;
      }
      document.getElementById('modalNombreProveedor').textContent = proveedor.nombre;
      document.getElementById('modalTelefonoProveedor').textContent = proveedor.telefono;
      document.getElementById('modalDireccionProveedor').textContent = proveedor.direccion;
      document.getElementById('modalEstadoProveedor').innerHTML = proveedor.iconTrueFalse();
      document.getElementById('modalFechaCreacionProveedor').textContent = proveedor.formatEcuadorDateTime(proveedor.fechaCreacion);
      document.getElementById('modalFechaActualizacionProveedor').textContent = proveedor.formatEcuadorDateTime(proveedor.fechaActualizacion);
      const modalDetails = document.getElementById('proveedorModal');
      modalDetails.classList.remove('hidden');
      document.body.classList.add('modal-open');
      requestAnimationFrame(() => {
        modalDetails.classList.add('show');
      });
    } catch (error) {
      console.error("Error abriendo el modal de detalles:", error);
    } finally {
      this.hideLoader();
    }
  }

  // Cerrar modal de detalles
  closeModalDetailsProveedor() {
    const modalDetails = document.getElementById('proveedorModal');
    modalDetails.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
      modalDetails.classList.add('hidden');
    }, 300);
  }

  // Guardar (crear o actualizar) un proveedor
  async guardarProveedor(e) {
    e.preventDefault();
    const proveedorId = this.proveedorIdInput.value;
    const nombre = this.proveedorNombreInput.value;
    const direccion = this.proveedorDireccionInput.value;
    const telefono = this.proveedorTelefonoInput.value;
    const estado = this.proveedorEstadoInput.checked;
    if (!nombre || !direccion) {
      alert("Campos obligatorios");
      return;
    }
    try {
      this.showLoader();
      let resultado;
      if (proveedorId) {
        // Actualización
        const proveedorExistente = await this.proveedorService.obtenerProveedorPorId(parseInt(proveedorId));
        proveedorExistente.nombre = nombre;
        proveedorExistente.direccion = direccion;
        proveedorExistente.telefono = telefono;
        proveedorExistente.estado = estado;
        resultado = await this.proveedorService.actualizarProveedor(parseInt(proveedorId), proveedorExistente);
        if (resultado) {
          alert("Proveedor ACTUALIZADO");
        }
      } else {
        // Creación
        const nuevoProveedor = new Proveedor(nombre, telefono, direccion, estado);
        const proveedorCreado = await this.proveedorService.agregarProveedor(nuevoProveedor);
        if (proveedorCreado) {
          alert(`Éxito al agregar Proveedor, ID ${proveedorCreado.id}`);
          resultado = proveedorCreado;
        } else {
          throw new Error('Errores en datos o validación.');
        }
      }
      if (resultado) {
        this.resetFormProveedor();
        await this.cargarProveedores();
        await appService.refreshCache();
      }
    } catch (error) {
      console.error("Error en guardarProveedor:", error);
      alert("Revise consola");
    } finally {
      this.hideLoader();
    }
  }

  // Reiniciar el formulario de proveedor
  resetFormProveedor() {
    this.proveedorIdInput.value = '';
    this.proveedorNombreInput.value = '';
    this.proveedorDireccionInput.value = '';
    this.proveedorTelefonoInput.value = '';
    this.proveedorEstadoInput.checked = true;
    this.estadoProveedorTextoSpan.textContent = 'Activo';
  }

  //---------------------------------------------------
  // Métodos CRUD para Clientes
  //---------------------------------------------------

  //adminController.js
  async cargarClientes(mostrarLoader = true) {
    try {
      if (mostrarLoader) this.showLoader();
      const clientes = await this.clienteService.obtenerTodosLosClientes();
      this.tablaClientes.innerHTML = ''; // Limpiar la tabla

      if (!Array.isArray(clientes)) {
        console.error("Error: clientes no es un array.");
        return;
      }

      clientes.forEach((cliente) => {
        const tr = document.createElement("tr");
        const telefonoFormateado = cliente.telefono.replace(/[^0-9]/g, "");
        tr.innerHTML = `
          <td class="text-center">${cliente.nombre}</td>
          <td class="text-center">
            <a href="tel:${cliente.telefono}" title="Llamar ${cliente.telefono}" style="font-size: 22px;">
              <i class="fa fa-phone fa-lg"></i>
            </a>
            <a style="font-size: 25px;" title="Chatear por Whatsapp ${telefonoFormateado}"
               href="whatsapp://send?phone=+${telefonoFormateado}&text=Hola, ${cliente.nombre}">
              <i class="fa-brands fa-whatsapp fa-lg" style="font-size:1.8rem;"></i>
            </a>
          </td>
          <td class="text-center">
            <i type="button" class="fa-solid fa-eye fa-lg btn-details" style="color: deepskyblue; cursor: pointer" data-id="${cliente.id}"></i>
          </td>
          <td class="text-center">
            <div class="estado-cell">
              <span class="estado-indicatorCliente hidden">${cliente.iconTrueFalse()}</span>
              <input type="checkbox" id="clienteEstadoToggle${cliente.id}" class="toggle-input estado-toggleCliente" data-id="${cliente.id}" ${cliente.estado ? "checked" : ""}>
              <label for="clienteEstadoToggle${cliente.id}" class="toggle-label"></label>
            </div>
          </td>
          <td class="text-center">
            <div class="action-buttons">
              <button class="action-button edit-button" data-id="${cliente.id}">
                <i class="fa-solid fa-pencil fa-lg" data-id="${cliente.id}"></i>
              </button>
              <button class="action-button delete-button" data-id="${cliente.id}">
                <i class="fa-solid fa-trash-can fa-lg" data-id="${cliente.id}"></i>
              </button>
            </div>
          </td>
        `;

        // Listener para abrir el modal de detalles
        tr.querySelector(".btn-details").addEventListener("click", async (e) => {
          const id = parseInt(e.currentTarget.dataset.id);
          await this.openModalDetailsCliente(id);
        });

        // Listener para editar cliente
        tr.querySelector(".edit-button").addEventListener("click", async (e) => {
          const btn = e.currentTarget;
          btn.disabled = true;
          try {
            const id = parseInt(btn.dataset.id);
            const cliente = await this.clienteService.obtenerClientePorId(id);
            if (cliente) {
              this.clienteIdInput.value = cliente.id;
              this.clienteNombreInput.value = cliente.nombre;
              this.clienteDireccionInput.value = cliente.direccion;
              this.clienteTelefonoInput.value = cliente.telefono;
              this.clienteEstadoInput.checked = cliente.estado;
              this.estadoClienteTextoSpan.textContent = cliente.estado ? "Activo" : "Inactivo";
              window.scrollTo(0, 0);
            }
          } finally {
            btn.disabled = false;
          }
        });

        // Listener para eliminar cliente
        tr.querySelector(".delete-button").addEventListener("click", async (e) => {
          const id = parseInt(e.currentTarget.dataset.id);
          if (confirm("¿Está seguro de eliminar?")) {
            this.showLoader();
            const result = await this.clienteService.eliminarCliente(id);
            if (result !== null) {
              await this.cargarClientes(mostrarLoader);
            }
            this.hideLoader();
          }
        });
        // Listener para el cambio de estado en la tabla
        const toggleEstado = tr.querySelector(".estado-toggleCliente");
        if (toggleEstado) {
          toggleEstado.addEventListener("change", async (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            const nuevoEstado = e.currentTarget.checked;

            // Guardamos el estado original para restaurarlo en caso de error
            const estadoOriginal = !nuevoEstado;

            try {
              this.showLoader();

              // Agregamos un log para depurar
              console.log(`Intentando actualizar cliente ID ${id} a estado: ${nuevoEstado}`);

              // Intentar la actualización con un manejo de excepciones más específico
              const resultado = await this.clienteService.actualizarCliente(id, {estado: nuevoEstado})
                .catch(err => {
                  console.error("Error específico en actualizarCliente:", err);
                  return null;
                });

              if (resultado !== null) {
                console.log(`Cliente ID ${id} actualizado correctamente a estado: ${nuevoEstado}`);

                // Verificamos que el elemento exista antes de manipularlo
                try {
                  const parentTd = e.currentTarget.closest("td");
                  if (parentTd) {
                    const tdEstado = parentTd.querySelector(".estado-indicatorCliente");
                    if (tdEstado) {
                      tdEstado.innerHTML = nuevoEstado
                        ? '<i class="fa-solid fa-circle-check fa-lg" style="color: #28a745;" title="Activo"></i>'
                        : '<i class="fa-solid fa-circle-xmark fa-lg" style="color: #dc3545;" title="Inactivo"></i>';
                    }
                  } else {
                    console.log("No se pudo encontrar el elemento TD padre, recargando tabla...");
                    await this.cargarClientes(false);
                  }
                } catch (domError) {
                  console.error("Error al manipular el DOM:", domError);
                  // En caso de error manipulando el DOM, recargamos la tabla
                  await this.cargarClientes(false);
                }
              } else {
                console.error(`No se pudo actualizar el estado del cliente ID ${id}`);
                // Si no se actualizó el estado, restauramos el toggle
                e.currentTarget.checked = estadoOriginal;
              }
            } catch (error) {
              console.error(`Error completo al actualizar estado de cliente ID ${id}:`, error);
              // Restaurar el estado del toggle
              try {
                if (e && e.currentTarget) {
                  e.currentTarget.checked = estadoOriginal;
                }
              } catch (toggleError) {
                console.error("Error al restaurar el toggle:", toggleError);
              }
              alert("Error al actualizar el estado del cliente.");
            } finally {
              this.hideLoader();
            }
          });
        }
        // // Listener para el cambio de estado en la tabla
        // const toggleEstado = tr.querySelector(".estado-toggleCliente");
        // if (toggleEstado) {
        //   toggleEstado.addEventListener("change", async (e) => {
        //     const id = parseInt(e.currentTarget.dataset.id);
        //     const nuevoEstado = e.currentTarget.checked;
        //     try {
        //       this.showLoader();
        //       const resultado = await this.clienteService.actualizarCliente(id, {estado: nuevoEstado});
        //       if (resultado !== null) {
        //         // Verificamos que el elemento exista antes de manipularlo
        //         const parentTd = e.currentTarget.closest("td");
        //         if (parentTd) {
        //           const tdEstado = parentTd.querySelector(".estado-indicatorCliente");
        //           if (tdEstado) {
        //             tdEstado.innerHTML = nuevoEstado
        //               ? '<i class="fa-solid fa-circle-check fa-lg" style="color: #28a745;" title="Activo"></i>'
        //               : '<i class="fa-solid fa-circle-xmark fa-lg" style="color: #dc3545;" title="Inactivo"></i>';
        //           }
        //         } else {
        //           // Si no podemos actualizar el indicador visual, recargamos la tabla completa
        //           await this.cargarClientes(false);
        //         }
        //       }
        //     } catch (error) {
        //       console.error("Error al actualizar estado:", error);
        //       // Restaurar el estado del toggle
        //       if (e && e.currentTarget) {
        //         e.currentTarget.checked = !nuevoEstado;
        //       }
        //       alert("Error al actualizar el estado del cliente.");
        //     } finally {
        //       this.hideLoader();
        //     }
        //   });
        // }
        this.tablaClientes.appendChild(tr);
      });
    } catch (error) {
      console.error("Error al cargar los Clientes:", error);
      alert("Error al cargar los Clientes.");
    } finally {
      if (mostrarLoader) this.hideLoader();
    }
  }

  async openModalDetailsCliente(clienteId) {
    try {
      this.showLoader();
      const cliente = await this.clienteService.obtenerClientePorId(clienteId);
      if (!cliente) {
        console.error("No se encontró el cliente");
        return;
      }
      document.getElementById('modalNombreCliente').textContent = cliente.nombre;
      document.getElementById('modalTelefonoCliente').textContent = cliente.telefono;
      document.getElementById('modalDireccionCliente').textContent = cliente.direccion;
      document.getElementById('modalContadorCliente').textContent = cliente.contador + ' veces';
      document.getElementById('modalEstadoCliente').innerHTML = cliente.iconTrueFalse();
      document.getElementById('modalFechaCreacionCliente').textContent = cliente.formatEcuadorDateTime(cliente.fechaCreacion);
      document.getElementById('modalFechaActualizacionCliente').textContent = cliente.formatEcuadorDateTime(cliente.fechaActualizacion);
      const modalDetails = document.getElementById('clienteModal');
      modalDetails.classList.remove('hidden');
      document.body.classList.add('modal-open');
      requestAnimationFrame(() => {
        modalDetails.classList.add('show');
      });
    } catch (error) {
      console.error("Error abriendo el modal de detalles:", error);
    } finally {
      this.hideLoader();
    }
  }

  closeModalDetailsCliente() {
    const modalDetails = document.getElementById('clienteModal');
    modalDetails.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
      modalDetails.classList.add('hidden');
    }, 300);
  }

  async guardarCliente(e) {
    e.preventDefault();
    const clienteId = this.clienteIdInput.value;
    const nombre = this.clienteNombreInput.value;
    const direccion = this.clienteDireccionInput.value;
    const telefono = this.clienteTelefonoInput.value;
    const estado = this.clienteEstadoInput.checked;
    if (!nombre || !direccion || !telefono) {
      alert("Campos obligatorios");
      return;
    }
    try {
      this.showLoader();
      let resultado;
      if (clienteId) {
        const clienteExistente = await this.clienteService.obtenerClientePorId(parseInt(clienteId));
        clienteExistente.nombre = nombre;
        clienteExistente.direccion = direccion;
        clienteExistente.telefono = telefono;
        clienteExistente.estado = estado;
        resultado = await this.clienteService.actualizarCliente(parseInt(clienteId), clienteExistente);
        if (resultado) {
          // Esperar explícitamente a que se complete la sincronización
          await this.clienteService.forceSyncNow();
          alert("Cliente ACTUALIZADO");
        }
      } else {
        const nuevoCliente = new Cliente(nombre, telefono, direccion, estado);
        const clienteCreado = await this.clienteService.agregarCliente(nuevoCliente);
        if (clienteCreado) {
          alert(`Éxito al agregar Cliente, ID ${clienteCreado.id}`);
          resultado = clienteCreado;
        } else {
          throw new Error('Errores en datos o validación.');
        }
      }
      if (resultado) {
        this.resetFormCliente();
        await this.cargarClientes();
        await appService.refreshCache();
      }
    } catch (error) {
      console.error("Error en guardarCliente:", error);
      alert("Revise consola");
    } finally {
      this.hideLoader();
    }
  }

  resetFormCliente() {
    this.clienteIdInput.value = '';
    this.clienteNombreInput.value = '';
    this.clienteTelefonoInput.value = '';
    this.clienteDireccionInput.value = '';
    this.clienteEstadoInput.checked = true;
    this.estadoClienteTextoSpan.textContent = 'Activo';
  }

  //---------------------------------------------------
  // Métodos  para Productos
  //---------------------------------------------------
  // adminController.js
  async cargarProductos(mostrarLoader = true) {
    try {
      if (mostrarLoader) this.showLoader();
      const productos = await this.productoService.obtenerProductos();
      this.tablaProductos.innerHTML = '';

      productos.forEach(producto => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="text-center">${producto.nombre}</td>
          <td class="text-center">${producto.proveedorNombre}</td>
          <td class="text-center">${producto.stock}</td>
          <td class="text-center"><i class="fa-solid fa-eye fa-lg btn-details" style="color: deepskyblue; cursor: pointer" data-id="${producto.id}"></i></td>
          <td class="text-center">
            <div class="estado-cell">
              <input type="checkbox" id="productoEstadoToggle${producto.id}" class="toggle-input estado-toggleProducto" data-id="${producto.id}" ${producto.estado ? 'checked' : ''}>
              <label for="productoEstadoToggle${producto.id}" class="toggle-label"></label>
            </div>
          </td>
          <td class="text-center">
            <div class="action-buttons">
              <button class="action-button edit-button" data-id="${producto.id}"><i class="fa-solid fa-pencil fa-lg"></i></button>
              <button class="action-button delete-button" data-id="${producto.id}"><i class="fa-solid fa-trash-can fa-lg"></i></button>
            </div>
          </td>
        `;

        tr.querySelector(".btn-details").addEventListener("click", () => this.openModalDetailsProd(producto.id));


        tr.querySelector(".edit-button").addEventListener("click", async () => {

          const producto = await this.productoService.obtenerProductoPorId(producto.id);
          if (producto) {
            this.productoIdInput.value = producto.id;
            this.productoNombreInput.value = producto.nombre;
            this.productoPrecioInput.value = producto.precio;
            this.productoCategoriaSelect.value = producto.categoriaId;
            this.productoMarcaSelect.value = producto.marcaId;
            this.productoProveedorSelect.value = producto.proveedorId;
            this.productoStockInput.value = producto.stock;
            this.productoPVPInput.value = producto.pvp;
            this.productoDescripcionInput.value = producto.descripcion;
            this.productoImagenInput.value = producto.imagen;
            this.productoEstadoInput.checked = producto.estado;
            this.estadoProductoTextoSpan.textContent = producto.estado ? "Activo" : "Inactivo";
            window.scrollTo(0, 0);
          }
        });

        tr.querySelector(".delete-button").addEventListener("click", async () => {
          if (confirm("¿Está seguro de eliminar?")) {
            this.showLoader();
            await this.productoService.eliminarProducto(producto.id);
            await this.cargarProductos(false);
            if (app.tiendaController) await app.tiendaController.cargarProductos();
            this.hideLoader();
          }
        });
        tr.querySelector(".estado-toggleProducto").addEventListener("change", async (e) => {
          const nuevoEstado = e.currentTarget.checked;
          this.showLoader();
          await this.productoService.actualizarProducto(producto.id, {estado: nuevoEstado});
          this.hideLoader();
        });

        this.tablaProductos.appendChild(tr);
      });
    } catch (error) {
      console.error("Error loading products:", error);
      alert("Error al cargar los productos.");
    } finally {
      if (mostrarLoader) this.hideLoader();
    }
  }

  async guardarProducto(e) {
    e.preventDefault();
    console.log("guardarProducto ejecutado")
    const productoId = this.productoIdInput.value;
    const nombre = this.productoNombreInput.value.trim();
    const precio = parseFloat(this.productoPrecioInput.value);
    const categoriaId = parseInt(this.productoCategoriaSelect.value);
    const marcaId = parseInt(this.productoMarcaSelect.value);
    const proveedorId = parseInt(this.productoProveedorSelect.value);
    const stock = parseInt(this.productoStockInput.value);
    const pvp = parseFloat(this.productoPVPInput.value);
    const descripcion = this.productoDescripcionInput.value.trim();
    const imagen = this.productoImagenInput.value.trim();
    const estado = this.productoEstadoInput.checked;

    if (!nombre || isNaN(precio) || isNaN(categoriaId) || isNaN(marcaId) || isNaN(proveedorId) || isNaN(stock) || isNaN(pvp)) {
      alert("Todos los campos marcados con (*) son obligatorios y deben ser válidos.");
      return;
    }

    if (precio < 0 || pvp < 0 || stock < 0) {
      alert('No se permiten números negativos');
      return;
    }

    try {
      this.showLoader();
      let resultado;
      if (productoId) {
        const datosParaActualizar = {
          nombre,
          precio,
          categoriaId,
          marcaId,
          proveedorId,
          cantidad: stock,
          pvp,
          descripcion,
          imagen,
          estado
        };
        resultado = await this.productoService.actualizarProducto(parseInt(productoId), datosParaActualizar);
        if (resultado) alert("Producto ACTUALIZADO");
      } else {
        const nuevoProducto = new Producto(nombre, estado, new Date(), new Date(), categoriaId, '', marcaId, '', proveedorId, '', precio, pvp, stock, descripcion, imagen);
        resultado = await this.productoService.agregarProducto(nuevoProducto);
        if (resultado) alert(`Éxito al agregar Producto, ID ${resultado.id}`);
      }
      if (resultado) {
        this.resetFormProducto();
        await this.cargarProductos(false);
        await this.cargarOpcionesProductoForm();
        await this.appService.refreshCache();
        if (app.tiendaController) await app.tiendaController.cargarProductos();
      }
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Revise consola");
    } finally {
      this.hideLoader();
    }
  }

  async cargarOpcionesProductoForm() {
    try {
      this.showLoader();

      // Forzar sincronización inicial si no se ha hecho
      if (!this.categoriaService.lastSyncTime) await this.categoriaService.forceSyncNow();
      if (!this.marcaService.lastSyncTime) await this.marcaService.forceSyncNow();
      if (!this.proveedorService.lastSyncTime) await this.proveedorService.forceSyncNow();

      // Obtener datos sincronizados
      const categorias = await this.categoriaService.obtenerTodasLasCategorias();
      const marcas = await this.marcaService.obtenerTodasLasMarcas();
      const proveedores = await this.proveedorService.obtenerTodosLosProveedores();

      // Verificar que los datos sean válidos
      if (!Array.isArray(categorias) || !Array.isArray(marcas) || !Array.isArray(proveedores)) {
        throw new Error('Los datos obtenidos no son arrays válidos');
      }

      // Limpiar y llenar selects
      this.productoCategoriaSelect.innerHTML = '<option value="">Seleccione Categoría</option>';
      this.productoMarcaSelect.innerHTML = '<option value="">Seleccione Marca</option>';
      this.productoProveedorSelect.innerHTML = '<option value="">Seleccione Proveedor</option>';

      categorias.forEach(categoria => {
        this.productoCategoriaSelect.innerHTML += `<option value="${categoria.id}">${categoria.nombre}</option>`;
      });
      marcas.forEach(marca => {
        this.productoMarcaSelect.innerHTML += `<option value="${marca.id}">${marca.nombre}</option>`;
      });
      proveedores.forEach(proveedor => {
        this.productoProveedorSelect.innerHTML += `<option value="${proveedor.id}">${proveedor.nombre}</option>`;
      });

      console.log('Opciones cargadas correctamente:', {
        categorias: categorias.length,
        marcas: marcas.length,
        proveedores: proveedores.length
      });
    } catch (error) {
      console.error("Error al cargar opciones para el formulario de productos:", error);
      alert(`Error al cargar opciones: ${error.message}. Revise la consola para más detalles.`);
    } finally {
      this.hideLoader();
    }
  }

  resetFormProducto() {
    this.productoIdInput.value = '';
    this.productoNombreInput.value = '';
    this.productoPrecioInput.value = '';
    this.productoCategoriaSelect.value = '';
    this.productoMarcaSelect.value = '';
    this.productoProveedorSelect.value = '';
    this.productoStockInput.value = '';
    this.productoPVPInput.value = '';
    this.productoDescripcionInput.value = '';
    this.productoImagenInput.value = '';
    this.productoEstadoInput.checked = true;
    this.estadoProductoTextoSpan.textContent = 'Activo';
  }

  async openModalDetailsProd(productoId) {
    // Mostrar el loader
    this.showLoader();
    // Obtener la INSTANCIA del producto
    const producto = await this.productoService.obtenerProductoPorId(productoId);
    const modalDetails = document.getElementById('productoModal'); // ID del modal de producto

    if (!modalDetails) {
      console.error("Modal para detalles de Producto no encontrado (productoModal)");
      return;
    }

    if (!producto) {
      console.error("No se encontró el producto con ID:", productoId);
      alert("No se pudo cargar la información del producto.");
      return;
    }

    // Llenar el modal - Adapta los IDs a tu modal de producto
    document.getElementById('modalProdNombre').textContent = producto.nombre;
    document.getElementById('modalProdCatNombre').textContent = producto.categoriaNombre;
    document.getElementById('modalProdMarNombre').textContent = producto.marcaNombre;
    document.getElementById('modalProdProvNombre').textContent = producto.proveedorNombre;
    document.getElementById('modalProdCosto').textContent = producto.precio; // Formatear como moneda si quieres
    document.getElementById('modalProdPVP').textContent = producto.pvp;       // Formatear como moneda si quieres
    document.getElementById('modalProdCant').textContent = producto.cantidad;       // Formatear como moneda si quieres
    document.getElementById('modalProdStock').textContent = producto.stock;
    document.getElementById('modalProdDesc').textContent = producto.descripcion || 'N/A';
    document.getElementById('modalProdIMG').innerHTML = '<img   style="max-width: 120%; height: 100%; border-radius: 8px; border:2px solid #800000"  src="' + producto.imagen + '" alt="Imagen de producto">';

    // document.getElementById('modalProdIMG').textContent = producto.imagen;
    document.getElementById('modalProdEstado').innerHTML = producto.iconTrueFalse(); // Usar método de instancia

    document.getElementById('modalProdFechaCreacion').textContent = producto.formatEcuadorDateTime(producto.fechaCreacion);
    document.getElementById('modalProdFechaActualizacion').textContent = producto.formatEcuadorDateTime(producto.fechaActualizacion);

    // Mostrar el modal
    modalDetails.classList.remove('hidden');
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => {
      modalDetails.classList.add('show');
    });
  }

  closeModalDetailsProd() {
    const modalDetails = document.getElementById('productoModal');

    modalDetails.classList.remove('show');
    document.body.classList.remove('modal-open');

    setTimeout(() => {
      modalDetails.classList.add('hidden');
    }, 300);
  }

  //-------------------------
  //Ventas (Historial)
  //-------------------------

  async cargarVentas() {
    try {
      const tablaVentas = document.querySelector('#tablaVentas tbody');
      if (!tablaVentas) throw new Error('Tabla de ventas no encontrada');

      const facturas = await this.facturaService.obtenerFacturas();
      tablaVentas.innerHTML = '';

      for (const factura of facturas) {
        if (!factura?.clienteId) {
          console.warn('Factura inválida:', factura);
          continue;
        }

        const estadoIcon = {
          'pendiente': '<i class="fa-solid fa-hourglass fa-lg" style="color: #ffc107;" title="Pendiente"></i>',
          'completado': '<i class="fa-solid fa-circle-check fa-lg" style="color: #28a745;" title="Completado"></i>',
          'denegado': '<i class="fa-solid fa-circle-xmark fa-lg" style="color: #dc3545;" title="Denegado"></i>'
        }[factura.estado] || '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td class="text-center">${factura.numeroFactura || 'N/A'}</td>
        <td class="text-center">${factura.clienteNombre || 'Cliente desconocido'}</td>
        <td class="text-center">$${factura.total.toFixed(2)}</td>
        <td class="text-center"><i class="fa-solid fa-eye fa-lg" style="color: deepskyblue; cursor: pointer;" data-factura-id="${factura.id}" data-action="ver-detalles"></i></td>
        <td class="text-center estado-celll" data-factura-id="${factura.id}">${estadoIcon}</td>
        <td class="text-center">
          <div class="action-button">
            <button class="view-button ver-factura print-btn" data-factura-id="${factura.id}" data-cliente-id="${factura.clienteId}">
              <i class="fa-solid fa-print fa-lg"></i>
            </button>
          </div>
        </td>
      `;
        tablaVentas.appendChild(tr);
      }

      this.setupVentasListeners();
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    }
  }

  async mostrarFactura(factura) {
    try {
      const invoiceModal = document.getElementById('invoiceModal');
      const invoiceDetails = document.getElementById('invoiceDetails');

      if (!invoiceModal || !invoiceDetails) throw new Error('Modal de factura no encontrado');

      invoiceDetails.innerHTML = InvoiceTemplate.generarHTML(factura, false);
      invoiceModal.classList.remove('hidden');
      document.body.classList.add('modal-open');
      requestAnimationFrame(() => invoiceModal.classList.add('show'));

      document.getElementById('btnCloseInvoice').addEventListener('click', () => this.cerrarFactura(), {once: true});
    } catch (error) {
      console.error('Error al mostrar factura:', error);
      alert(`Error: ${error.message}`);
    }
  }

  async mostrarDetallesFactura(factura) {
    try {
      const modal = document.getElementById('historialModal');
      if (!modal) throw new Error('Modal de detalles no encontrado');

      // Llenar datos
      document.getElementById('modalHistorialNumber').textContent = factura.numeroFactura || 'N/A';
      document.getElementById('modalHistorialCliente').textContent = factura.clienteNombre || 'N/A';
      document.getElementById('modalHistorialTelefono').textContent = factura.clienteTelefono || 'N/A';
      document.getElementById('modalHistorialDireccion').textContent = factura.clienteDireccion || 'N/A';
      document.getElementById('modalHistorialTotal').textContent = `$${factura.total.toFixed(2)}`;
      document.getElementById('modalHistorialFechaCreacion').textContent = Factura.formatEcuadorDateTime(factura.fecha);
      document.getElementById('modalHistoralFechaActualizacion').textContent = Factura.formatEcuadorDateTime(factura.fechaActualizacion);

      // Configurar toggle de estado
      const stateRadios = document.querySelectorAll('#historialModal input[name="invoiceState"]');

      // Limpiar listeners previos para evitar acumulación
      stateRadios.forEach(radio => {
        const newRadio = radio.cloneNode(true); // Clonar para eliminar listeners
        radio.parentNode.replaceChild(newRadio, radio);
      });

      // Re-seleccionar los nuevos radios sin listeners
      const newStateRadios = document.querySelectorAll('#historialModal input[name="invoiceState"]');
      newStateRadios.forEach(radio => {
        radio.checked = radio.value === factura.estado;
        radio.addEventListener('change', async (e) => {
          const nuevoEstado = e.target.value;
          document.getElementById('invoiceStateText').textContent = {
            'pendiente': 'Factura pendiente de productos (aún no entregados)',
            'completado': 'Productos entregados',
            'denegado': 'Factura denegada: productos devueltos'
          }[nuevoEstado];

          const resultado = await this.facturaService.actualizarFactura(factura.id, {estado: nuevoEstado});
          if (resultado) {
            const estadoCell = document.querySelector(`.estado-celll[data-factura-id="${factura.id}"]`);
            if (estadoCell) {
              estadoCell.innerHTML = {
                'pendiente': '<i class="fa-solid fa-hourglass fa-lg" style="color: #ffc107;" title="Pendiente"></i>',
                'completado': '<i class="fa-solid fa-circle-check fa-lg" style="color: #28a745;" title="Completado"></i>',
                'denegado': '<i class="fa-solid fa-circle-xmark fa-lg" style="color: #dc3545;" title="Denegado"></i>'
              }[nuevoEstado];
            }
            factura.estado = nuevoEstado; // Actualizar el objeto factura en memoria
          } else {
            alert('Error al actualizar estado');
            // Restaurar el estado anterior en el radio si falla
            newStateRadios.forEach(r => r.checked = r.value === factura.estado);
          }
        });
      });

      document.getElementById('invoiceStateText').textContent = {
        'pendiente': 'Factura pendiente de productos (aún no entregados)',
        'completado': 'Productos entregados',
        'denegado': 'Factura denegada: productos devueltos'
      }[factura.estado];

      modal.classList.remove('hidden');
      document.body.classList.add('modal-open');
      requestAnimationFrame(() => modal.classList.add('show'));

      document.getElementById('btnCloseModalDetailsHistorial').addEventListener('click', () => this.cerrarDetallesFactura(), {once: true});
    } catch (error) {
      console.error('Error al mostrar detalles:', error);
      alert(`Error: ${error.message}`);
    }
  }

  setupVentasListeners() {
    const tabla = document.getElementById('tablaVentas');
    const searchInput = document.getElementById('searchInputFac');
    if (!tabla) return;

    tabla.addEventListener('click', async (e) => {
      const target = e.target;

      if (target.tagName === 'I' && target.dataset.action === 'ver-detalles') {
        const facturaId = parseInt(target.dataset.facturaId, 10);
        if (isNaN(facturaId)) return alert('ID de factura inválido');
        const factura = await this.facturaService.obtenerFacturaPorId(facturaId);
        if (factura) await this.mostrarDetallesFactura(factura);
        else alert('Factura no encontrada');
      }

      const button = target.closest('.ver-factura');
      if (button) {
        button.disabled = true;
        button.textContent = 'Cargando...';
        try {
          const facturaId = parseInt(button.dataset.facturaId, 10);
          const clienteId = parseInt(button.dataset.clienteId, 10);
          if (isNaN(facturaId) || isNaN(clienteId)) throw new Error('IDs inválidos');

          const factura = await this.facturaService.obtenerFacturaPorId(facturaId);
          if (!factura) throw new Error('Factura no encontrada');
          await this.mostrarFactura(factura);
        } catch (error) {
          console.error('Error al cargar factura:', error);
          alert(`Error: ${error.message}`);
        } finally {
          button.disabled = false;
          button.innerHTML = '<i class="fa-solid fa-print fa-lg"></i>';
        }
      }
    });

    searchInput.addEventListener('input', () => {
      const searchTerm = searchInput.value.toLowerCase();
      const rows = tablaVentas.querySelectorAll('tbody tr');

      rows.forEach(row => {
        const facturaNumberCell = row.querySelector('td:first-child');
        const facturaNumber = facturaNumberCell.textContent.toLowerCase();

        if (facturaNumber.includes(searchTerm) || facturaNumber.endsWith(`-${searchTerm}`)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });

  }

  cerrarFactura() {
    const invoiceModal = document.getElementById('invoiceModal');
    if (!invoiceModal) return;
    invoiceModal.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(() => invoiceModal.classList.add('hidden'), 300);
  }

  cerrarDetallesFactura() {
    const modal = document.getElementById('historialModal');
    if (!modal) return;
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(() => modal.classList.add('hidden'), 300);
  }

} //CIERRA CLASE AdminController

// Instancia única para toda la aplicación.
const adminController = new AdminController(app.categoriaService, app.marcaService, app.proveedorService, app.clienteService, app.productoService, app.facturaService, appService);

export {adminController};