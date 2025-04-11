//FrontEnd/public/ui/controllers/InvoicePlantilla.js
export class InvoiceTemplate {
  static #ultimoNumeroFactura = parseInt(localStorage.getItem('ultimoNumeroFactura') || '0');

  static async generarNumeroFactura() {
    const fecha = new Date();
    const annio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const secuencial = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return {
      numero: `FAC-${annio}-${mes}-${dia}-${secuencial}`,
      fecha: fecha,
      hora: this.formatearHora(fecha)
    };
  }

  static confirmarNumeroFactura() {
    localStorage.setItem('ultimoNumeroFactura', this.#ultimoNumeroFactura.toString());
  }

  static formatearHora(fecha) {
    const hours = fecha.getHours();
    const minutes = fecha.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  }

  static generarHTML(factura, esPreview = false) {
    // Verificación inicial y logs
    console.log('[InvoiceTemplate] Iniciando generarHTML. Factura recibida:', factura);
    if (!factura || typeof factura !== 'object') {
        console.error('[InvoiceTemplate] ERROR: La factura recibida no es un objeto válido.', factura);
        return '<p style="color: red;">Error: Datos de factura inválidos.</p>'; // Devolver mensaje de error
    }

    const fecha = new Date(factura.fecha || new Date());
    const numeroFactura = factura.numeroFactura || (esPreview ? 'PREVIEW' : 'N/A'); // Asegurar N/A si no es preview y falta número
    const horaFormateada = this.formatearHora(fecha);

    // Actualizar botón WhatsApp (asegúrate que el elemento con ID 'WST' existe donde se llama esta función)
    try {
        const wstElement = document.getElementById('WST');
        if (wstElement) {
           wstElement.innerHTML = ` <a type="button" title="Chatear por WhatsApp" class="btn btn-primary no-print"
            href="whatsapp://send?phone=593987848620&text=Buenos%20d%C3%ADas,%20Lunaire.%20Le%20informo%20que%20ya%20he%20realizado%20mi%20pedido.%20Mi%20n%C3%BAmero%20de%20factura%20es%20${factura.numeroFactura || 'PENDIENTE'}.%20Muchas%20gracias! 🛍️"
            target="_blank">
            Notificar Compra <i class="fa-brands fa-whatsapp fa-lg" style="font-size:2rem; color:white"></i>
            </a> `;
        } else {
           console.warn("[InvoiceTemplate] Elemento con ID 'WST' no encontrado para actualizar botón WhatsApp.");
        }
    } catch (e) {
       console.error("[InvoiceTemplate] Error al intentar actualizar el botón de WhatsApp:", e);
    }


    // Generar los detalles de la factura con verificación robusta
    const detallesHTML = factura.detalles?.map((item, index) => {
        // Verificación DENTRO del .map para cada item
        console.log(`[InvoiceTemplate] Procesando item de detalle [${index}]:`, item);
        let tipoItem = 'desconocido';
        let metodoExiste = false;
        if (item && typeof item === 'object') {
            tipoItem = item.constructor?.name || 'Object (sin nombre constructor)';
            metodoExiste = typeof item.calcularSubtotal === 'function';
        }
        console.log(`[InvoiceTemplate] -> Tipo de item[${index}]: ${tipoItem}`);
        console.log(`[InvoiceTemplate] -> Método calcularSubtotal existe y es función?[${index}]: ${metodoExiste}`);
        // ----- Fin Verificación -----

        let subtotalCalculadoStr = '<span style="color:red;">Error</span>'; // Valor por defecto si todo falla

        if (metodoExiste) {
            // El método existe, intentamos llamarlo
            try {
                const subtotalNum = item.calcularSubtotal();
                // Verificar si el resultado es un número antes de formatear
                if (typeof subtotalNum === 'number' && !isNaN(subtotalNum)) {
                  subtotalCalculadoStr = subtotalNum.toFixed(2);
                } else {
                   console.error(`[InvoiceTemplate] item[${index}].calcularSubtotal() no devolvió un número válido:`, subtotalNum);
                   // Como fallback, intenta usar la propiedad almacenada si existe
                   if (item.hasOwnProperty('subtotal') && typeof item.subtotal === 'number') {
                       subtotalCalculadoStr = item.subtotal.toFixed(2);
                       console.warn(`[InvoiceTemplate] Usando propiedad 'subtotal' (${subtotalCalculadoStr}) como fallback para item[${index}].`);
                   }
                }
            } catch (e) {
                console.error(`[InvoiceTemplate] Error al llamar a item[${index}].calcularSubtotal() o toFixed():`, e, "Item:", item);
                 // Intenta usar la propiedad almacenada como fallback en caso de error
                 if (item.hasOwnProperty('subtotal') && typeof item.subtotal === 'number') {
                       subtotalCalculadoStr = item.subtotal.toFixed(2);
                       console.warn(`[InvoiceTemplate] Usando propiedad 'subtotal' (${subtotalCalculadoStr}) como fallback tras error para item[${index}].`);
                 }
            }
        } else {
             // El método NO existe, intentar usar la propiedad almacenada directamente
            console.warn(`[InvoiceTemplate] item[${index}] NO tiene el método calcularSubtotal.`);
            if (item && item.hasOwnProperty('subtotal')) {
                const subProp = item.subtotal;
                 if (typeof subProp === 'number' && !isNaN(subProp)){
                   subtotalCalculadoStr = subProp.toFixed(2);
                   console.warn(`[InvoiceTemplate] Usando propiedad 'subtotal' (${subtotalCalculadoStr}) para item[${index}].`);
                 } else {
                     console.error(`[InvoiceTemplate] La propiedad 'subtotal' en item[${index}] no es un número válido:`, subProp);
                 }
            } else {
                 console.error(`[InvoiceTemplate] item[${index}] tampoco tiene una propiedad 'subtotal' válida.`);
            }
        }

        // Asegurar que valores numéricos básicos sean válidos o tengan un fallback
        const nombreSeguro = item?.nombre || 'Producto Desconocido';
        const cantidadSegura = (typeof item?.cantidad === 'number' && !isNaN(item.cantidad)) ? item.cantidad : 0;
        const precioSeguro = (typeof item?.precio === 'number' && !isNaN(item.precio)) ? item.precio.toFixed(2) : '0.00';
        const imagenSegura = item?.imagen || 'path/to/default/image.png'; // Considera una imagen por defecto

        // Devolver el HTML de la fila
        return `
            <tr>
              <td class="text-center"><img src="${imagenSegura}" alt="${nombreSeguro}" style="width:60px; height:70px; border-radius:2px; object-fit: cover;"></td> 
              <td class="text-center">${nombreSeguro}</td>
              <td class="text-center">${cantidadSegura}</td>
              <td class="text-center">$${precioSeguro}</td>
              <td class="text-center">$${subtotalCalculadoStr}</td> 
            </tr>
        `;
    }).join('') || '<tr><td colspan="5" class="text-center" style="padding: 20px;">Esta factura no tiene productos asociados.</td></tr>'; // Mensaje más informativo si no hay detalles

    // Asegurar que los totales de la factura sean números o 0
    const subtotalFactura = (typeof factura.subtotal === 'number' && !isNaN(factura.subtotal)) ? factura.subtotal.toFixed(2) : '0.00';
    const envioFactura = (typeof factura.envio === 'number' && !isNaN(factura.envio)) ? factura.envio.toFixed(2) : '0.00';
    const totalFactura = (typeof factura.total === 'number' && !isNaN(factura.total)) ? factura.total.toFixed(2) : '0.00';

    // Construir y devolver el HTML completo de la factura
    return `
        <div class="invoice-content">
          <div class="invoice-header">
            <div class="invoice-header-content">
              <div class="company-logo">
                <h1 class="logo-text">LUNAIRE</h1>
                <p class="logo-tagline">Luxury Cosmetics & Accessories</p>
              </div>
              <div class="invoice-info">
                <div class="invoice-details">
                  <p><span id="invoiceNumber">${numeroFactura}</span></p>
                  <p class="hidden">Fecha: <span id="currentDate">${fecha.toLocaleDateString('es-EC')}</span></p>
                  <p><strong>Hora:</strong> <span id="currentTime">${horaFormateada}</span></p>
                </div>
              </div>
            </div>
            <div class="client-info" style="margin-top: -20px;">
              ${esPreview ? `
                <div class="info-group"><label>Cliente:</label><input class="inputFac" type="text" id="checkoutNombre" required></div>
                <div class="info-group"><label>Teléfono:</label><input class="inputFac" type="tel" id="checkoutTelefono" maxlength="10" pattern="[0-9]*" inputmode="numeric" required></div> {/* Añadir validación simple */}
                <div class="info-group"><label>Dirección:</label><input class="inputFac" type="text" id="checkoutDireccion" required></div>
              ` : `
                <h3>Cliente</h3>
                <p>Nombre: ${factura.clienteNombre || 'N/A'}</p>
                <p>Teléfono: ${factura.clienteTelefono || 'N/A'}</p>
                <p>Dirección: ${factura.clienteDireccion || 'N/A'}</p>
              `}
            </div>
          </div>
          <div class="invoice-details" style="margin-top: -5px;">
            <h3 class="modal-title">Detalle factura</h3>
            <div class="table-responsive-container">
              <table class="checkout-table">
                <thead>
                  <tr>
                    <th class="text-center" style="font-size: 18px;">IMG</th>
                    <th class="text-center" style="font-size: 18px;">Producto</th>
                    <th class="text-center" style="font-size: 18px;">Cant.</th>
                    <th class="text-center" style="font-size: 18px;">Valor</th>
                    <th class="text-center" style="font-size: 18px;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>${detallesHTML}</tbody> 
              </table>
            </div>
            <div class="checkout-summary">
              <div class="summary-item"><span class="subtotal">Subtotal:</span><span>$${subtotalFactura}</span></div>
              <div class="summary-item"><span class="envio">Envío:</span><span>$${envioFactura}</span></div>
              <hr class="summary-divider">
              <div class="summary-item total-item"><span>Total:</span><span class="checkoutTotal">$${totalFactura}</span></div>
            </div>
          </div>

        </div>`;
  }
}