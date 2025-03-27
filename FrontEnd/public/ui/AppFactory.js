// FrontEnd/ui/AppFactory.js
import { CarritoController } from "./controllers/CarritoController.js";
import { CheckoutController } from "./controllers/CheckoutController.js";
import { TiendaController } from "./controllers/TiendaController.js";
import { CategoriaService } from "../../../BackEnd/src/services/CategoriaService.js";
import { MarcaService } from "../../../BackEnd/src/services/MarcaService.js";
import { ProveedorService } from "../../../BackEnd/src/services/ProveedorService.js";
import { ClienteService } from "../../../BackEnd/src/services/ClienteService.js";
import { ProductoService } from "../../../BackEnd/src/services/ProductoService.js";
import { FacturaService } from "../../../BackEnd/src/services/FacturaService.js";
import { IdGenerator } from "../../../BackEnd/src/database/indexdDB.js";
import { Carrito } from "../../../BackEnd/src/models/Carrito.js"; // Importa Carrito

class AppFactory {
  constructor() {
    // Instancia IdGenerator  --  ¡ANTES de los servicios!
    this.idGeneratorService = new IdGenerator();

    //  Asegura que los registros existan (de forma asíncrona)
    //this.ensureIdRecordsExist();


    this.categoriaService = new CategoriaService();
    this.marcaService = new MarcaService();
    this.proveedorService = new ProveedorService();
    //  Pasa idGeneratorService a ClienteService
    this.clienteService = new ClienteService(this.idGeneratorService);
    this.productoService = new ProductoService(
      this.categoriaService,
      this.marcaService,
      this.proveedorService,
      this.idGeneratorService  //  Pasa IdGenerator a ProductoService
    );
    this.facturaService = new FacturaService(
      this.productoService,
      this.clienteService,
      this.idGeneratorService
    );

    // Initialize controllers,  pasa las instancias correctas.
    this.carritoController = new CarritoController(new Carrito());  // Pasa una instancia de Carrito
    this.checkoutController = new CheckoutController(
      this.facturaService,
      this.clienteService
    );
    this.tiendaController = new TiendaController(this.productoService);
    // Instancia AdminController (si lo estás usando)

         // Initialize immediately
         this.init();
  }
  // Método para asegurar la existencia de registros de ID (fuera del constructor)
  async init() {
    try {
        // Ensure ID records exist for all entities
        await this.idGeneratorService.ensureIdExists('clientes');
        await this.idGeneratorService.ensureIdExists('productos');
        await this.idGeneratorService.ensureIdExists('facturas');
        await this.idGeneratorService.ensureIdExists('categorias');
        await this.idGeneratorService.ensureIdExists('marcas');
        await this.idGeneratorService.ensureIdExists('proveedores');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}
}

const app = new AppFactory();  // Exporta instancia de AppFactory
export { app };