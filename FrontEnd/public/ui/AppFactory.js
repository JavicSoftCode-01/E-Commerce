import {CategoriaService} from '../../../BackEnd/src/services/CategoriaService.js';
import {MarcaService} from '../../../BackEnd/src/services/MarcaService.js';
import {ProveedorService} from '../../../BackEnd/src/services/ProveedorService.js';
import {ClienteService} from '../../../BackEnd/src/services/ClienteService.js';
import {ProductoService} from '../../../BackEnd/src/services/ProductoService.js';
import {FacturaService} from '../../../BackEnd/src/services/FacturaService.js';
import {IdGenerator} from '../../../BackEnd/src/database/indexdDB.js';
import {CheckoutController} from './controllers/CheckoutController.js';
import {CarritoController} from './controllers/CarritoController.js';
import {TiendaController} from './controllers/TiendaController.js';

class AppFactory {
  constructor() {
    // Initialize services first
    this.categoriaService = new CategoriaService();
    this.marcaService = new MarcaService();
    this.proveedorService = new ProveedorService();
    this.clienteService = new ClienteService();
    this.idGeneratorService = new IdGenerator();

    // Initialize services with dependencies
    this.productoService = new ProductoService(
      this.categoriaService,
      this.marcaService,
      this.proveedorService
    );
    this.facturaService = new FacturaService(
      this.productoService,
      this.clienteService,
      this.idGeneratorService
    );

    // Initialize controllers
    this.checkoutController = new CheckoutController(
      this.facturaService,
      this.clienteService
    );
    this.carritoController = new CarritoController();

    // Initialize TiendaController AFTER productoService is created
    this.tiendaController = new TiendaController(this.productoService);
  }
}

const app = new AppFactory();
export {app};