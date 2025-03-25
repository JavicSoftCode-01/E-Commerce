// FrontEnd/ui/services/UшымтаService.js

// import {app} from '../AppFactory.js';  // ¡¡¡YA NO!!! Importamos app *dentro* de los métodos
import { IdGenerator } from '../../../../BackEnd/src/database/indexdDB.js';

class UIService {
    constructor() { // YA NO RECIBE DEPENDENCIAS
        // Ya no se necesitan las propiedades individuales de los servicios
        this.idGenerator = new IdGenerator();
        // Caché de datos, se mantiene igual.
        this.categorias = [];
        this.marcas = [];
        this.proveedores = [];
        this.clientes = [];
    }

  //El metodo pasa a la clase IdGenerator, donde corresponde.
   // async ensureIds() { ... }

    async init() {
         //Ahora ensureIds se llama aquí, utilizando la instancia correcta.
         await this.idGenerator.ensureIdExists('Categoria');
        await this.idGenerator.ensureIdExists('Marca');
         await this.idGenerator.ensureIdExists('Proveedor');
      await this.idGenerator.ensureIdExists('Cliente');
         await this.idGenerator.ensureIdExists('Producto');
          await this.idGenerator.ensureIdExists('Factura');
         await this.idGenerator.ensureIdExists('ProductoSerial');

        await this.cargarDatosIniciales(); //  <-- ¡Se mantiene!
    }
     async cargarDatosIniciales() {
        // Importante el import DENTRO del método
        const { app } = await import('../AppFactory.js'); // Importa *dentro* de la función.
        try {
            // Cargar usando los *servicios* (IMPORTANTE).  Ahora desde app.
          this.categorias = await app.categoriaService.obtenerTodasLasCategorias();
          this.marcas = await app.marcaService.obtenerTodasLasMarcas();
         this.proveedores = await app.proveedorService.obtenerTodosLosProveedores();
         this.clientes = await app.clienteService.obtenerTodosLosClientes();
         console.info('Datos iniciales cargados:', this.categorias, this.marcas, this.proveedores, this.clientes);

       } catch (error) {
          console.error('Error al cargar datos iniciales:', error);
       }
   }

    //Ahora accedemos a los datos cacheados a través de métodos get, pero
    //usando la instancia 'app' para obtener los servicios.
    async getCategorias() {
        const { app } = await import('../AppFactory.js'); //YA NO return this.categoria
      return app.categoriaService.obtenerTodasLasCategorias();
     }
    async getMarcas() {
       const { app } = await import('../AppFactory.js');
      return app.marcaService.obtenerTodasLasMarcas();
    }
   async getProveedores() {
       const { app } = await import('../AppFactory.js');
      return app.proveedorService.obtenerTodosLosProveedores();
     }

   async getClientes() {
        const { app } = await import('../AppFactory.js');
       return app.clienteService.obtenerTodosLosClientes();
  }
    async refreshCache() {
        await this.cargarDatosIniciales(); //
    }
}
 // Instancia *fuera* de la clase, y se exporta la *instancia*.
  const appService = new UIService();  // YA NO RECIBE PARÁMETROS
export { appService };