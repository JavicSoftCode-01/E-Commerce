// FrontEnd/ui/controllers/AdminController.js
import {app} from '../AppFactory.js';
import {Categoria} from '../../../../BackEnd/src/models/Categoria.js';
import {Marca} from '../../../../BackEnd/src/models/Marca.js';
import {Proveedor} from '../../../../BackEnd/src/models/Proveedor.js';
import {Cliente} from '../../../../BackEnd/src/models/Cliente.js';
import {Producto} from '../../../../BackEnd/src/models/Producto.js';
import {appService} from '../services/UшымтаService.js'; // Importar para usar la caché
import {CheckoutController} from './CheckoutController.js';

// import {TiendaController} from "./TiendaController.js";  // Importa tiendaController


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
    this.tablaCategorias = document.getElementById('tablaCategorias').querySelector('tbody');
    // this.btnResetCategoriaForm = document.getElementById('resetCategoriaForm') //ya no es necesario

    // Elementos Marcas
    this.formMarca = document.getElementById('formMarca');
    this.marcaIdInput = document.getElementById('marcaId');
    this.marcaNombreInput = document.getElementById('marcaNombre');
    this.tablaMarcas = document.getElementById('tablaMarcas').querySelector('tbody');
    // this.btnResetMarcaForm = document.getElementById('resetMarcaForm')//ya no es necesario

    // Elementos Proveedores
    this.formProveedor = document.getElementById('formProveedor');
    this.proveedorIdInput = document.getElementById('proveedorId');
    this.proveedorNombreInput = document.getElementById('proveedorNombre');
    this.proveedorTelefonoInput = document.getElementById('proveedorTelefono');
    this.proveedorContactoInput = document.getElementById('proveedorContacto');
    this.tablaProveedores = document.getElementById('tablaProveedores').querySelector('tbody');
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
    this.tablaProductos = document.getElementById('tablaProductos').querySelector('tbody');
    //this.btnResetProductoForm = document.getElementById('resetProductoForm'); //ya no es necesario

    // Elementos Ventas (factura)
    this.tablaVentas = document.getElementById('tablaVentas').querySelector('tbody');

    // this.tiendaController = new TiendaController() // <-- ¡ELIMINAR ESTO!
    this.tiendaController = app.tiendaController; // <-- ¡USAR ESTO!
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
      // Aquí puedes agregar más listeners para otros botones de reset si los tienes
    });
  }

  async mostrarPanelAdmin() {
    //Ocultar otros
    document.getElementById('tienda').classList.add('hidden');
    document.getElementById('cartSection').classList.add('hidden');
    document.getElementById('checkoutSection').classList.add('hidden'); // Asegúrate de que esta línea esté presente
    this.adminSection.classList.remove('hidden');
    this.cargarSeccionAdmin('categorias');  // Por defecto
  }

  async cargarSeccionAdmin(tabName) {
    this.adminSections.forEach(section => section.classList.add('hidden'));
    document.getElementById('admin' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).classList.remove('hidden');
    this.adminTabs.forEach(tab => tab.classList.remove('active')); //Desactivar otra tab
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
        await this.cargarOpcionesProductoForm(); //Selects
        await this.cargarProductos();
        break;
      case 'ventas':
        await this.cargarVentas(); // Metodo.
        break;
    }
  }

  //---------------------------------------------------
  // Métodos CRUD para Categorías
  //---------------------------------------------------

  //En AdminController, cargarCategorias y demas metodos que hacen la carga
  async cargarCategorias() {
    try {
      const categorias = await appService.getCategorias();
      this.tablaCategorias.innerHTML = ''; // Limpiar

      if (!Array.isArray(categorias)) {
        console.error("Error: categorias is not an array.");
        return;
      }
      categorias.forEach(categoria => {
        const tr = document.createElement('tr');   // row
        tr.innerHTML = `
               <td>${categoria.id}</td>
                <td>${categoria.nombre}</td>
            <td class="action-buttons">
                 <button class="action-button edit-button edit-categoria" data-id="${categoria.id}">Editar</button>
                 <button class="action-button delete-button delete-categoria" data-id="${categoria.id}">Eliminar</button>
                </td>
          `;
        this.tablaCategorias.appendChild(tr);  // Append, al tbody!
      });
      // Configurar listeners para los botones de editar y eliminar
      this.setupCategoriaListeners();

    } catch (error) {
      console.error("Error al cargar las categorías:", error);
      alert("Error al cargar las categorías."); // Mejor feedback al usuario
    }
  }

  setupCategoriaListeners() {
    // Editar
    this.tablaCategorias.querySelectorAll('.edit-categoria').forEach(button => {
      button.addEventListener('click', async (e) => { // Pone Evento click

        const categoriaId = parseInt(e.target.dataset.id);        // Obtiene
        const categoria = await this.categoriaService.obtenerCategoriaPorId(categoriaId); // Categoria por ID

        if (categoria) { // Categoria existe!
          // Cargar  form
          this.categoriaIdInput.value = categoria.id;   // carga de datos
          this.categoriaNombreInput.value = categoria.nombre;//
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

  } //cierra metodo
  // Enviar Formulario Categoria:  CREATE y UPDATE:  (categorias)
  async guardarCategoria(e) {
    e.preventDefault();
    const categoriaId = this.categoriaIdInput.value;
    const nombre = this.categoriaNombreInput.value;

    if (!nombre) {
      alert("Campos obligatorios");
      return;  // Salida temprana
    }

    let resultado;
    try {
      if (categoriaId) {

        const categoriaExistente = await this.categoriaService.obtenerCategoriaPorId(parseInt(categoriaId)); //Buscar
        categoriaExistente.nombre = nombre;
        resultado = await this.categoriaService.actualizarCategoria(parseInt(categoriaId), categoriaExistente);

        alert("Categoria ACTUALIZADA")

      } else {
        const nuevaCategoria = new Categoria(nombre);
        resultado = await this.categoriaService.agregarCategoria(nuevaCategoria);

        if (resultado) {
          alert(`EXITO Agregando Categoria, ID ${resultado} `);

        } else {
          throw new Error('Errores en Datos o Validacion.');
        } // cierra else

      }  // Fin if-else
      if (resultado) {
        this.resetFormCategoria();
        //Cargar Opciones actualizadas
        await this.cargarCategorias();
        await this.cargarOpcionesProductoForm(); //  <--- AÑADE ESTO
        await appService.refreshCache(); //ACTUALIZAMOS CACHÉ
      }
    } catch (error) {
      console.error("Error :", error);
      alert("Revise consola") // Feedback al Usuario
    }
  }

  // Reset
  resetFormCategoria() {

    this.categoriaIdInput.value = '';       // Reset ID (oculto)
    this.categoriaNombreInput.value = ''; // Reset Nombre (visible)
  }

  //---------------------------------------------------
  // Métodos CRUD para Marcas
  //---------------------------------------------------
  async cargarMarcas() {
    try {
      const marcas = await this.marcaService.obtenerTodasLasMarcas();
      this.tablaMarcas.innerHTML = ''; // Limpiar

      if (!Array.isArray(marcas)) {
        console.error("Error: marcas is not an array.");
        return;
      }
      marcas.forEach(marca => {
        const tr = document.createElement('tr');   // row
        tr.innerHTML = `
                     <td>${marca.id}</td>
                   <td>${marca.nombre}</td>
                     <td class="action-buttons">
                        <button class="action-button edit-button edit-marca" data-id="${marca.id}">Editar</button>
                         <button class="action-button delete-button delete-marca" data-id="${marca.id}">Eliminar</button>
                     </td>
               `;
        this.tablaMarcas.appendChild(tr);  // Append, al tbody!
      });

      // Configurar listeners para los botones de editar y eliminar
      this.setupMarcaListeners();

    } catch (error) {
      console.error("Error al cargar las Marcas:", error);
      alert("Error al cargar las Marcas."); // Mejor feedback al usuario
    }
  }

  // setupMarcaListeners
  setupMarcaListeners() {
    // Editar
    this.tablaMarcas.querySelectorAll('.edit-marca').forEach(button => {
      button.addEventListener('click', async (e) => { // Pone Evento click

        const marcaId = parseInt(e.target.dataset.id);        // Obtiene

        const marca = await this.marcaService.obtenerMarcaPorId(marcaId); // Marca por ID

        if (marca) { // Marca existe!
          // Cargar  form
          this.marcaIdInput.value = marca.id;   // carga de datos
          this.marcaNombreInput.value = marca.nombre;//
        }
      });
    });

    // Eliminar Marca
    this.tablaMarcas.querySelectorAll('.delete-marca').forEach(button => { // forEach para el boton eliminar
      button.addEventListener('click', async (e) => {               //
        const marcaId = parseInt(e.target.dataset.id);     //

        // --- CONFIRMACION ---
        if (confirm("Esta seguro de eliminar?")) { //

          //Llamar al service, el metodo de indexeddb eliminar, pasamos  id
          const result = await this.marcaService.eliminarMarca(marcaId);  //

          //Actualiza

          if (result !== null) {
            await this.cargarMarcas();      // Vuelve a cargar marcas
            // Para actualizar select de Productos.
            await this.cargarOpcionesProductoForm(); //   productos

          }

        }  //Cierra confirm()

      }); //cierra Listener

    });  // cierra forEach, setupMarcaListeners

  } //cierra metodo

  // Enviar Formulario Marca:  CREATE y UPDATE:
  async guardarMarca(e) { // METODO, RECIBE EL EVENTO
    e.preventDefault(); // Prevenir comportamiento x defecto del Form, navegador,

    const marcaId = this.marcaIdInput.value;       //Desde elemento del DOM! -> HTML
    const nombre = this.marcaNombreInput.value;       // Valor en la caja texto

    if (!nombre) {
      alert("Campos obligatorios");
      return;  // Salida temprana
    }
    let resultado;
    try {
      if (marcaId) {  // Si ya  id , es para:  *ACTUALIZACION*:

        const marcaExistente = await this.marcaService.obtenerMarcaPorId(parseInt(marcaId)); //Buscar
        //Cambiar nombre, segun  *NUEVO* VALOR:

        marcaExistente.nombre = nombre;

        resultado = await this.marcaService.actualizarMarca(parseInt(marcaId), marcaExistente); // Persistir cambios
        //Actualizar Vista:
        alert("Marca ACTUALIZADA") //Feedback al usuario!


      } else { // Si NO, ... CREAR

        const nuevaMarca = new Marca(nombre); // crea *INSTANCIA* Marca
        //Asigna
        resultado = await this.marcaService.agregarMarca(nuevaMarca); //  await *RETORNA* id Generado.

        //Solo Si id *EXISTE* despues de haber sido agregado
        if (resultado) {

          //Añadir Fila
          alert(`EXITO Agregando Marca, ID ${resultado} `);

        } else { // Fallo registro,  por  razon
          throw new Error('Errores en Datos o Validacion.');
        } // cierra else

      }
      // Fin  if-else

      if (resultado) {
        this.resetFormMarca()
        //Cargar Opciones actualizadas
        await this.cargarMarcas();// llama, volver cargar los datos, *ACTUALIZADOS*.
        await this.cargarOpcionesProductoForm();
        await appService.refreshCache(); //ACTUALIZAMOS CACHÉ
      }

    } catch (error) { // Registro de Excepciones:  Errores!  Avisar:
      console.error("Error :", error); // Programador
      alert("Revise consola") // Feedback al Usuario
    } //Finaliza TRY-CATCH

  } //CIERRA METODO  guardarMarca()
  // Reset
  resetFormMarca() {

    this.marcaIdInput.value = '';
    this.marcaNombreInput.value = '';
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
        tr.innerHTML = `
               <td>${proveedor.id}</td>
                <td>${proveedor.nombre}</td>
               <td>${proveedor.telefono}</td>
               <td>${proveedor.direccion}</td>
                <td class="action-buttons">
                     <button class="action-button edit-button edit-proveedor" data-id="${proveedor.id}">Editar</button>
                    <button class="action-button delete-button delete-proveedor" data-id="${proveedor.id}">Eliminar</button>
               </td>
                </td>
          `;
        this.tablaProveedores.appendChild(tr);  // Append, al tbody!
      });

      // Configurar listeners para los botones de editar y eliminar
      this.setupProveedorListeners();

    } catch (error) {
      console.error("Error al cargar los Proveedores:", error);
      alert("Error al cargar los Proveedores."); // Mejor feedback al usuario
    }
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
          this.proveedorContactoInput.value = proveedor.direccion;
          this.proveedorTelefonoInput.value = proveedor.telefono;
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

        }  //Cierra confirm()
      }); //cierra Listener

    });  // cierra forEach, setupProveedorListeners

  } //cierra metodo

  // Enviar Formulario Proveedor:  CREATE y UPDATE:
  async guardarProveedor(e) { // METODO, RECIBE EL EVENTO
    e.preventDefault(); // Prevenir comportamiento x defecto del Form, navegador,
    const proveedorId = this.proveedorIdInput.value;       //Desde elemento del DOM! -> HTML
    const nombre = this.proveedorNombreInput.value;       // Valor en la caja texto
    const direccion = this.proveedorContactoInput.value;
    const telefono = this.proveedorTelefonoInput.value;
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
        resultado = await this.proveedorService.actualizarProveedor(parseInt(proveedorId), proveedorExistente); // Persistir cambios
        //Actualizar Vista:
        alert("Proveedor ACTUALIZADO") //Feedback al usuario!
      } else { // Si NO, ... CREAR
        const nuevoProveedor = new Proveedor(nombre, telefono, direccion); // crea *INSTANCIA* Proveedor

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
    this.proveedorContactoInput.value = '';
    this.proveedorTelefonoInput.value = '';
  }

  //---------------------------------------------------
  // Métodos CRUD para Clientes
  //---------------------------------------------------
  async cargarClientes() {
    try {
      const clientes = await this.clienteService.obtenerTodosLosClientes();
      this.tablaClientes.innerHTML = ''; // Limpiar

      if (!Array.isArray(clientes)) {
        console.error("Error: clientes is not an array.");
        return;
      }
      clientes.forEach(cliente => {
        const tr = document.createElement('tr');   // row
        tr.innerHTML = `
                   <td>${cliente.id}</td>
                <td>${cliente.nombre}</td>
                 <td>${cliente.telefono}</td>
               <td>${cliente.direccion}</td>
                    <td class="action-buttons">
                        <button class="action-button edit-button edit-cliente" data-id="${cliente.id}">Editar</button>
                     <button class="action-button delete-button delete-cliente" data-id="${cliente.id}">Eliminar</button>
                  </td>
                `;
        this.tablaClientes.appendChild(tr);  // Append, al tbody!
      });

      // Configurar listeners para los botones de editar y eliminar
      this.setupClienteListeners();

    } catch (error) {
      console.error("Error al cargar los Clientes:", error);
      alert("Error al cargar los Clientes."); // Mejor feedback al usuario
    }
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
  // async cargarProductos() {
  //   try {
  //     const productos = await this.productoService.obtenerProductos();
  //     this.tablaProductos.innerHTML = '';
  //     if (!Array.isArray(productos)) {
  //       console.error('Error: El resultado de obtenerProductos no es un array.');
  //       return;
  //     }
  //     productos.forEach(producto => {
  //       const tr = document.createElement('tr');
  //       tr.innerHTML = `
  //                  <td>${producto.id}</td>
  //                  <td>${producto.nombre}</td>
  //                <td>${producto.categoriaNombre}</td>
  //                  <td>${producto.marcaNombre}</td>
  //                    <td>$${producto.pvp.toFixed(2)}</td>
  //                    <td>${producto.proveedorNombre}</td>
  //                <td>${producto.stock}</td>
  //                  <td class="action-buttons">
  //                     <button class="action-button edit-button edit-producto" data-id="${producto.id}">Editar</button>
  //                     <button class="action-button delete-button delete-producto" data-id="${producto.id}">Eliminar</button>
  //                   </td>
  //                  `;
  //       this.tablaProductos.appendChild(tr); // Añade a tbody
  //     });
  //     this.setupProductoListeners();
  //   } catch (error) {
  //     console.error("Hubo un error obteniendo los productos:", error);
  //     alert("Error al cargar los productos");
  //   }
  // }
  async cargarProductos() {
    try {
      const productos = await this.productoService.obtenerProductos();
      this.tablaProductos.innerHTML = '';
      if (!Array.isArray(productos)) {
        console.error('Error: El resultado de obtenerProductos no es un array.');
        return;
      }
      productos.forEach(producto => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
                       <td>${producto.id}</td>
                       <td>${producto.nombre}</td>
                     <td>${producto.categoriaNombre}</td>
                       <td>${producto.marcaNombre}</td>
                         <td>$${producto.pvp.toFixed(2)}</td>
                         <td>${producto.proveedorNombre}</td>
                     <td>${producto.stock}</td>
                       <td class="action-buttons">
                          <button class="action-button edit-button edit-producto" data-id="${producto.id}">Editar</button>
                          <button class="action-button delete-button delete-producto" data-id="${producto.id}">Eliminar</button>
                        </td>
                       `;
        this.tablaProductos.appendChild(tr); // Añade a tbody
      });
      this.setupProductoListeners();
    } catch (error) {
      console.error("Hubo un error obteniendo los productos:", error);
      alert("Error al cargar los productos");
    }
  }

  // setupProductoListeners() {
  //   // Editar
  //   this.tablaProductos.querySelectorAll('.edit-producto').forEach(button => {
  //     button.addEventListener('click', async (e) => { // Pone Evento click
  //
  //       const productoId = parseInt(e.target.dataset.id);        // Obtiene
  //
  //       const producto = await this.productoService.obtenerProductoPorId(productoId); // producto por ID
  //
  //       if (producto) { // producto existe!
  //         // Cargar  form
  //         this.productoIdInput.value = producto.id;
  //         this.productoNombreInput.value = producto.nombre;
  //         this.productoPrecioInput.value = producto.precio;
  //         this.productoCategoriaSelect.value = producto.categoriaId;
  //         this.productoMarcaSelect.value = producto.marcaId;
  //         this.productoProveedorSelect.value = producto.proveedorId;
  //         this.productoStockInput.value = producto.stock;
  //         this.productoPVPInput.value = producto.pvp;
  //         this.productoDescripcionInput.value = producto.descripcion;
  //         this.productoImagenInput.value = producto.imagen
  //       }
  //     });
  //   });
  //   // Eliminar Producto
  //   this.tablaProductos.querySelectorAll('.delete-producto').forEach(button => { // forEach para el boton eliminar
  //     button.addEventListener('click', async (e) => {               //
  //       const productoId = parseInt(e.target.dataset.id);     //
  //
  //       // --- CONFIRMACION ---
  //       if (confirm("Esta seguro de eliminar?")) { //
  //
  //         //Llamar al service, el metodo de indexeddb eliminar, pasamos  id
  //         const result = await this.productoService.eliminarProducto(productoId);  //
  //         //Actualiza
  //         if (result !== null) {
  //           await this.cargarProductos();      // Vuelve a cargar productos
  //           //Verifica que tiendaController esté definido antes de usarlo
  //           if (typeof this.tiendaController !== 'undefined' && this.tiendaController.cargarProductos) {
  //             this.tiendaController.cargarProductos();
  //           } else {
  //             console.error("tiendaController no está definido o no tiene un método cargarProductos.");
  //           }
  //
  //         }
  //
  //       }  //Cierra confirm()
  //     }); //cierra Listener
  //
  //   });  // cierra forEach, setupProductoListeners
  // } //cierra metodo
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
          this.productoImagenInput.value = producto.imagen
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
  } //cierra metodo
  // Enviar Formulario Producto:  CREATE y UPDATE:
  // async guardarProducto(e) { // METODO, RECIBE EL EVENTO
  //   e.preventDefault(); // Prevenir comportamiento x defecto del Form, navegador,
  //   // Obtener los datos para un nuevo producto.
  //   const productoId = this.productoIdInput.value;
  //   const nombre = this.productoNombreInput.value;
  //   const precio = this.productoPrecioInput.value;
  //   const categoriaId = this.productoCategoriaSelect.value;
  //   const marcaId = this.productoMarcaSelect.value;
  //   const proveedorId = this.productoProveedorSelect.value;
  //   const stock = this.productoStockInput.value;
  //   const pvp = this.productoPVPInput.value;
  //   const descripcion = this.productoDescripcionInput.value;
  //   const imagen = this.productoImagenInput.value;
  //
  //   if (!nombre || !precio || !categoriaId || !marcaId || !proveedorId || !stock || !pvp) {
  //     alert("Todos los campos marcados con (*) son obligatorios");
  //     return;
  //   }
  //   // Convertir datos.
  //   const precioNumerico = parseFloat(precio);
  //   const pvpNumerico = parseFloat(pvp);
  //   const stockNumerico = parseInt(stock, 10); // Asegurarse de que stock sea un entero.
  //   const categoriaIdNumerico = parseInt(categoriaId, 10);
  //   const marcaIdNumerico = parseInt(marcaId, 10);
  //   const proveedorIdNumerico = parseInt(proveedorId, 10);
  //   let resultado;
  //   try {
  //     if (productoId) {  // Si ya  id , es para:  *ACTUALIZACION*:
  //
  //       const productoExistente = await this.productoService.obtenerProductoPorId(parseInt(productoId)); //Buscar
  //       //Cambiar, segun  *NUEVO* VALOR:
  //       const categoria = await this.categoriaService.obtenerCategoriaPorId(categoriaIdNumerico)
  //       const marca = await this.marcaService.obtenerMarcaPorId(marcaIdNumerico);
  //       const proveedor = await this.proveedorService.obtenerProveedorPorId(proveedorIdNumerico);
  //
  //       productoExistente.nombre = nombre;
  //       productoExistente.precio = precioNumerico;
  //       productoExistente.categoriaId = categoriaIdNumerico;
  //       productoExistente.categoriaNombre = categoria.nombre
  //       productoExistente.marcaId = marcaIdNumerico;
  //       productoExistente.marcaNombre = marca.nombre;
  //       productoExistente.proveedorId = proveedorIdNumerico;
  //       productoExistente.proveedorNombre = proveedor.nombre
  //       productoExistente.stock = stockNumerico;
  //       productoExistente.pvp = pvpNumerico;
  //       productoExistente.descripcion = descripcion
  //       productoExistente.imagen = imagen
  //
  //       resultado = await this.productoService.actualizarProducto(parseInt(productoId), productoExistente); // Persistir cambios
  //       //Actualizar Vista:
  //       alert("Producto ACTUALIZADO") //Feedback al usuario!
  //
  //
  //     } else { // Si NO, ... CREAR
  //
  //       // Crear Instancia, pasar todos los datos que necesita:
  //
  //       const categoria = await this.categoriaService.obtenerCategoriaPorId(categoriaIdNumerico); //
  //       const marca = await this.marcaService.obtenerMarcaPorId(marcaIdNumerico);             //
  //       const proveedor = await this.proveedorService.obtenerProveedorPorId(proveedorIdNumerico);   //
  //
  //
  //       const nuevoProducto = new Producto( // Instancia!!:
  //         nombre,  // nombre
  //         categoriaIdNumerico,     // Categoria ID  *Entero*!
  //         categoria.nombre,  // categoriaNombre
  //         marcaIdNumerico,        //
  //         marca.nombre,   //
  //         proveedorIdNumerico,      //
  //         proveedor.nombre,//
  //         precioNumerico,      //
  //         pvpNumerico,         // pvp
  //         stockNumerico,         //
  //         descripcion,   // Descripcion.
  //         imagen     // imagen.
  //       );
  //
  //       // MUY IMPORTANTE:
  //
  //       // indexedDB Asigna
  //       nuevoProducto.serial = await Producto.generarSerialProducto(app.idGeneratorService);
  //       resultado = await this.productoService.agregarProducto(nuevoProducto);    //
  //
  //       //Solo Si id *EXISTE* despues de haber sido agregado
  //       if (resultado) {
  //
  //         //Añadir Fila
  //         alert(`EXITO Agregando Producto, ID ${resultado} `);
  //
  //       } else { // Fallo registro,  por  razon
  //         throw new Error('Errores en Datos o Validacion.');
  //
  //       } // cierra else
  //
  //     }
  //     // Fin  if-else
  //
  //     if (resultado) {
  //       this.resetFormProducto()
  //       //Cargar Opciones actualizadas
  //       await this.cargarProductos();// llama, volver cargar los datos, *ACTUALIZADOS*.
  //       await appService.refreshCache();
  //     }
  //
  //   } catch (error) { // Registro de Excepciones:  Errores!  Avisar:
  //     console.error("Error :", error); // Programador
  //     alert("Revise consola") // Feedback al Usuario
  //   }
  // } //CIERRA METODO  guardarProducto()
  // Enviar Formulario Producto:  CREATE y UPDATE:
// En AdminController.js

//   async guardarProducto(e) {
//     e.preventDefault();
//     const productoId = this.productoIdInput.value;
//     const nombre = this.productoNombreInput.value;
//     const precio = this.productoPrecioInput.value;
//     const categoriaId = this.productoCategoriaSelect.value;
//     const marcaId = this.productoMarcaSelect.value;
//     const proveedorId = this.productoProveedorSelect.value;
//     const stock = this.productoStockInput.value;
//     const pvp = this.productoPVPInput.value;
//     const descripcion = this.productoDescripcionInput.value;
//     const imagen = this.productoImagenInput.value;
//
//
//     //1.  Validaciones *previas* a la conversión:
//     if (!nombre || !precio || !categoriaId || !marcaId || !proveedorId || !stock || !pvp) {
//       alert("Todos los campos marcados con (*) son obligatorios");
//       return;  // Salida temprana si faltan campos
//     }
//
//     // 2. Conversión de datos *antes* de crear la instancia:
//     const precioNumerico = parseFloat(precio);
//     const pvpNumerico = parseFloat(pvp);
//     const stockNumerico = parseInt(stock, 10);
//     const categoriaIdNumerico = parseInt(categoriaId, 10);
//     const marcaIdNumerico = parseInt(marcaId, 10);
//     const proveedorIdNumerico = parseInt(proveedorId, 10);
//
//     // Comprobaciones *adicionales* (que deberían estar en las validaciones, idealmente):
//     if (isNaN(precioNumerico) || isNaN(pvpNumerico) || isNaN(stockNumerico) ||
//         isNaN(categoriaIdNumerico) || isNaN(marcaIdNumerico) || isNaN(proveedorIdNumerico)) {
//       alert("Error:  Valores numéricos inválidos.");
//       return; // Salida temprana
//     }
//     if(precioNumerico < 0 || pvpNumerico < 0 || stockNumerico < 0){
//       alert('No se permiten números negativos')
//       return
//     }
//
//     let resultado; // Declaración de resultado
//     try {
//
//         // 3.  Lógica para crear/actualizar:
//         if (productoId) {
//             // ACTUALIZAR
//             const productoExistente = await this.productoService.obtenerProductoPorId(parseInt(productoId));
//             if (!productoExistente) {
//                 alert("Error: Producto no encontrado."); // Mejor mensaje
//                 return;
//             }
//
//              // *No* modificamos productoExistente directamente todavía.
//              const categoria = await this.categoriaService.obtenerCategoriaPorId(categoriaIdNumerico);
//              const marca = await this.marcaService.obtenerMarcaPorId(marcaIdNumerico);
//              const proveedor = await this.proveedorService.obtenerProveedorPorId(proveedorIdNumerico);
//
//             //  *Aquí*, crea un *nuevo* objeto con los datos actualizados
//             const productoActualizado = {
//               ...productoExistente,  // Copia todas las propiedades existentes
//               nombre: nombre,          // Valores actualizados/convertidos:
//               precio: precioNumerico,
//               categoriaId: categoriaIdNumerico,
//               categoriaNombre: categoria.nombre,  // <- Usar los datos de las búsquedas.
//               marcaId: marcaIdNumerico,
//               marcaNombre: marca.nombre,          // <- Usar los datos de las búsquedas.
//               proveedorId: proveedorIdNumerico,
//               proveedorNombre: proveedor.nombre, // <- Usar los datos de las búsquedas
//               stock: stockNumerico,
//               pvp: pvpNumerico,
//               descripcion: descripcion,
//               imagen: imagen,
//               id: parseInt(productoId),     //  MUY IMPORTANTE, para el update
//
//           };
//
//             resultado = await this.productoService.actualizarProducto(parseInt(productoId), productoActualizado);
//             if (resultado !== null) {
//                 alert("Producto ACTUALIZADO");
//              }
//
//         } else {
//             // CREAR
//
//              //  *Aquí* se crea el *nuevo* producto *antes* de llamar al servicio.
//             const nuevoProducto = new Producto(
//                 nombre,
//                 categoriaIdNumerico, // Usar ya los valores *numéricos*.
//                 '', //  temporal
//                 marcaIdNumerico,
//                 '',
//                 proveedorIdNumerico,
//                 '',
//                 precioNumerico,
//                 pvpNumerico,
//                 stockNumerico,
//                 descripcion,
//                 imagen
//             );
//              // Ya no necesitas idGenerator
//             resultado = await this.productoService.agregarProducto(nuevoProducto);
//             if (resultado) {
//               alert(`EXITO Agregando Producto, ID ${resultado} `); //Muestra id creado.
//             }
//         } //  else/crear
//
//
//         // 4.  *Después* de agregar/actualizar, y *si* fue exitoso:
//
//         if (resultado !== null && resultado !== undefined) {
//             this.resetFormProducto();
//             await this.cargarProductos();
//             await this.cargarOpcionesProductoForm(); // <-  Para actualizar los selects!
//             await appService.refreshCache(); // <- ¡Importante!
//         }
//         else{ // Si resultado es null
//           throw new Error('Errores en Datos o Validacion.');
//         }
//
//     } catch (error) {
//         console.error("Error :", error);
//         alert("Revise consola");  // Mejor feedback
//     }
// }
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


    //1.  Validaciones *previas* a la conversión:
    if (!nombre || !precio || !categoriaId || !marcaId || !proveedorId || !stock || !pvp) {
      alert("Todos los campos marcados con (*) son obligatorios");
      return;  // Salida temprana si faltan campos
    }

    // 2. Conversión de datos *antes* de crear la instancia:
    const precioNumerico = parseFloat(precio);
    const pvpNumerico = parseFloat(pvp);
    const stockNumerico = parseInt(stock, 10);
    const categoriaIdNumerico = parseInt(categoriaId, 10);
    const marcaIdNumerico = parseInt(marcaId, 10);
    const proveedorIdNumerico = parseInt(proveedorId, 10);

    // Comprobaciones *adicionales* (que deberían estar en las validaciones, idealmente):
    if (isNaN(precioNumerico) || isNaN(pvpNumerico) || isNaN(stockNumerico) ||
      isNaN(categoriaIdNumerico) || isNaN(marcaIdNumerico) || isNaN(proveedorIdNumerico)) {
      alert("Error:  Valores numéricos inválidos.");
      return; // Salida temprana
    }
    if (precioNumerico < 0 || pvpNumerico < 0 || stockNumerico < 0) {
      alert('No se permiten números negativos')
      return
    }

    let resultado; // Declaración de resultado
    try {

      // 3.  Lógica para crear/actualizar:
      if (productoId) {
        // ACTUALIZAR
        const productoExistente = await this.productoService.obtenerProductoPorId(parseInt(productoId));
        if (!productoExistente) {
          alert("Error: Producto no encontrado."); // Mejor mensaje
          return;
        }

        // *No* modificamos productoExistente directamente todavía.
        const categoria = await this.categoriaService.obtenerCategoriaPorId(categoriaIdNumerico)
        const marca = await this.marcaService.obtenerMarcaPorId(marcaIdNumerico);
        const proveedor = await this.proveedorService.obtenerProveedorPorId(proveedorIdNumerico);

        //  *Aquí*, crea un *nuevo* objeto con los datos actualizados
        const productoActualizado = {
          ...productoExistente,  // Copia todas las propiedades existentes
          nombre: nombre,          // Valores actualizados/convertidos:
          precio: precioNumerico,
          categoriaId: categoriaIdNumerico,
          categoriaNombre: categoria.nombre,  // <- Usar los datos de las búsquedas.
          marcaId: marcaIdNumerico,
          marcaNombre: marca.nombre,          // <- Usar los datos de las búsquedas.
          proveedorId: proveedorIdNumerico,
          proveedorNombre: proveedor.nombre, // <- Usar los datos de las búsquedas
          stock: stockNumerico,
          pvp: pvpNumerico,
          descripcion: descripcion,
          imagen: imagen,
          id: parseInt(productoId),     //  MUY IMPORTANTE, para el update

        };

        resultado = await this.productoService.actualizarProducto(parseInt(productoId), productoActualizado);
        if (resultado !== null) {
          alert("Producto ACTUALIZADO");
        }

      } else {
        // CREAR

        //  *Aquí* se crea el *nuevo* producto *antes* de llamar al servicio.
        const nuevoProducto = new Producto(
          nombre,
          categoriaIdNumerico, // Usar ya los valores *numéricos*.
          '', //  temporal
          marcaIdNumerico,
          '',
          proveedorIdNumerico,
          '',
          precioNumerico,
          pvpNumerico,
          stockNumerico,
          descripcion,
          imagen
        );
        // Ya no necesitas idGenerator
        resultado = await this.productoService.agregarProducto(nuevoProducto);
        if (resultado) {
          alert(`EXITO Agregando Producto, ID ${resultado} `); //Muestra id creado.
        }
      } //  else/crear


      // 4.  *Después* de agregar/actualizar, y *si* fue exitoso:

      if (resultado !== null && resultado !== undefined) {
        this.resetFormProducto();
        await this.cargarProductos();
        await this.cargarOpcionesProductoForm(); // <-  Para actualizar los selects!
        await appService.refreshCache(); // <- ¡Importante!
      } else { // Si resultado es null
        throw new Error('Errores en Datos o Validacion.');
      }

    } catch (error) {
      console.error("Error :", error);
      alert("Revise consola");  // Mejor feedback
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
  // async cargarVentas() {
  //   try {
  //     const ventas = await this.facturaService.obtenerFacturas(); //  await (indexedDB)
  //     this.tablaVentas.innerHTML = ''; // limpiar antes
  //
  //     if (!Array.isArray(ventas)) {  // <--- AÑADE ESTA COMPROBACIÓN
  //       console.error("Error: ventas no es un array.");
  //       return; // Salir si no es un array
  //     }
  //
  //     for (const venta of ventas) {      //  venta singular!!       NO "ventas", sino "venta"
  //       // Obtener ,  nombre de Cliente
  //       //const clienteNombre = await this.facturaService.obtenerNombreCliente(venta.cliente); //
  //       const cliente = await this.clienteService.obtenerClientePorId(venta.cliente);
  //       const clienteNombre = cliente ? cliente.nombre : 'Cliente Desconocido'; // Si no existe, pone
  //       // Convertir a un  formato
  //       const fecha = new Date(venta.fecha).toLocaleDateString();  //Formato legible
  //       // Crea elemento HTML <tr> fila!
  //       const tr = document.createElement('tr');     // Row
  //
  //       // Añadir a esta fila, columnas!
  //       tr.innerHTML = `
  //                  <td>${venta.id}</td>
  //                <td>${fecha}</td>
  //                   <td>${clienteNombre}</td>
  //                <td>$${venta.total.toFixed(2)}</td>
  //                 <td class="action-buttons">
  //                    <button class="action-button edit-button view-venta" data-id="${venta.id}">Ver Detalle</button>
  //                </td>
  //           `;  // Texto!, datos, botones
  //       this.tablaVentas.appendChild(tr); // Añadir al tbody
  //
  //     } //cierra loop "for"
  //     this.setupVentasListeners(); //METODO, Inicializa o Refresca Listeners
  //   } catch (error) {  // Error!
  //     console.error("Hubo Error obtener ventas, o no existen:", error);
  //     alert("Revise si existem Facturas.");//Mensaje
  //   }
  // }
  async cargarVentas() {
    try {
      const ventas = await this.facturaService.obtenerFacturas(); //  await (indexedDB)
      this.tablaVentas.innerHTML = ''; // limpiar antes

      if (!Array.isArray(ventas)) {  // <--- AÑADE ESTA COMPROBACIÓN
        console.error("Error: ventas no es un array.");
        return; // Salir si no es un array
      }

      for (const venta of ventas) {      //  venta singular!!       NO "ventas", sino "venta"
        // Obtener ,  nombre de Cliente
        //const clienteNombre = await this.facturaService.obtenerNombreCliente(venta.cliente); //
        const cliente = await this.clienteService.obtenerClientePorId(venta.cliente);
        const clienteNombre = cliente ? cliente.nombre : 'Cliente Desconocido'; // Si no existe, pone
        // Convertir a un  formato
        const fecha = new Date(venta.fecha).toLocaleDateString();  //Formato legible
        // Crea elemento HTML <tr> fila!
        const tr = document.createElement('tr');     // Row

        // Añadir a esta fila, columnas!
        tr.innerHTML = `
                   <td>${venta.id}</td>
                 <td>${fecha}</td>
                    <td>${clienteNombre}</td>
                 <td>$${venta.total.toFixed(2)}</td>
                  <td class="action-buttons">
                     <button class="action-button edit-button view-venta" data-id="${venta.id}">Ver Detalle</button>
                 </td>
            `;  // Texto!, datos, botones
        this.tablaVentas.appendChild(tr); // Añadir al tbody

      } //cierra loop "for"
      this.setupVentasListeners(); //METODO, Inicializa o Refresca Listeners
    } catch (error) {  // Error!
      console.error("Hubo Error obtener ventas, o no existen:", error);
      alert("Revise si existem Facturas.");//Mensaje
    }
  }

  // Metodo Setup para eventos dentro de la Tabla, para: Boton!
  // setupVentasListeners()
  // setupVentasListeners() {
  //   // Dentro de este <tbody>:  usar querySelectorAll Para *todos* botones
  //   this.tablaVentas.querySelectorAll('.view-venta').forEach(button => { // querySelectorAll(... foreach ...
  //     button.addEventListener('click', async (e) => { //   Listener al click, en: ( e )
  //
  //       const ventaId = parseInt(e.target.dataset.id);          // sacar id
  //       const venta = await this.facturaService.obtenerFacturaPorId(ventaId);  // Metodo! de Service de facturacion, obtiene: venta por id
  //
  //       // invocar , Vista detallada, la funcion:
  //       await CheckoutController.mostrarFactura(venta);
  //       document.getElementById('tienda').classList.add('hidden')
  //       document.getElementById('admin').classList.add('hidden'); //  panel de ADMIN oculto:
  //       //Ocultar ventana actual!
  //       document.getElementById('invoiceSection').classList.remove('hidden'); // Muestra vista
  //
  //     }); // Listener, cada boton:
  //   });  // foreach loop
  //
  // }  //Metodo.
  async mostrarFactura(factura) { //METODO, para mostrar el detalle de la factura
    if (!factura) return;

    const fecha = new Date(factura.fecha).toLocaleDateString();

    let detallesHTML = '';

    //Aqui busca mediante el id, el producto
    for (const detalle of factura.detalles) {

      const producto = await this.productoService.obtenerProductoPorId(detalle.productoId)

      detallesHTML += `
                <tr>
                  <td>${producto.nombre}</td>
                <td>${detalle.cantidad}</td>
                  <td>$${detalle.precio.toFixed(2)}</td>
                 <td>$${detalle.subtotal.toFixed(2)}</td>
              </tr>
            `;
    }

    const cliente = await this.clienteService.obtenerClientePorId(factura.cliente);
    if (!cliente) {
      console.error("No se pudo encontrar el cliente para la factura ID:", factura.cliente);
      this.invoiceDetails.innerHTML = "<p>Cliente no encontrado.</p>"; // Mejor mensaje.
      document.getElementById('invoiceSection').classList.remove('hidden');
      return;
    }

    this.invoiceDetails.innerHTML = `
        <div class="invoice-header">
               <div>
                 <div class="invoice-id">Factura #${factura.id}</div>
               <div class="invoice-date">Fecha: ${fecha}</div>
              </div>
          </div>
            <div class="invoice-client">
                <h3>Cliente</h3>
               <p><strong>Nombre:</strong> ${cliente.nombre}</p>
              <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
               <p><strong>Dirección:</strong> ${cliente.direccion}</p>
            </div>
         <h3>Detalle de Compra</h3>
            <table>
            <thead>
                 <tr>
                  <th>Producto</th>
                    <th>Cantidad</th>
                   <th>Precio Unitario</th>
                    <th>Subtotal</th>
                </tr>
             </thead>
             <tbody>
                 ${detallesHTML}  <!-- Aquí se insertan las filas -->
             </tbody>
         </table>
         <div class="invoice-total">Total: $${factura.total.toFixed(2)}</div>
      `;

    this.invoiceSection.classList.remove('hidden');
  }

  setupVentasListeners() {
    // Dentro de este <tbody>:  usar querySelectorAll Para *todos* botones
    this.tablaVentas.querySelectorAll('.view-venta').forEach(button => { // querySelectorAll(... foreach ...
      button.addEventListener('click', async (e) => { //   Listener al click, en: ( e )

        const ventaId = parseInt(e.target.dataset.id);          // sacar id
        const venta = await this.facturaService.obtenerFacturaPorId(ventaId);  // Metodo! de Service de facturacion, obtiene: venta por id

        // invocar , Vista detallada, la funcion:
        if (venta) {
          await this.mostrarFactura(venta);

        }

        document.getElementById('tienda').classList.add('hidden')
        document.getElementById('admin').classList.add('hidden'); //  panel de ADMIN oculto:
        //Ocultar ventana actual!
        document.getElementById('invoiceSection').classList.remove('hidden'); // Muestra vista

      }); // Listener, cada boton:
    });  // foreach loop

  }  //Metodo.
} //CIERRA CLASE AdminController

// Instancia única para toda la aplicación.
const adminController = new AdminController(
  app.categoriaService,
  app.marcaService,
  app.proveedorService,
  app.clienteService,
  app.productoService,
  app.facturaService
);

export {adminController};