// FrontEnd/ui/controllers/CheckoutController.js
import { TiendaController } from './TiendaController.js'; // Importa para el carrito y actualizar contador
import { Cliente } from '../../../../BackEnd/src/models/Cliente.js';
import { appService } from '../services/UшымтаService.js';


class CheckoutController {
    constructor(facturaService, clienteService) {
        this.facturaService = facturaService;
        this.clienteService = clienteService;

        // Elementos del DOM (¡Buena práctica!)
        this.checkoutSection = document.getElementById('checkoutSection');
        this.clientSelect = document.getElementById('clientSelect');
        this.btnNewClient = document.getElementById('btnNewClient');
        this.newClientForm = document.getElementById('newClientForm');
        this.btnConfirmClientData = document.getElementById('btnConfirmClientData');
        this.checkoutCartTable = document.getElementById('checkoutCartTable');
        this.checkoutTotal = document.getElementById('checkoutTotal');
        this.btnCancelCheckout = document.getElementById('btnCancelCheckout');
        this.btnConfirmCheckout = document.getElementById('btnConfirmCheckout');
        this.invoiceSection = document.getElementById('invoiceSection');
        this.invoiceDetails = document.getElementById('invoiceDetails');
        this.btnCloseInvoice = document.getElementById('btnCloseInvoice');

        // Estado
        this.esNuevoCliente = false;

        // Configurar listeners (¡Buena práctica!)
        this.setupEventListeners();
    }

    setupEventListeners() {
      this.btnNewClient.addEventListener('click', () => this.crearNuevoCliente());
      this.btnConfirmClientData.addEventListener('click', (e) => this.confirmarDatosCliente(e)); // Pasas el evento (e)
      this.clientSelect.addEventListener('change', () => this.seleccionarClienteExistente());
      this.btnCancelCheckout.addEventListener('click', () => this.cancelarCheckout());
      this.btnConfirmCheckout.addEventListener('click', () => this.confirmarCompra());
      this.btnCloseInvoice.addEventListener('click', () => this.cerrarFactura());
    }

   async mostrarSeccionCheckout() {
     // Ocultar secciones, y mostrar la de compra
        document.getElementById('cartSection').classList.add('hidden');
        this.checkoutSection.classList.remove('hidden');
     //Ya no realiza la consulta, usa los datos en caché
        this.clientSelect.innerHTML = '<option value="">Seleccione un cliente</option>';
    // Obtener la lista de clientes desde el *CACHÉ* (¡MUCHO MEJOR!)
     const clientes = appService.getClientes();

     if (clientes && Array.isArray(clientes)) {
       clientes.forEach(cliente => {
                this.clientSelect.innerHTML += `<option value="${cliente.id}">${cliente.nombre}</option>`;
       });
     }

      // tbody del carrito en checkout
      const tbody = this.checkoutCartTable.querySelector('tbody');
       tbody.innerHTML = '';
    TiendaController.carrito.items.forEach(item => {  // Usa el carrito desde tiendaController
      const tr = document.createElement('tr');
            tr.innerHTML = `
             <td>${item.producto.nombre}</td>
                <td>${item.cantidad}</td>
                <td>$${item.precio.toFixed(2)}</td>
                <td>$${item.subtotal.toFixed(2)}</td>
              `;
            tbody.appendChild(tr);
     });
    this.checkoutTotal.textContent = `Total: $${tiendaController.carrito.total.toFixed(2)}`;// Se actualiza total
}

    crearNuevoCliente() {
     this.newClientForm.classList.remove('hidden');
      this.clientSelect.value = ''; // Limpiar, o Reset.
     this.esNuevoCliente = true;     //  bandera logica
    }

   async confirmarDatosCliente(e) {
      e.preventDefault();  // Importante para evitar que el formulario se envíe de forma tradicional.

      const nombre = document.getElementById('checkoutNombre').value;
        const telefono = document.getElementById('checkoutTelefono').value;
      const direccion = document.getElementById('checkoutDireccion').value;
     if (!nombre || !telefono || !direccion) {
        alert('Por favor, complete todos los campos del cliente.');
        return;
       }

        try {
            const cliente = new Cliente(nombre, telefono, direccion);
          //  cliente.id = await Model.generateId('Cliente', app.idGeneratorService); //  <- YA NO
           const nuevoCliente = await this.clienteService.agregarCliente(cliente);

            if (nuevoCliente) {
              // Actualizar la lista desplegable de clientes
                const option = document.createElement('option');
             option.value = nuevoCliente; // Usar el *ID* como valor.  Ya no es .id
                option.textContent = cliente.nombre; // Usar el *nombre* como texto visible.
               this.clientSelect.appendChild(option);
             this.clientSelect.value = nuevoCliente; // Seleccionar el nuevo cliente.  Ya no es .id

                alert('Cliente registrado con éxito. Ahora puedes confirmar la compra.');
          }

       } catch (error) {
         console.error("Error al registrar el cliente:", error);
            alert("Hubo un error al registrar el cliente.  Revisa la consola."); // Mejor mensaje.
        }
    }

  seleccionarClienteExistente() {
     const clienteId = this.clientSelect.value;
     if (clienteId) {
          this.newClientForm.classList.add('hidden');
        this.esNuevoCliente = false;
      }
   }

    cancelarCheckout() {
     this.checkoutSection.classList.add('hidden');
     document.getElementById('cartSection').classList.remove('hidden');
     this.clientSelect.value = ''; // Reset campo seleccion
       this.newClientForm.classList.add('hidden');           // Limpiar form.
      document.getElementById('checkoutNombre').value = '';   // reset cliente nombre.
       document.getElementById('checkoutTelefono').value = '';
      document.getElementById('checkoutDireccion').value = '';
        this.esNuevoCliente = false;
    }

    async confirmarCompra() {
     let clienteId = this.clientSelect.value;

       if (!clienteId && !this.esNuevoCliente) {
         alert('Por favor, seleccione un cliente existente o registre uno nuevo.');
        return;
      }

     // Si es un nuevo cliente, los datos ya están validados y el cliente ya estaría creado.
      // Si es un cliente existente, el ID ya está en clienteId.

      try {
             const parsedClienteId = parseInt(clienteId); //Convertir
           if (isNaN(parsedClienteId)) {
               alert("Por favor, seleccione o registre un cliente.");
               return;
         }
        const factura = await this.facturaService.generarFactura(parsedClienteId,TiendaController.carrito);

          if (!factura) {
              throw new Error('La factura no pudo ser generada.'); // Mejor mensaje de error.
         }
       // Mostrar Factura
        await this.mostrarFactura(factura);

        // Limpiar Carrito y actualizar
         TiendaController.carrito.vaciarCarrito();
           TiendaController.actualizarContadorCarrito();

        // Ocultar Checkout
        this.checkoutSection.classList.add('hidden');
           this.clientSelect.value = ''; // Limpiar
          this.esNuevoCliente = false;

        // Limpiar el formulario del cliente
        this.newClientForm.classList.add('hidden');
        document.getElementById('checkoutNombre').value = '';
         document.getElementById('checkoutTelefono').value = '';
       document.getElementById('checkoutDireccion').value = '';


       } catch (error) {
            console.error('Error durante el checkout:', error);
          alert(`Error al confirmar la compra: ${error.message}`);
      }
     }

 async mostrarFactura(factura) {
        if (!factura) return;

         const fecha = new Date(factura.fecha).toLocaleDateString();

        let detallesHTML = '';
       for (const detalle of factura.detalles) {
            detallesHTML += `
                <tr>
                  <td>${detalle.producto.nombre}</td>
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
         this.invoiceSection.classList.remove('hidden');
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

   async cerrarFactura() {
        this.invoiceSection.classList.add('hidden');
         await TiendaController.cargarProductos();
    }

}

export { CheckoutController };