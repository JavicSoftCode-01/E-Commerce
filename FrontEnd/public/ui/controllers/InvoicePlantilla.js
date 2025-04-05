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
    const fecha = new Date(factura.fecha || new Date());
    const numeroFactura = factura.numeroFactura || 'PREVIEW';
    const horaFormateada = this.formatearHora(fecha);
    document.getElementById('WST').innerHTML = ` <a type="button" title="Chatear por WhatsApp" class="btn btn-primary no-print"
    href="whatsapp://send?phone=593987848620&text=Buenos%20d%C3%ADas,%20Lunaire.%20Le%20informo%20que%20ya%20he%20realizado%20mi%20pedido%20del%20producto.%20Mi%20n%C3%BAmero%20de%20factura%20es%20${factura.numeroFactura}.%20Muchas%20gracias! 🛍️"
    target="_blank">
    Notificar Compra <i class="fa-brands fa-whatsapp fa-lg" style="font-size:2rem; color:white"></i>
  </a> `;

    // Generar los detalles de la factura
    const detallesHTML = factura.detalles?.map(item => `
            <tr>
              <td class="text-center"><img src="${item.imagen}" alt="${item.nombre}" style="width:60px; height:70px; border-radius:2px"></td>
              <td class="text-center">${item.nombre}</td>              
              <td class="text-center">${item.cantidad}</td>
              <td class="text-center">$${item.precio.toFixed(2)}</td>
              <td class="text-center">$${item.calcularSubtotal().toFixed(2)}</td>
            </tr>
        `).join('') || '<tr><td colspan="5" class="text-center">No hay detalles disponibles</td></tr>';

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
                  <p class="hidden">Fecha: <span id="currentDate">${fecha.toLocaleDateString()}</span></p>
                  <p><strong>Hora:</strong> <span id="currentTime">${horaFormateada}</span></p>
                </div>
              </div>
            </div>
            <div class="client-info" style="margin-top: -20px;">
              ${esPreview ? `
                <div class="info-group"><label>Cliente:</label><input class="inputFac" type="text" id="checkoutNombre" required></div>
                <div class="info-group"><label>Teléfono:</label><input class="inputFac" type="tel" id="checkoutTelefono" maxlength="10" required></div>
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
              <div class="summary-item"><span class="subtotal">Subtotal:</span><span>$${factura.subtotal.toFixed(2)}</span></div>
              <div class="summary-item"><span class="envio">Envío:</span><span>$${factura.envio.toFixed(2)}</span></div>
              <hr class="summary-divider">
              <div class="summary-item total-item"><span>Total:</span><span class="checkoutTotal">$${factura.total.toFixed(2)}</span></div>
            </div>
          </div>
       
        </div>`;
  }
}