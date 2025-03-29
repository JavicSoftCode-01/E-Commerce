export class InvoiceTemplate {
    static #ultimoNumeroFactura = parseInt(localStorage.getItem('ultimoNumeroFactura') || '0');

    static async generarNumeroFactura() {
        const fecha = new Date();
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        
        // Incrementar el número secuencial
        this.#ultimoNumeroFactura++;
        const secuencial = String(this.#ultimoNumeroFactura).padStart(4, '0');
        
        // Guardar inmediatamente el nuevo número
        localStorage.setItem('ultimoNumeroFactura', this.#ultimoNumeroFactura.toString());
        
        return {
            numero: `FAC-${año}-${mes}-${dia}-${secuencial}`,
            fecha: fecha,
            hora: this.formatearHora(fecha)
        };
    }

    // Añadir método para confirmar el uso del número
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

        const detallesHTML = factura.detalles?.map(item => `
            <tr>
                <td class="text-center">
                    ${item.imagen ? `<img src="${item.imagen}" alt="${item.nombre}" style="width:60px; height:70px; object-fit:cover; border-radius:50%">` : 'N/A'}
                </td>
                <td class="text-center">${item.nombre}</td>
                <td class="text-center">${item.cantidad}</td>
                <td class="text-right">$${item.precio.toFixed(2)}</td>
                <td class="text-right">$${(item.precio * item.cantidad).toFixed(2)}</td>
            </tr>
        `).join('') || '';

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
                            <p>No. Factura: <span id="invoiceNumber">${numeroFactura}</span></p>
                            <p>Fecha: <span id="currentDate">${fecha.toLocaleDateString()}</span></p>
                            <p>Hora: <span id="currentTime">${horaFormateada}</span></p>
                        </div>
                    </div>
                </div>
                <div class="client-info">
                    ${esPreview ? `
                        <div class="info-group">
                            <label>Cliente:</label>
                            <input class="inputFac" type="text" id="checkoutNombre" required>
                        </div>
                        <div class="info-group">
                            <label>Teléfono:</label>
                            <input class="inputFac" type="tel" id="checkoutTelefono" maxlength="10" required>
                        </div>
                        <div class="info-group">
                            <label>Dirección:</label>
                            <input class="inputFac" type="text" id="checkoutDireccion" required>
                        </div>
                    ` : `
                        <h3>Cliente</h3>
                        <p>Nombre: ${factura.clienteNombre || 'N/A'}</p>
                        <p>Teléfono: ${factura.clienteTelefono || 'N/A'}</p>
                        <p>Dirección: ${factura.clienteDireccion || 'N/A'}</p>
                    `}
                </div>
            </div>

            <div class="invoice-details">
                <h3 class="modal-title">Detalle factura</h3>
                <div class="table-responsive-container">
                    <table class="checkout-table">
                        <thead>
                            <tr>
                                <th class="text-center">IMG</th>
                                <th class="text-center">Producto</th>
                                <th class="text-center">Cant.</th>
                                <th class="text-center">Valor</th>
                                <th class="text-center">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${detallesHTML}
                        </tbody>
                    </table>
                </div>

                <div class="checkout-summary">
                    <div class="summary-item">
                        <span class="subtotal">Subtotal:</span>
                        <span>${factura.subtotal ? `$${factura.subtotal.toFixed(2)}` : '$0.00'}</span>
                    </div>
                    <div class="summary-item">
                        <span class="envio">Envío:</span>
                        <span>${factura.envio ? `$${factura.envio.toFixed(2)}` : '$0.00'}</span>
                    </div>
                    <hr class="summary-divider">
                    <div class="summary-item total-item">
                        <span>Total:</span>
                        <span class="checkoutTotal">$${(factura.total || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>`;
    }
}