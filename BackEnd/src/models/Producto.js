import {BaseModel} from "./BaseModel.js";

/**
 *  🔰🔰Clase Producto que gestiona entidades de productos.🔰🔰
 */
class Producto extends BaseModel {
  constructor(
    nombre,              // 1
    estado,              // 2
    fechaCreacion,       // 3
    fechaActualizacion,  // 4
    categoriaId,         // 5
    categoriaNombre,     // 6
    marcaId,             // 7
    marcaNombre,         // 8
    proveedorId,         // 9
    proveedorNombre,     // 10
    precio,              // 11
    pvp,                 // 12
    cantidad,            // 13
    descripcion = "",    // 14
    imagen = ""          // 15
  ) {
    super(nombre, estado, fechaCreacion, fechaActualizacion);
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
    this.imagen = imagen || "https://t4.ftcdn.net/jpg/06/71/92/37/360_F_671923740_x0zOL3OIuUAnSF6sr7PuznCI5bQFKhI0.jpg";
  }
}
export { Producto };
