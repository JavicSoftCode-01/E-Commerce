// FrontEnd/ui/controllers/AdminController.js
import { app } from '../AppFactory.js';
import { Categoria } from '../../../../BackEnd/src/models/Categoria.js';
import { Marca } from '../../../../BackEnd/src/models/Marca.js';
import { Proveedor } from '../../../../BackEnd/src/models/Proveedor.js';
import { Cliente } from '../../../../BackEnd/src/models/Cliente.js';
import { Producto } from '../../../../BackEnd/src/models/Producto.js';
import { appService } from '../services/UшымтаService.js';
import { InvoiceTemplate } from './InvoicePlantilla.js';
import { Factura } from '../../../../BackEnd/src/models/Factura.js';

class AdminController {
  constructor(categoriaService, marcaService, proveedorService, clienteService, productoService, facturaService) {
    this.categoriaService = categoriaService;
    this.marcaService = marcaService;
    this.proveedorService = proveedorService;
    this.clienteService = clienteService;
    this.productoService = productoService;
    this.facturaService = facturaService;

    // Elementos DOM comunes
    this.adminSection = document.getElementById('admin');
    this.adminTabs = document.querySelectorAll('.admin-tab');
    this.adminSections = document.querySelectorAll('.admin-section');

    // Elementos Categorias
    this.formCategoria = document.getElementById('formCategoria');
    this.categoriaIdInput = document.getElementById('categoriaId');
    this.categoriaNombreInput = document.getElementById('categoriaNombre');

    this.categoriaEstadoInput = document.getElementById('categoriaEstado');
    this.estadoTextoSpan = document.getElementById('estadoTexto');
    this.tablaCategorias = document.getElementById('tablaCategorias').querySelector('tbody');
    // Agregar listener para el cambio de estado
    this.categoriaEstadoInput.addEventListener('change', () => {
      this.estadoTextoSpan.textContent = this.categoriaEstadoInput.checked ? 'Activo' : 'Inactivo';
    });
    // this.btnResetCategoriaForm = document.getElementById('resetCategoriaForm') //ya no es necesario

    // Elementos Marcas
    this.formMarca = document.getElementById('formMarca');
    this.marcaIdInput = document.getElementById('marcaId');
    this.marcaNombreInput = document.getElementById('marcaNombre');

    this.marcaEstadoInput = document.getElementById('marcaEstado');
    this.estadoMarcaTextoSpan = document.getElementById('estadoMarcaTexto');
    this.tablaMarcas = document.getElementById('tablaMarcas').querySelector('tbody');

    // Agregar listener para el cambio de estado en el formulario (para cuando se edita)
    this.marcaEstadoInput.addEventListener('change', () => {
      this.estadoMarcaTextoSpan.textContent = this.marcaEstadoInput.checked ? 'Activo' : 'Inactivo';
    });
    // this.btnResetMarcaForm = document.getElementById('resetMarcaForm')//ya no es necesario

    // Elementos Proveedores
    this.formProveedor = document.getElementById('formProveedor');
    this.proveedorIdInput = document.getElementById('proveedorId');
    this.proveedorNombreInput = document.getElementById('proveedorNombre');
    this.proveedorTelefonoInput = document.getElementById('proveedorTelefono');
    this.proveedorDireccionInput = document.getElementById('proveedorDireccion');

    this.proveedorEstadoInput = document.getElementById('proveedorEstado');
    this.estadoProveedorTextoSpan = document.getElementById('estadoProveedorTexto');
    this.tablaProveedores = document.getElementById('tablaProveedores').querySelector('tbody');

    // Agregar listener para el cambio de estado en el formulario (para cuando se edita)
    this.proveedorEstadoInput.addEventListener('change', () => {
      this.estadoProveedorTextoSpan.textContent = this.proveedorEstadoInput.checked ? 'Activo' : 'Inactivo';
    });
    //this.btnResetProveedorForm = document.getElementById('resetProveedorForm'); //ya no es necesario

    // Elementos Clientes
    this.formCliente = document.getElementById('formCliente');
    this.clienteIdInput = document.getElementById('clienteId');
    this.clienteNombreInput = document.getElementById('clienteNombre');
    this.clienteTelefonoInput = document.getElementById('clienteTelefono');
    this.clienteDireccionInput = document.getElementById('clienteDireccion');
    this.tablaClientes = document.getElementById('tablaClientes').querySelector('tbody');
    // this.btnResetClienteForm = document.getElementById('resetClienteForm'); //ya no es necesario

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

    // Agregar listener para el cambio de estado en el formulario (para cuando se edita)
    this.productoEstadoInput.addEventListener('change', () => {
      this.estadoProductoTextoSpan.textContent = this.productoEstadoInput.checked ? 'Activo' : 'Inactivo';
    });


    // Elementos Ventas (factura)
    this.tablaVentas = document.getElementById('tablaVentas').querySelector('tbody');

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.adminTabs.forEach(tab => {
      tab.addEventListener('click', () => this.cargarSeccionAdmin(tab.dataset.tab));
    });
    // Eventos de los formularios usando delegación de eventos
    this.adminSection.addEventListener('submit', async (e) => { //Se agrega async
      if (e.target.id === 'formCategoria') {
        await this.guardarCategoria(e); //Se agrega await
      } else if (e.target.id === 'formMarca') {
        await this.guardarMarca(e);//Se agrega await
      } else if (e.target.id === 'formProveedor') {
        await this.guardarProveedor(e)//Se agrega await
      } else if (e.target.id === 'formCliente') {
        await this.guardarCliente(e)//Se agrega await
      } else if (e.target.id === 'formProducto') {
        await this.guardarProducto(e)//Se agrega await
      }
    });

    // Botones de reset (delegación de eventos también)
    this.adminSection.addEventListener('click', (e) => {
      if (e.target.id === 'resetCategoriaForm') {
        this.resetFormCategoria();
      } else if (e.target.id === 'resetMarcaForm') {
        this.resetFormMarca();
      } else if (e.target.id === 'resetProveedorForm') {
        this.resetFormProveedor();
      } else if (e.target.id === 'resetClienteForm') {
        this.resetFormCliente();
      } else if (e.target.id === 'resetProductoForm') {
        this.resetFormProducto();
      }
    });
  }

  async mostrarPanelAdmin() {
    //Ocultar otros
    document.getElementById('tienda').classList.add('hidden');
    document.getElementById('cartSection').classList.add('hidden');
    // document.getElementById('checkoutSection').classList.add('hidden');
    this.adminSection.classList.remove('hidden');
    this.cargarSeccionAdmin('categorias');  // Por defecto
  }

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

  //---------------------------------------------------
  // Métodos CRUD para Categorías
  //---------------------------------------------------

  // adminController.js
  async cargarCategorias() {
    try {
      const categorias = await appService.getCategorias();
      this.tablaCategorias.innerHTML = '';

      if (!Array.isArray(categorias)) {
        console.error("Error: categorias is not an array.");
        return;
      }

      categorias.forEach(categoria => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td class="text-center">${categoria.nombre}</td>
        <td class="text-center">
          <i class="fa-solid fa-eye fa-lg" style="color: deepskyblue; cursor: pointer;" id="btnOpenModalDetails" data-id="${categoria.id}"></i>
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
            <button class="action-button edit-button edit-categoria" data-id="${categoria.id}">
              <i class="fa-solid fa-pencil fa-lg" data-id="${categoria.id}"></i>
            </button>
            <button class="action-button delete-button delete-categoria" data-id="${categoria.id}">
              <i class="fa-solid fa-trash-can fa-lg" data-id="${categoria.id}"></i>
            </button>
          </div>
        </td>
      `;

        const btnOpenModal = tr.querySelector('#btnOpenModalDetails');
        if (btnOpenModal) {
          btnOpenModal.addEventListener('click', () => {
            this.openModalDetailsCat(categoria.id);
          });
        }

        this.tablaCategorias.appendChild(tr);
      });

      // Configurar listeners para los botones y toggles
      this.setupCategoriaListeners();

    } catch (error) {
      console.error("Error al cargar las categorías:", error);
      alert("Error al cargar las categorías.");
    }
  }

  async openModalDetailsCat(categoriaId) {
    const categoria = await this.categoriaService.obtenerCategoriaPorId(categoriaId); // Obtener solo la categoría seleccionada
    const modalDetails = document.getElementById('categoriaModal');

    if (!categoria) {
      console.error("No se encontró la categoría");
      return;
    }

    // Llenar el modal con la información correcta
    document.getElementById('modalNombre').textContent = categoria.nombre;
    document.getElementById('modalEstado').innerHTML = categoria.iconTrueFalse();
    document.getElementById('modalFechaCreacion').textContent = categoria.formatEcuadorDateTime(categoria.fechaCreacion);
    document.getElementById('modalFechaActualizacion').textContent = categoria.formatEcuadorDateTime(categoria.fechaActualizacion);

    // Mostrar el modal
    modalDetails.classList.remove('hidden');
    document.body.classList.add('modal-open');

    requestAnimationFrame(() => {
      modalDetails.classList.add('show');
    });
  }

  closeModalDetailsCat() {
    const modalDetails = document.getElementById('categoriaModal');

    modalDetails.classList.remove('show');
    document.body.classList.remove('modal-open');

    setTimeout(() => {
      modalDetails.classList.add('hidden');
    }, 300);
  }

  setupCategoriaListeners() {
    // Editar
    this.tablaCategorias.querySelectorAll('.edit-categoria').forEach(button => {
      button.addEventListener('click', async (e) => {
        const categoriaId = parseInt(e.target.dataset.id);
        const categoria = await this.categoriaService.obtenerCategoriaPorId(categoriaId);

        if (categoria) {
          this.categoriaIdInput.value = categoria.id;
          this.categoriaNombreInput.value = categoria.nombre;

          // Establecer el estado del toggle
          this.categoriaEstadoInput.checked = categoria.estado;
          this.estadoTextoSpan.textContent = categoria.estado ? 'Activo' : 'Inactivo';
        }
      });
    });
    // Eliminar Categoria
    this.tablaCategorias.querySelectorAll('.delete-categoria').forEach(button => { // forEach para el boton eliminar
      button.addEventListener('click', async (e) => {               //
        const categoriaId = parseInt(e.target.dataset.id);     //

        // --- CONFIRMACION ---
        if (confirm("Esta seguro de eliminar?")) { //
          //Llamar al service, el metodo de indexeddb eliminar, pasamos  id
          const result = await this.categoriaService.eliminarCategoria(categoriaId);  //

          // Verificar si la eliminación fue exitosa
          if (result !== null) {
            //Actualiza
            await this.cargarCategorias();      // Vuelve a cargar categorias
            // Para actualizar select de Productos.
            await this.cargarOpcionesProductoForm(); //   productos
          }
        }  //Cierra confirm()
      }); //cierra Listener
    });  // cierra forEach, setupCategoriaListeners
    // Nuevo: Toggle para cambiar estado en la tabla
    this.tablaCategorias.querySelectorAll('.estado-toggle').forEach(toggle => {
      toggle.addEventListener('change', async (e) => {
        const categoriaId = parseInt(e.target.dataset.id);
        const nuevoEstado = e.target.checked;

        try {
          const resultado = await this.categoriaService.actualizarCategoria(categoriaId, {
            estado: nuevoEstado
          });

          if (resultado !== null) {
            // Actualizar la vista sin recargar toda la tabla
            const tdEstado = e.target.closest('td').querySelector('.estado-indicator');
            if (tdEstado) {
              tdEstado.innerHTML = nuevoEstado ?
                '<i class="fa-solid fa-circle-check fa-lg" style="color: #28a745;" title="Activo"></i>' :
                '<i class="fa-solid fa-circle-xmark fa-lg" style="color: #dc3545;" title="Inactivo"></i>';
            }
          }
        } catch (error) {
          console.error('Error al actualizar estado:', error);
          // Revertir cambio en UI en caso de error
          e.target.checked = !nuevoEstado;
          alert("Error al actualizar el estado de la categoría.");
        }
      });
    });
  } //cierra metodo

  // Enviar Formulario Categoria:  CREATE y UPDATE:  (categorias)
  async guardarCategoria(e) {
    e.preventDefault();
    const categoriaId = this.categoriaIdInput.value; // Puede ser string vacío o un ID
    const nombre = this.categoriaNombreInput.value.trim(); // Quitar espacios extra
    const estado = this.categoriaEstadoInput.checked; // Obtener el estado del checkbox

    if (!nombre) {
      alert("El nombre es obligatorio.");
      return;
    }

    let resultado;
    try {
      if (categoriaId) {
        // --- ACTUALIZACIÓN ---
        console.log(`Intentando actualizar categoría ID: ${categoriaId} con nombre: ${nombre}`);
        // Preparamos solo los datos que queremos cambiar
        const datosParaActualizar = {
          nombre: nombre,
          estado: estado // Actualiza el estado también
        };

        // Llamamos al servicio de actualización pasando el ID y los NUEVOS datos
        resultado = await this.categoriaService.actualizarCategoria(parseInt(categoriaId), datosParaActualizar);

        if (resultado === null) {
          // El servicio retornó null, indicando un error (probablemente de validación o BD)
          alert("Error al actualizar la categoría. Revisa la consola para más detalles.");
          // No reseteamos el form para que el usuario pueda corregir
        } else if (resultado === parseInt(categoriaId)) {
          // El servicio retornó el mismo ID, indicando éxito pero sin cambios guardados
          alert("Categoría guardada.");
          this.resetFormCategoria(); // Resetea el formulario
          await this.cargarCategorias(); // Recarga la tabla
          await this.cargarOpcionesProductoForm(); // Actualiza selects dependientes
          await appService.refreshCache(); // Actualiza caché si es necesario
        } else {
          // El servicio retornó un ID (puede ser el mismo o uno nuevo si la lógica de update lo retornara así)
          // y la operación implicó cambios.
          alert("Categoría ACTUALIZADA exitosamente.");
          this.resetFormCategoria(); // Resetea el formulario
          await this.cargarCategorias(); // Recarga la tabla
          await this.cargarOpcionesProductoForm(); // Actualiza selects dependientes
          await appService.refreshCache(); // Actualiza caché si es necesario
        }

      } else {
        // --- CREACIÓN ---
        console.log(`Intentando agregar nueva categoría con nombre: ${nombre}`);
        const nuevaCategoria = new Categoria(nombre, estado); // El constructor se encarga de las fechas iniciales
        resultado = await this.categoriaService.agregarCategoria(nuevaCategoria);

        if (resultado !== null) { // Si agregarCategoria retorna el nuevo ID
          alert(`Categoría agregada exitosamente con ID: ${resultado}`);
          this.resetFormCategoria();
          await this.cargarCategorias();
          await this.cargarOpcionesProductoForm();
          await appService.refreshCache();
        } else {
          // agregarCategoria retornó null, indicando un error (validación, BD, etc.)
          alert("Error al agregar la categoría. Revisa la consola.");
          // No reseteamos el form
        }
      }

    } catch (error) {
      console.error("Error en guardarCategoria:", error);
      alert("Ocurrió un error inesperado al guardar. Revisa la consola.");
    }
  }

  // Reset
  resetFormCategoria() {
    this.categoriaIdInput.value = '';       // Reset ID (oculto)
    this.categoriaNombreInput.value = ''; // Reset Nombre (visible)
    this.categoriaEstadoInput.checked = true; // Resetear a activo por defecto
    this.estadoTextoSpan.textContent = 'Activo';
  }

  //---------------------------------------------------
  // Métodos CRUD para Marcas
  //---------------------------------------------------
  async guardarMarca(e) {
    e.preventDefault();
    const marcaId = this.marcaIdInput.value;
    const nombre = this.marcaNombreInput.value.trim();
    const estado = this.marcaEstadoInput.checked;

    if (!nombre) {
      alert("El nombre de la marca es obligatorio.");
      return;
    }

    let resultado;
    try {
      if (marcaId) {
        // --- ACTUALIZACIÓN ---
        console.log(`Intentando actualizar marca ID: ${marcaId} con nombre: ${nombre}`);
        const datosParaActualizar = {
          nombre: nombre,
          estado: estado
        };

        resultado = await this.marcaService.actualizarMarca(parseInt(marcaId), datosParaActualizar);

        if (resultado === null) {
          alert("Error al actualizar la marca. Revisa la consola.");
        } else if (resultado === parseInt(marcaId)) {
          alert("Marca guardada/actualizada exitosamente.");
          this.resetFormMarca();
          await this.cargarMarcas();
          await this.cargarOpcionesProductoForm();
          await appService.refreshCache();
        }

      } else {
        // --- CREACIÓN ---
        console.log(`Intentando agregar nueva marca con nombre: ${nombre}`);
        const nuevaMarca = new Marca(nombre, estado);
        resultado = await this.marcaService.agregarMarca(nuevaMarca);

        if (resultado !== null) {
          alert(`Marca agregada exitosamente con ID: ${resultado}`);
          this.resetFormMarca();
          await this.cargarMarcas();
          await this.cargarOpcionesProductoForm();
          await appService.refreshCache();
        } else {
          alert("Error al agregar la marca. Revisa la consola.");
        }
      }

    } catch (error) {
      console.error("Error en guardarMarca:", error);
      alert("Ocurrió un error inesperado al guardar la marca. Revisa la consola.");
    }
  }


  // --- Asegúrate de tener el método resetFormMarca ---
  resetFormMarca() {
    this.marcaIdInput.value = '';       // Reset ID (oculto)
    this.marcaNombreInput.value = ''; // Reset Nombre (visible)
    // Resetea otros campos del form de marca si los tienes
    this.marcaEstadoInput.checked = true; // Resetear a activo por defecto
    this.estadoMarcaTextoSpan.textContent = 'Activo';
  }

  // --- Asegúrate de tener el método cargarMarcas ---
  async cargarMarcas() {
    try {
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
            <i class="fa-solid fa-eye fa-lg" style="color: deepskyblue; cursor: pointer" id="btnOpenModalDetails" data-id="${marca.id}" title="Ver Detalles"></i>
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
               <button class="action-button edit-button edit-marca" data-id="${marca.id}"><i class="fa-solid fa-pencil fa-lg edit" data-id="${marca.id}"></i></button>
               <button class="action-button delete-button delete-marca" data-id="${marca.id}"><i class="fa-solid fa-trash-can fa-lg delete" data-id="${marca.id}"></i></button>
             </div>
            </td>
        `;
        const btnOpenModal = tr.querySelector('#btnOpenModalDetails');
        if (btnOpenModal) {
          btnOpenModal.addEventListener('click', () => {
            this.openModalDetailsMar(marca.id);
          });
        }
        tabla.appendChild(tr);
      });

      // Reconfigura los listeners para botones y toggles
      this.setupMarcaListeners();

    } catch (error) {
      console.error("Error al cargar las marcas:", error);
      alert("Error al cargar las marcas.");
    }
  }



  setupMarcaListeners() {
    const tabla = document.getElementById('tabla-marcas-body'); // ID del tbody de marcas
    if (!tabla) return;

    // Editar Marca
    tabla.querySelectorAll('.edit-marca').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const targetElement = e.target.closest('button');
        if (!targetElement) return;

        const marcaId = parseInt(targetElement.dataset.id);
        const marca = await this.marcaService.obtenerMarcaPorId(marcaId);
        if (marca) {
          this.marcaIdInput.value = marca.id;
          this.marcaNombreInput.value = marca.nombre;
          // Establecer el estado del toggle en el formulario
          this.marcaEstadoInput.checked = marca.estado;
          this.estadoMarcaTextoSpan.textContent = marca.estado ? 'Activo' : 'Inactivo';
          window.scrollTo(0, 0);
        }
      });
    });

    // Eliminar Marca
    tabla.querySelectorAll('.delete-marca').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const targetElement = e.target.closest('button');
        if (!targetElement) return;

        const marcaId = parseInt(targetElement.dataset.id);
        if (confirm(`¿Está seguro de eliminar la marca con ID ${marcaId}?`)) {
          const result = await this.marcaService.eliminarMarca(marcaId);
          if (result !== null) {
            alert('Marca eliminada correctamente.');
            await this.cargarMarcas();
            await this.cargarOpcionesProductoForm();
            await appService.refreshCache();
            this.resetFormMarca();
          } else {
            alert('Error al eliminar la marca.');
          }
        }
      });
    });

    // Toggle para cambiar estado desde la tabla (sin pasar por el formulario)
    tabla.querySelectorAll('.estado-toggleMarca').forEach(toggle => {
      toggle.addEventListener('change', async (e) => {
        const marcaId = parseInt(e.target.dataset.id);
        const nuevoEstado = e.target.checked;

        try {
          const resultado = await this.marcaService.actualizarMarca(marcaId, {
            estado: nuevoEstado
          });

          if (resultado !== null) {
            // Actualizar la vista sin recargar toda la tabla
            const tdEstado = e.target.closest('td').querySelector('.estado-indicatorMarca');
            if (tdEstado) {
              tdEstado.innerHTML = nuevoEstado ?
                '<i class="fa-solid fa-circle-check fa-lg" style="color: #28a745;" title="Activo"></i>' :
                '<i class="fa-solid fa-circle-xmark fa-lg" style="color: #dc3545;" title="Inactivo"></i>';
            }
          }
        } catch (error) {
          console.error('Error al actualizar estado:', error);
          // Revertir cambio en UI en caso de error
          e.target.checked = !nuevoEstado;
          alert("Error al actualizar el estado de la marca.");
        }
      });
    });
  }


  // Necesitarás un método similar a openModalDetailsCat pero para Marcas
  async openModalDetailsMar(marcaId) {
    const marca = await this.marcaService.obtenerMarcaPorId(marcaId); // Usa el servicio de Marca
    const modalDetails = document.getElementById('marcaModal'); // Asegúrate que tienes un modal con este ID

    if (!modalDetails) {
      console.error("Modal para detalles de Marca no encontrado (marcaModal)");
      return;
    }

    if (!marca) {
      console.error("No se encontró la marca con ID:", marcaId);
      alert("No se pudo cargar la información de la marca.");
      return;
    }

    // Llenar el modal con la información correcta - Adapta los IDs a tu modal de marca
    document.getElementById('modalMarcaNombre').textContent = marca.nombre;
    document.getElementById('modalMarcaEstado').innerHTML = marca.iconTrueFalse();
    // Formatea las fechas usando el método de la instancia de Marca (heredado de BaseModel)
    document.getElementById('modalMarcaFechaCreacion').textContent = marca.formatEcuadorDateTime(marca.fechaCreacion);
    document.getElementById('modalMarcaFechaActualizacion').textContent = marca.formatEcuadorDateTime(marca.fechaActualizacion);

    // Mostrar el modal (adapta las clases si usas otro framework/lógica CSS)
    modalDetails.classList.remove('hidden');
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => {
      modalDetails.classList.add('show');
    });
  }

  // Necesitarás un método para cerrar el modal de Marca
  closeModalDetailsMar() {
    const modalDetails = document.getElementById('marcaModal'); // ID del modal de marca
    if (!modalDetails) return;

    modalDetails.classList.remove('show');
    document.body.classList.remove('modal-open');

    setTimeout(() => {
      modalDetails.classList.add('hidden');
    }, 300); // Tiempo de la transición CSS
  }

  //---------------------------------------------------
  // Métodos CRUD para Proveedores
  //---------------------------------------------------
  async cargarProveedores() {
    try {
      const proveedores = await this.proveedorService.obtenerTodosLosProveedores();
      this.tablaProveedores.innerHTML = ''; // Limpiar

      if (!Array.isArray(proveedores)) {
        console.error("Error: proveedores is not an array.");
        return;
      }
      proveedores.forEach(proveedor => {
        const tr = document.createElement('tr');   // row
        const telefonoFormateado = this.formatearTelefono(proveedor.telefono); // Formatear el teléfono
        tr.innerHTML = `
               <td class="text-center">${proveedor.nombre}</td>

              <td class="text-center">
                <!-- Llamada telefónica -->
                <a href="tel:${proveedor.telefono}" title="LLamar vía telefónica ${proveedor.telefono}" style="font-size: 22px;">
                  <i class="fa fa-phone fa-lg"></i>
                </a>

                &nbsp;&nbsp;&nbsp; 

                <!-- WhatsApp -->
<a style="font-size: 25px;" title="Chatear por Whatsapp${proveedor.telefono}"
   href="whatsapp://send?phone=${telefonoFormateado}&text=Hola muy buenas tardes, ${proveedor.nombre}, deseo realizar una compra del producto: ____ . Gracias!" 
   title="Chatear por WhatsApp">
  <i class="fa-brands fa-whatsapp fa-lg" style="font-size:1.8rem;"></i>
</a>

              </td>

             <!--   <td class="text-center">${proveedor.direccion}</td>-->
                <td class="text-center"><i class="fa-solid fa-eye fa-lg" style="color: deepskyblue; cursor: pointer" id="btnOpenModalDetailsProveedor" data-id="${proveedor.id}"></i></td>
                
                 <td class="text-center">
                    <div class="estado-cell">
                      <span class="estado-indicatorProveedor hidden">${proveedor.iconTrueFalse()}</span>
                      <input type="checkbox" id="proveedorEstadoToggle${proveedor.id}" class="toggle-input estado-toggleProveedor" data-id="${proveedor.id}" ${proveedor.estado ? 'checked' : ''}>
                      <label for="proveedorEstadoToggle${proveedor.id}" class="toggle-label"></label>
                    </div>
                  </td>
               
              <td class="text-center">
                <div class="action-buttons">
                 <button class="action-button edit-button edit-proveedor" data-id="${proveedor.id}"><i class="fa-solid fa-pencil fa-lg edit" data-id="${proveedor.id}"></i></button>
                 <button class="action-button delete-button delete-proveedor" data-id="${proveedor.id}"><i class="fa-solid fa-trash-can fa-lg delete" data-id="${proveedor.id}"></i></button>
                </div>
              </td>
          `;
        const btnOpenModal = tr.querySelector('#btnOpenModalDetailsProveedor');
        if (btnOpenModal) {
          btnOpenModal.addEventListener('click', () => {
            this.openModalDetailsProveedor(proveedor.id); // Pasar ID de la proveedor seleccionada
          });
        }
        this.tablaProveedores.appendChild(tr);  // Append, al tbody!
      });

      // Configurar listeners para los botones de editar y eliminar
      this.setupProveedorListeners();

    } catch (error) {
      console.error("Error al cargar los Proveedores:", error);
      alert("Error al cargar los Proveedores."); // Mejor feedback al usuario
    }
  }

  async openModalDetailsProveedor(proveedorId) {
    const proveedor = await this.proveedorService.obtenerProveedorPorId(proveedorId); // Obtener solo la proveedor seleccionada
    const modalDetails = document.getElementById('proveedorModal');
    if (!proveedor) {
      console.error("No se encontró el proveedor");
      return;
    }
    // Llenar el modal con la información correcta
    document.getElementById('modalNombreProveedor').textContent = proveedor.nombre;
    document.getElementById('modalTelefonoProveedor').textContent = proveedor.telefono;
    document.getElementById('modalDireccionProveedor').textContent = proveedor.direccion;
    document.getElementById('modalEstadoProveedor').innerHTML = proveedor.iconTrueFalse();
    document.getElementById('modalFechaCreacionProveedor').textContent = proveedor.formatEcuadorDateTime(proveedor.fechaCreacion);
    document.getElementById('modalFechaActualizacionProveedor').textContent = proveedor.formatEcuadorDateTime(proveedor.fechaActualizacion);
    // Mostrar el modal
    modalDetails.classList.remove('hidden');
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => {
      modalDetails.classList.add('show');
    });
  }

  closeModalDetailsProveedor() {
    const modalDetails = document.getElementById('proveedorModal');
    modalDetails.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
      modalDetails.classList.add('hidden');
    }, 300);
  }


  // setupProveedorListeners
  setupProveedorListeners() {
    // Editar
    this.tablaProveedores.querySelectorAll('.edit-proveedor').forEach(button => {
      button.addEventListener('click', async (e) => { // Pone Evento click

        const proveedorId = parseInt(e.target.dataset.id);        // Obtiene

        const proveedor = await this.proveedorService.obtenerProveedorPorId(proveedorId); // proveedor por ID

        if (proveedor) { // proveedor existe!
          // Cargar  form
          this.proveedorIdInput.value = proveedor.id;   // carga de datos
          this.proveedorNombreInput.value = proveedor.nombre;//
          this.proveedorDireccionInput.value = proveedor.direccion;
          this.proveedorTelefonoInput.value = proveedor.telefono;
          // Establecer el estado del toggle en el formulario
          this.proveedorEstadoInput.checked = proveedor.estado;
          this.estadoProveedorTextoSpan.textContent = proveedor.estado ? 'Activo' : 'Inactivo';
          window.scrollTo(0, 0);
        }
      });
    });

    // Eliminar Proveedor
    this.tablaProveedores.querySelectorAll('.delete-proveedor').forEach(button => { // forEach para el boton eliminar
      button.addEventListener('click', async (e) => {               //
        const proveedorId = parseInt(e.target.dataset.id);     //
        // --- CONFIRMACION ---
        if (confirm("Esta seguro de eliminar?")) { //

          //Llamar al service, el metodo de indexeddb eliminar, pasamos  id
          const result = await this.proveedorService.eliminarProveedor(proveedorId);  //
          //Actualiza
          if (result !== null) {
            await this.cargarProveedores();      // Vuelve a cargar proveedores
            // Para actualizar select de Productos.
            await this.cargarOpcionesProductoForm(); //   productos

          }
        }
      });
    });

    // Nuevo: Toggle para cambiar estado en la tabla
    this.tablaProveedores.querySelectorAll('.estado-toggleProveedor').forEach(toggle => {
      toggle.addEventListener('change', async (e) => {
        const proveedorId = parseInt(e.target.dataset.id);
        const nuevoEstado = e.target.checked;

        try {
          const resultado = await this.proveedorService.actualizarProveedor(proveedorId, {
            estado: nuevoEstado
          });

          if (resultado !== null) {
            // Actualizar la vista sin recargar toda la tabla
            const tdEstado = e.target.closest('td').querySelector('.estado-indicatorProveedor');
            if (tdEstado) {
              tdEstado.innerHTML = nuevoEstado ?
                '<i class="fa-solid fa-circle-check fa-lg" style="color: #28a745;" title="Activo"></i>' :
                '<i class="fa-solid fa-circle-xmark fa-lg" style="color: #dc3545;" title="Inactivo"></i>';
            }
          }
        } catch (error) {
          console.error('Error al actualizar estado:', error);
          // Revertir cambio en UI en caso de error
          e.target.checked = !nuevoEstado;
          alert("Error al actualizar el estado del proveedor.");
        }
      });
    });
  }

  // Enviar Formulario Proveedor:  CREATE y UPDATE:
  async guardarProveedor(e) { // METODO, RECIBE EL EVENTO
    e.preventDefault(); // Prevenir comportamiento x defecto del Form, navegador,
    const proveedorId = this.proveedorIdInput.value;       //Desde elemento del DOM! -> HTML
    const nombre = this.proveedorNombreInput.value;       // Valor en la caja texto
    const direccion = this.proveedorDireccionInput.value;
    const telefono = this.proveedorTelefonoInput.value;
    const estado = this.proveedorEstadoInput.checked; // Obtener el estado del checkbox
    if (!nombre || !direccion) {
      alert("Campos obligatorios");
      return;  // Salida temprana
    }
    let resultado;
    try {
      if (proveedorId) {  // Si ya  id , es para:  *ACTUALIZACION*:

        const proveedorExistente = await this.proveedorService.obtenerProveedorPorId(parseInt(proveedorId)); //Buscar
        //Cambiar nombre, segun  *NUEVO* VALOR:
        proveedorExistente.nombre = nombre;
        proveedorExistente.direccion = direccion;
        proveedorExistente.telefono = telefono;
        // Llamamos al servicio de actualización pasando el ID y los NUEVOS datos

        resultado = await this.proveedorService.actualizarProveedor(parseInt(proveedorId), proveedorExistente); // Persistir cambios
        //Actualizar Vista:
        alert("Proveedor ACTUALIZADO") //Feedback al usuario!
      } else { // Si NO, ... CREAR
        const nuevoProveedor = new Proveedor(nombre, telefono, direccion, estado); // crea *INSTANCIA* Proveedor

        //Asigna
        resultado = await this.proveedorService.agregarProveedor(nuevoProveedor); //  await *RETORNA* id Generado.

        //Solo Si id *EXISTE* despues de haber sido agregado
        if (resultado) {

          //Añadir Fila
          alert(`EXITO Agregando Proveedor, ID ${resultado} `);

        } else { // Fallo registro,  por  razon
          throw new Error('Errores en Datos o Validacion.');

        } // cierra else
      }
      // Fin  if-else
      if (resultado) {
        this.resetFormProveedor()
        //Cargar Opciones actualizadas
        await this.cargarProveedores();// llama, volver cargar los datos, *ACTUALIZADOS*.
        await this.cargarOpcionesProductoForm();
        await appService.refreshCache(); //ACTUALIZAMOS CACHÉ

      }

    } catch (error) { // Registro de Excepciones:  Errores!  Avisar:
      console.error("Error :", error); // Programador
      alert("Revise consola") // Feedback al Usuario
    } //Finaliza TRY-CATCH

  } //CIERRA METODO  guardarProveedor()
  // Reset
  resetFormProveedor() {
    this.proveedorIdInput.value = '';
    this.proveedorNombreInput.value = '';
    this.proveedorDireccionInput.value = '';
    this.proveedorTelefonoInput.value = '';
    this.proveedorEstadoInput.checked = true; // Resetear a activo por defecto
    this.estadoProveedorTextoSpan.textContent = 'Activo'; // Resetear texto del estado
  }

  //---------------------------------------------------
  // Métodos CRUD para Clientes
  //---------------------------------------------------
  formatearTelefono(telefono) {
    // Elimina el "+" y todos los espacios
    return telefono.replace(/\+/g, '').replace(/\s+/g, '');
  }

  async cargarClientes() {
    try {
      const clientes = await this.clienteService.obtenerTodosLosClientes();
      this.tablaClientes.innerHTML = ''; // Limpiar

      if (!Array.isArray(clientes)) {
        console.error("Error: clientes is not an array.");
        return;
      }
      clientes.forEach(cliente => {
        const telefonoFormateado = this.formatearTelefono(cliente.telefono);
        const tr = document.createElement('tr');   // row
        tr.innerHTML = `
                 <td class="text-center">${cliente.nombre}</td>

              <td class="text-center">
                <!-- Llamada telefónica -->
                <a href="tel:${cliente.telefono}" title="Llamar vía telefónica ${cliente.telefono}" style="font-size: 22px;">
                  <i class="fa fa-phone fa-lg"></i>
                </a>

                &nbsp;&nbsp;&nbsp; 

                <!-- WhatsApp -->
<a type="button" title="Chatear por WhatsApp ${cliente.telefono}" 
        href="whatsapp://send?phone=${telefonoFormateado}&text=¡Hola%20${cliente.nombre}!%20💫%20En%20Lunaire%20tenemos%20novedades%20para%20ti.%20Acaban%20de%20llegar%20productos%20exclusivos%20que%20sabemos%20que%20te%20van%20a%20encantar.%20Pásate%20a%20verlos%20antes%20de%20que%20se%20agoten.%20✨%20Gracias%20por%20ser%20parte%20de%20nuestra%20comunidad%20Lunaire%20🌙"
        target="_blank">
        <i class="fa-brands fa-whatsapp fa-lg" style="font-size:1.8rem;"></i>
      </a>


              </td>

               <!-- <td class="text-center">${cliente.direccion}</td> -->
                <td class="text-center"><i class="fa-solid fa-eye fa-lg" style="color: deepskyblue; cursor: pointer" id="btnOpenModalDetailsCliente" data-id="${cliente.id}"></i></td>
               
                  <td class="text-center">
                  <div class="estado-cell">
                    <span class="estado-indicatorCliente hidden">${cliente.iconTrueFalse()}</span>
                    <input type="checkbox" id="clienteEstadoToggle${cliente.id}" class="toggle-input estado-toggleCliente" data-id="${cliente.id}" ${cliente.estado ? 'checked' : ''}>
                    <label for="clienteEstadoToggle${cliente.id}" class="toggle-label"></label>
                  </div>

                <td class"text-center">
                <div class="action-buttons" >
                 <button class="action-button edit-button edit-cliente" data-id="${cliente.id}"><i class="fa-solid fa-pencil fa-lg edit" data-id="${cliente.id}"></i></button>
                 <button class="action-button delete-button delete-cliente" data-id="${cliente.id}"><i class="fa-solid fa-trash-can fa-lg delete" data-id="${cliente.id}"></i></button>
                </div>
                </td>
               
                `;
        const btnOpenModal = tr.querySelector('#btnOpenModalDetailsCliente');
        if (btnOpenModal) {
          btnOpenModal.addEventListener('click', () => {
            this.openModalDetailsCli(cliente.id); // Pasar ID de la categoría seleccionada
          });
        }
        this.tablaClientes.appendChild(tr);  // Append, al tbody!
      });

      // Configurar listeners para los botones de editar y eliminar
      this.setupClienteListeners();

    } catch (error) {
      console.error("Error al cargar los Clientes:", error);
      alert("Error al cargar los Clientes."); // Mejor feedback al usuario
    }
  }

  async openModalDetailsCli(clienteId) {
    const cliente = await this.clienteService.obtenerClientePorId(clienteId); // Obtener solo el cliente seleccionado
    const modalDetails = document.getElementById('clienteModal');
    if (!cliente) {
      console.error("No se encontró el cliente");
      return;
    }
    // Llenar el modal con la información correcta
    document.getElementById('modalNombreCliente').textContent = cliente.nombre;
    document.getElementById('modalTelefonoCliente').textContent = cliente.telefono;
    document.getElementById('modalDireccionCliente').textContent = cliente.direccion;
    document.getElementById('modalContadorCliente').textContent = cliente.contador + ' veces';
    document.getElementById('modalEstadoCliente').innerHTML = cliente.iconTrueFalse();
    document.getElementById('modalFechaCreacionCliente').textContent = cliente.formatEcuadorDateTime(cliente.fechaCreacion);
    document.getElementById('modalFechaActualizacionCliente').textContent = cliente.formatEcuadorDateTime(cliente.fechaActualizacion);

    // Mostrar el modal
    modalDetails.classList.remove('hidden');
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => {
      modalDetails.classList.add('show');
    });
  }

  closeModalDetailsCli() {
    const modalDetails = document.getElementById('clienteModal');

    modalDetails.classList.remove('show');
    document.body.classList.remove('modal-open');

    setTimeout(() => {
      modalDetails.classList.add('hidden');
    }, 300);
  }

  // setupClienteListeners
  setupClienteListeners() {
    // Editar
    this.tablaClientes.querySelectorAll('.edit-cliente').forEach(button => {
      button.addEventListener('click', async (e) => { // Pone Evento click

        const clienteId = parseInt(e.target.dataset.id);        // Obtiene

        const cliente = await this.clienteService.obtenerClientePorId(clienteId); // cliente por ID

        if (cliente) { // cliente existe!
          // Cargar  form
          this.clienteIdInput.value = cliente.id;   // carga de datos
          this.clienteNombreInput.value = cliente.nombre;//
          this.clienteTelefonoInput.value = cliente.telefono;
          this.clienteDireccionInput.value = cliente.direccion;
        }
      });
    });

    // Eliminar Cliente
    this.tablaClientes.querySelectorAll('.delete-cliente').forEach(button => { // forEach para el boton eliminar
      button.addEventListener('click', async (e) => {               //
        const clienteId = parseInt(e.target.dataset.id);     //

        // --- CONFIRMACION ---
        if (confirm("Esta seguro de eliminar?")) { //

          //Llamar al service, el metodo de indexeddb eliminar, pasamos  id
          const result = await this.clienteService.eliminarCliente(clienteId);  //

          if (result !== null) {
            //Actualiza
            await this.cargarClientes();      // Vuelve a cargar clientes

          }
        }  //Cierra confirm()
      }); //cierra Listener
    });  // cierra forEach, setupClienteListeners
  } //cierra metodo

  // Enviar Formulario Cliente:  CREATE y UPDATE:
  async guardarCliente(e) { // METODO, RECIBE EL EVENTO
    e.preventDefault(); // Prevenir comportamiento x defecto del Form, navegador,
    const clienteId = this.clienteIdInput.value;       //Desde elemento del DOM! -> HTML
    const nombre = this.clienteNombreInput.value;       // Valor en la caja texto
    const telefono = this.clienteTelefonoInput.value;
    const direccion = this.clienteDireccionInput.value

    if (!nombre || !direccion || !telefono) {
      alert("Campos obligatorios");
      return;  // Salida temprana
    }
    let resultado;
    try {
      if (clienteId) {  // Si ya  id , es para:  *ACTUALIZACION*:

        const clienteExistente = await this.clienteService.obtenerClientePorId(parseInt(clienteId)); //Buscar
        //Cambiar nombre, segun  *NUEVO* VALOR:
        clienteExistente.nombre = nombre;
        clienteExistente.telefono = telefono;
        clienteExistente.direccion = direccion;
        resultado = await this.clienteService.actualizarCliente(parseInt(clienteId), clienteExistente); // Persistir cambios
        //Actualizar Vista:
        alert("Cliente ACTUALIZADO") //Feedback al usuario!
      } else { // Si NO, ... CREAR
        const nuevoCliente = new Cliente(nombre, telefono, direccion); // crea *INSTANCIA* Cliente
        //Asigna
        resultado = await this.clienteService.agregarCliente(nuevoCliente); //  await *RETORNA* id Generado.
        //Solo Si id *EXISTE* despues de haber sido agregado
        if (resultado) {
          //Añadir Fila
          alert(`EXITO Agregando Cliente, ID ${resultado} `);
        } else { // Fallo registro,  por  razon
          throw new Error('Errores en Datos o Validacion.');
        } // cierra else
      }
      // Fin  if-else

      if (resultado) {
        this.resetFormCliente()
        //Cargar Opciones actualizadas
        await this.cargarClientes();// llama, volver cargar los datos, *ACTUALIZADOS*.
        await appService.refreshCache(); //ACTUALIZAMOS CACHÉ
      }

    } catch (error) { // Registro de Excepciones:  Errores!  Avisar:
      console.error("Error :", error); // Programador
      alert("Revise consola") // Feedback al Usuario
    } //Finaliza TRY-CATCH
  } //CIERRA METODO  guardarCliente()
  // Reset

  resetFormCliente() {
    this.clienteIdInput.value = '';
    this.clienteNombreInput.value = '';
    this.clienteTelefonoInput.value = '';
    this.clienteDireccionInput.value = '';
  }

  //---------------------------------------------------
  // Métodos CRUD para Productos
  //---------------------------------------------------
  async cargarProductos() {
    try {
      const productos = await this.productoService.obtenerProductos();

      // Asegurarse de que tablaProductos existe
      if (!this.tablaProductos) {
        console.error('Error: tablaProductos no encontrada');
        return;
      }

      this.tablaProductos.innerHTML = '';

      if (!Array.isArray(productos)) {
        console.error('Error: El resultado de obtenerProductos no es un array.');
        return;
      }

      productos.forEach(producto => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
                <td class="text-center">${producto.nombre}</td>
                <td class="text-center">${producto.proveedorNombre}</td>
                <td class="text-center">${producto.stock}</td>
                <td class="text-center"><i class="fa-solid fa-eye fa-lg" style="color: deepskyblue; cursor: pointer" id="btnOpenModalDetailsProd" data-id="${producto.id}"></i></td>
        
                 <td class="text-center">
            <div class="estado-cell">
              <input type="checkbox" id="productoEstadoToggle${producto.id}" class="toggle-input estado-toggleProducto" data-id="${producto.id}" ${producto.estado ? 'checked' : ''}>
              <label for="productoEstadoToggle${producto.id}" class="toggle-label"></label>
            </div>
          </td> 
     
<td class="text-center">
                <div class="action-buttons">
                    <button class="action-button edit-button edit-producto" data-id="${producto.id}"><i class="fa-solid fa-pencil fa-lg edit" data-id="${producto.id}"></i></button>
                    <button class="action-button delete-button delete-producto" data-id="${producto.id}"><i class="fa-solid fa-trash-can fa-lg delete" data-id="${producto.id}"></i></button>
                </div>
                </td>
            `;
        const btnOpenModal = tr.querySelector('#btnOpenModalDetailsProd');
        if (btnOpenModal) {
          btnOpenModal.addEventListener('click', () => {
            this.openModalDetailsProd(producto.id); // Pasar ID de la  seleccionada
          });
        }
        this.tablaProductos.appendChild(tr);
      });

      // Configurar los listeners después de cargar los productos
      this.setupProductoListeners();

      // Actualizar la vista de la tienda si está visible
      if (!document.getElementById('tienda').classList.contains('hidden')) {
        await app.tiendaController.cargarProductos();
      }

    } catch (error) {
      console.error("Hubo un error obteniendo los productos:", error);
      alert("Error al cargar los productos");
    }
  }

  async openModalDetailsProd(productoId) {
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


  setupProductoListeners() {
    // Editar
    this.tablaProductos.querySelectorAll('.edit-producto').forEach(button => {
      button.addEventListener('click', async (e) => { // Pone Evento click

        const productoId = parseInt(e.target.dataset.id);        // Obtiene

        const producto = await this.productoService.obtenerProductoPorId(productoId); // producto por ID

        if (producto) { // producto existe!
          // Cargar  form
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
          this.productoEstadoInput.checked = producto.estado; // Asignar estado al checkbox
          this.estadoProductoTextoSpan.textContent = producto.estado ? 'Activo' : 'Inactivo'; // Cambiar texto del estado
          window.scrollTo(0, 0); // Desplazar la ventana hacia arriba
        }
      });
    });
    // Eliminar Producto
    this.tablaProductos.querySelectorAll('.delete-producto').forEach(button => { // forEach para el boton eliminar
      button.addEventListener('click', async (e) => {               //
        const productoId = parseInt(e.target.dataset.id);     //

        // --- CONFIRMACION ---
        if (confirm("Esta seguro de eliminar?")) { //

          //Llamar al service, el metodo de indexeddb eliminar, pasamos  id
          const result = await this.productoService.eliminarProducto(productoId);  //
          //Actualiza
          if (result !== null) {
            await this.cargarProductos();      // Vuelve a cargar productos
            //Verifica que tiendaController esté definido antes de usarlo
            await app.tiendaController.cargarProductos();

          }

        }  //Cierra confirm()
      }); //cierra Listener

    });  // cierra forEach, setupProductoListeners
    // Nuevo: Toggle para cambiar estado en la tabla
    this.tablaProductos.querySelectorAll('.estado-toggleProducto').forEach(toggle => {
      toggle.addEventListener('change', async (e) => {
        const productoId = parseInt(e.target.dataset.id);
        const nuevoEstado = e.target.checked;

        try {
          const resultado = await this.productoService.actualizarProducto(productoId, {
            estado: nuevoEstado
          });

          if (resultado !== null) {
            // Actualizar la vista sin recargar toda la tabla
            const tdEstado = e.target.closest('td').querySelector('.estado-indicatorProducto');
            if (tdEstado) {
              tdEstado.innerHTML = nuevoEstado ?
                '<i class="fa-solid fa-circle-check fa-lg" style="color: #28a745;" title="Activo"></i>' :
                '<i class="fa-solid fa-circle-xmark fa-lg" style="color: #dc3545;" title="Inactivo"></i>';
            }
          }
        } catch (error) {
          console.error('Error al actualizar estado:', error);
          // Revertir cambio en UI en caso de error
          e.target.checked = !nuevoEstado;
          alert("Error al actualizar el estado del producto.");
        }
      });
    });
  } //cierra metodo

  // Enviar Formulario Producto:  CREATE y UPDATE:
  async guardarProducto(e) {
    e.preventDefault();
    const productoId = this.productoIdInput.value;
    const nombre = this.productoNombreInput.value;
    const precio = this.productoPrecioInput.value;
    const categoriaId = this.productoCategoriaSelect.value;
    const marcaId = this.productoMarcaSelect.value;
    const proveedorId = this.productoProveedorSelect.value;
    const stock = this.productoStockInput.value;
    const pvp = this.productoPVPInput.value;
    const descripcion = this.productoDescripcionInput.value;
    const imagen = this.productoImagenInput.value;
    const estado = this.productoEstadoInput.checked; // Obtener el estado del checkbox

    // 1. Validaciones previas:
    if (!nombre || !precio || !categoriaId || !marcaId || !proveedorId || !stock || !pvp) {
      alert("Todos los campos marcados con (*) son obligatorios");
      return;  // Salida temprana si faltan campos
    }

    // 2. Conversión de datos:
    const precioNumerico = parseFloat(precio);
    const pvpNumerico = parseFloat(pvp);
    const stockNumerico = parseInt(stock, 10);
    const categoriaIdNumerico = parseInt(categoriaId, 10);
    const marcaIdNumerico = parseInt(marcaId, 10);
    const proveedorIdNumerico = parseInt(proveedorId, 10);

    // Comprobaciones adicionales:
    if (isNaN(precioNumerico) || isNaN(pvpNumerico) || isNaN(stockNumerico) ||
      isNaN(categoriaIdNumerico) || isNaN(marcaIdNumerico) || isNaN(proveedorIdNumerico)) {
      alert("Error: Valores numéricos inválidos.");
      return;
    }
    if (precioNumerico < 0 || pvpNumerico < 0 || stockNumerico < 0) {
      alert('No se permiten números negativos');
      return;
    }

    let resultado;
    try {
      if (productoId) {
        // ACTUALIZAR
        const productoExistente = await this.productoService.obtenerProductoPorId(parseInt(productoId));
        if (!productoExistente) {
          alert("Error: Producto no encontrado.");
          return;
        }

        const categoria = await this.categoriaService.obtenerCategoriaPorId(categoriaIdNumerico);
        const marca = await this.marcaService.obtenerMarcaPorId(marcaIdNumerico);
        const proveedor = await this.proveedorService.obtenerProveedorPorId(proveedorIdNumerico);

        const productoActualizado = {
          ...productoExistente,
          nombre: nombre,
          precio: precioNumerico,
          categoriaId: categoriaIdNumerico,
          categoriaNombre: categoria.nombre,
          marcaId: marcaIdNumerico,
          marcaNombre: marca.nombre,
          proveedorId: proveedorIdNumerico,
          proveedorNombre: proveedor.nombre,
          stock: stockNumerico,
          pvp: pvpNumerico,
          descripcion: descripcion,
          imagen: imagen,
          id: parseInt(productoId),
          estado: estado, // Actualizar el estado
        };

        resultado = await this.productoService.actualizarProducto(parseInt(productoId), productoActualizado);
        if (resultado !== null) {
          alert("Producto ACTUALIZADO");
        }
      } else {
        // CREAR
        const nuevoProducto = new Producto(
          nombre,                  // nombre
          true,                    // estado (activo)
          new Date(),              // fechaCreacion
          new Date(),              // fechaActualizacion
          categoriaIdNumerico,     // categoriaId
          '',                      // categoriaNombre (temporal)
          marcaIdNumerico,         // marcaId
          '',                      // marcaNombre (temporal)
          proveedorIdNumerico,     // proveedorId
          '',                      // proveedorNombre (temporal)
          precioNumerico,          // precio
          pvpNumerico,             // pvp
          stockNumerico,           // cantidad
          descripcion,             // descripcion
          imagen                   // imagen
        );
        resultado = await this.productoService.agregarProducto(nuevoProducto);
        if (resultado) {
          alert(`EXITO Agregando Producto, ID ${resultado} `);
        }
      }

      if (resultado !== null && resultado !== undefined) {
        this.resetFormProducto();
        await this.cargarProductos();
        await this.cargarOpcionesProductoForm();
        await appService.refreshCache();
      } else {
        throw new Error('Errores en Datos o Validacion.');
      }
    } catch (error) {
      console.error("Error :", error);
      alert("Revise consola");
    }
  }


  // Reset
  resetFormProducto() {
    this.productoIdInput.value = ''
    this.productoNombreInput.value = ''
    this.productoPrecioInput.value = ''
    this.productoCategoriaSelect.value = ''
    this.productoMarcaSelect.value = ''
    this.productoProveedorSelect.value = ''
    this.productoStockInput.value = ''
    this.productoPVPInput.value = ''
    this.productoDescripcionInput.value = ''
    this.productoImagenInput.value = ''
    this.productoEstadoInput.checked = true; // Resetear a activo por defecto
    this.estadoProductoTextoSpan.textContent = 'Activo'; // Resetear texto del estado
  }

  async cargarOpcionesProductoForm() {
    try {
      const categorias = await appService.getCategorias(); //  await
      const marcas = await appService.getMarcas(); //  await
      const proveedores = await appService.getProveedores(); //  await
      // Limpiar antes (por precaucion)

      this.productoCategoriaSelect.innerHTML = '<option value="">Seleccione Categoría</option>'; // reset
      this.productoMarcaSelect.innerHTML = '<option value="">Seleccione Marca</option>';       //
      this.productoProveedorSelect.innerHTML = '<option value="">Seleccione Proveedor</option>';     //

      // Verificar que sean arrays antes de iterar
      if (Array.isArray(categorias)) {
        categorias.forEach(categoria => {
          this.productoCategoriaSelect.innerHTML += `<option value="${categoria.id}">${categoria.nombre}</option>`;
        });
      } else {
        console.error("Error: categorias no es un array");
      }

      if (Array.isArray(marcas)) {
        marcas.forEach(marca => {
          this.productoMarcaSelect.innerHTML += `<option value="${marca.id}">${marca.nombre}</option>`;
        });
      } else {
        console.error("Error: marcas no es un array");
      }


      if (Array.isArray(proveedores)) {
        proveedores.forEach(proveedor => {
          this.productoProveedorSelect.innerHTML += `<option value="${proveedor.id}">${proveedor.nombre}</option>`;
        });
      } else {
        console.error('proveedores no es un array')
      }


    } catch (error) {     // Errores
      //Feedback, si falla.
      console.error("Error:", error);
      alert("Hubo Error al cargar opciones para Formulario"); //
    }
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

      invoiceDetails.innerHTML = await InvoiceTemplate.generarHTML(factura, false);
      invoiceModal.classList.remove('hidden');
      document.body.classList.add('modal-open');
      requestAnimationFrame(() => invoiceModal.classList.add('show'));

      document.getElementById('btnCloseInvoice').addEventListener('click', () => this.cerrarFactura(), { once: true });
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

          const resultado = await this.facturaService.actualizarFactura(factura.id, { estado: nuevoEstado });
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

      document.getElementById('btnCloseModalDetailsHistorial').addEventListener('click', () => this.cerrarDetallesFactura(), { once: true });
    } catch (error) {
      console.error('Error al mostrar detalles:', error);
      alert(`Error: ${error.message}`);
    }
  }

  setupVentasListeners() {
    const tabla = document.getElementById('tablaVentas');
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
const adminController = new AdminController(app.categoriaService, app.marcaService, app.proveedorService, app.clienteService, app.productoService, app.facturaService);

export { adminController };