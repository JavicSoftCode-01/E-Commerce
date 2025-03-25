// import {CategoriaService} from '../../../BackEnd/src/services/CategoriaService.js';
// import {MarcaService} from '../../../BackEnd/src/services/MarcaService.js';
// import {ProveedorService} from '../../../BackEnd/src/services/ProveedorService.js';
// import {ClienteService} from '../../../BackEnd/src/services/ClienteService.js';
// import {ProductoService} from '../../../BackEnd/src/services/ProductoService.js';
// import {FacturaService} from '../../../BackEnd/src/services/FacturaService.js';
// import {IdGenerator} from '../../../BackEnd/src/database/indexdDB.js';
// import {CheckoutController} from './controllers/CheckoutController.js';
// import {CarritoController} from './controllers/CarritoController.js';
// import {TiendaController} from './controllers/TiendaController.js';
//
// class AppFactory {
//   constructor() {
//     // Initialize services first
//     this.categoriaService = new CategoriaService();
//     this.marcaService = new MarcaService();
//     this.proveedorService = new ProveedorService();
//     this.clienteService = new ClienteService();
//     this.idGeneratorService = new IdGenerator();
//
//     // Initialize services with dependencies
//     this.productoService = new ProductoService(
//       this.categoriaService,
//       this.marcaService,
//       this.proveedorService
//     );
//     this.facturaService = new FacturaService(
//       this.productoService,
//       this.clienteService,
//       this.idGeneratorService
//     );
//
//     // Initialize controllers
//     this.checkoutController = new CheckoutController(
//       this.facturaService,
//       this.clienteService
//     );
//     this.carritoController = new CarritoController();
//
//     // Initialize TiendaController AFTER productoService is created
//     this.tiendaController = new TiendaController(this.productoService);
//   }
// }
//
// const app = new AppFactory();
// export {app};
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
    this.ensureIdRecordsExist();


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
  }
  // Método para asegurar la existencia de registros de ID (fuera del constructor)
  async ensureIdRecordsExist() {
    try {
      await this.idGeneratorService.ensureIdExists('Categoria');
      await this.idGeneratorService.ensureIdExists('Marca');
      await this.idGeneratorService.ensureIdExists('Proveedor');
      await this.idGeneratorService.ensureIdExists('Cliente');
      await this.idGeneratorService.ensureIdExists('Producto');
      await this.idGeneratorService.ensureIdExists('Factura');
    } catch (error) {
      console.error("Error al asegurar la existencia de registros de ID:", error);
    }
  }
}

const app = new AppFactory();  // Exporta instancia de AppFactory
export { app };