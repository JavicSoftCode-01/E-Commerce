// BackEnd/src/models/Producto.js
import {BaseModel} from './BaseModel.js';

/**
 *  🔰🔰Clase Producto que gestiona entidades de productos.🔰🔰
 */
class Producto extends BaseModel {

  /**
   * Crea una instancia de Producto.
   * @param {string} nombre - Nombre del producto.
   * @param {number} categoriaId - ID de la categoría.
   * @param {string} categoriaNombre - Nombre de la categoría.
   * @param {number} marcaId - ID de la marca.
   * @param {string} marcaNombre - Nombre de la marca.
   * @param {number} proveedorId - ID del proveedor.
   * @param {string} proveedorNombre - Nombre del proveedor.
   * @param {number} precio - Precio de costo del producto.
   * @param {number} pvp - Precio de venta al público.
   * @param {number} cantidad - Cantidad inicial en stock.
   * @param {string} [descripcion=""] - Descripción del producto.
   * @param {string} [imagen=""] - URL de la imagen del producto.
   * @param {Array<string>} [nombresExistentes=[]] - Array opcional con nombres de productos existentes (para validación).  No usado
   */
  constructor(nombre, categoriaId, categoriaNombre, marcaId, marcaNombre, proveedorId, proveedorNombre, precio, pvp, cantidad, descripcion = "", imagen = "", nombresExistentes = []) {
    super(nombre);
    this.serial = null;  // Se genera al guardar.
    this.categoriaId = categoriaId;
    this.categoriaNombre = categoriaNombre;
    this.marcaId = marcaId;
    this.marcaNombre = marcaNombre;
    this.proveedorId = proveedorId;
    this.proveedorNombre = proveedorNombre;
    this.precio = precio;
    this.pvp = pvp;
    this.cantidad = cantidad;
    this.stock = cantidad;  // Stock inicial = Cantidad inicial
    this.descripcion = descripcion;
    this.imagen = imagen || "https://t4.ftcdn.net/jpg/06/71/92/37/360_F_671923740_x0zOL3OIuUAnSF6sr7PuznCI5bQFKhI0.jpg";  // Imagen por defecto
  }

  /**
   * Genera un número de serie único para productos.
   * Formato: PROD-AÑO-MES-CONSECUTIVO
   * @param {IdGenerator} idGeneratorService - Instancia de IdGenerator.
   * @returns {Promise<string>} Promesa que resuelve al serial generado.
   */
  static async generarSerialProducto(idGeneratorService) { // Metodo Estatico
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Mes con 2 dígitos
    let lastSerial = await idGeneratorService.getLastId('ProductoSerial');
    lastSerial++;
    await idGeneratorService.setLastId('ProductoSerial', lastSerial);
    console.info(`Generado nuevo serial para Producto: PROD-${year}-${month}-${String(lastSerial).padStart(4, '0')}`);
    const consecutive = String(lastSerial).padStart(4, '0'); // Consecutivo de 4 dígitos
    return `PROD-${year}-${month}-${consecutive}`;
  }

  /**
   * Reduce el stock de un producto según la cantidad vendida.
   * @param {number} cantidadVendida - Cantidad a reducir del stock.
   * @returns {boolean} True si se pudo reducir, false si no hay suficiente stock.
   */
  reducirStock(cantidadVendida) { // Instancia
    if (cantidadVendida > this.stock) {
      console.error("Error: No hay suficiente stock para realizar la venta.");
      return false;
    }
    this.stock -= cantidadVendida;
    console.info(`Stock del producto ${this.nombre} reducido en ${cantidadVendida}.  Nuevo stock: ${this.stock}`);
    return true;
  }
}

export {Producto};