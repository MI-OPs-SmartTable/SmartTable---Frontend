import type { Categoria, Insumo, Producto } from "../pages/dashboard/types/productos.types";

// EJEMPLO DE PRODUCTOS PARA LA SECCION DE PRODUCTOS :V


export const CATEGORIAS_SEED: Categoria[] = [
  { id: "c1", nombre: "Comidas Rápidas", color: "#e8601c", emoji: "🍔" },
  { id: "c2", nombre: "Platos del Día",  color: "#2d7a4f", emoji: "🍽️" },
  { id: "c3", nombre: "Bebidas",         color: "#3b5fc0", emoji: "🥤" },
  { id: "c4", nombre: "Acompañantes",    color: "#d4860f", emoji: "🍟" },
  { id: "c5", nombre: "Postres",         color: "#8b3fc8", emoji: "🍰" },
];

export const INSUMOS_SEED: Insumo[] = [
  { id: "i01", nombre: "Pan de hamburguesa",  unidad: "unidad" },
  { id: "i02", nombre: "Carne de res (100g)", unidad: "porción" },
  { id: "i03", nombre: "Lechuga",             unidad: "gramos" },
  { id: "i04", nombre: "Tomate",              unidad: "gramos" },
  { id: "i05", nombre: "Queso tajado",        unidad: "tajada" },
  { id: "i06", nombre: "Papa",                unidad: "kg" },
  { id: "i07", nombre: "Arroz",               unidad: "kg" },
  { id: "i08", nombre: "Frijoles",            unidad: "kg" },
  { id: "i09", nombre: "Chicharrón",          unidad: "porción" },
  { id: "i10", nombre: "Salchicha",           unidad: "unidad" },
  { id: "i11", nombre: "Pan perro",           unidad: "unidad" },
  { id: "i12", nombre: "Coca Cola 350ml",     unidad: "unidad" },
  { id: "i13", nombre: "Agua 500ml",          unidad: "unidad" },
  { id: "i14", nombre: "Cerveza 330ml",       unidad: "unidad" },
  { id: "i15", nombre: "Jugo natural",        unidad: "unidad" },
];

export const PRODUCTOS_SEED: Producto[] = [
  { id: "p1", nombre: "Hamburguesa Clásica", descripcion: "Carne, lechuga, tomate y queso", precio: 15000, categoriaId: "c1", activo: true, emoji: "🍔", insumos: [{ insumoId: "i01", cantidad: 1 }, { insumoId: "i02", cantidad: 1 }, { insumoId: "i03", cantidad: 20 }, { insumoId: "i04", cantidad: 30 }, { insumoId: "i05", cantidad: 2 }] },
  { id: "p2", nombre: "Hamburguesa Doble",   descripcion: "Doble carne, doble queso", precio: 18000, categoriaId: "c1", activo: true, emoji: "🍔", insumos: [{ insumoId: "i01", cantidad: 1 }, { insumoId: "i02", cantidad: 2 }, { insumoId: "i05", cantidad: 4 }] },
  { id: "p3", nombre: "Hot Dog", descripcion: "Salchicha, mostaza y ketchup", precio: 10000, categoriaId: "c1", activo: true, emoji: "🌭", insumos: [{ insumoId: "i10", cantidad: 1 }, { insumoId: "i11", cantidad: 1 }] },
  { id: "p4", nombre: "Perro con Todo", descripcion: "Salchicha con todos los aderezos", precio: 12000, categoriaId: "c1", activo: true, emoji: "🌭", insumos: [{ insumoId: "i10", cantidad: 1 }, { insumoId: "i11", cantidad: 1 }] },
  { id: "p5", nombre: "Bandeja Paisa", descripcion: "Arroz, frijoles, chicharrón, carne", precio: 22000, categoriaId: "c2", activo: true, emoji: "🍽️", insumos: [{ insumoId: "i07", cantidad: 0.2 }, { insumoId: "i08", cantidad: 0.15 }, { insumoId: "i09", cantidad: 1 }, { insumoId: "i02", cantidad: 1 }] },
  { id: "p6", nombre: "Sopa del Día", descripcion: "Sopa casera según el día", precio: 15000, categoriaId: "c2", activo: true, emoji: "🍲", insumos: [] },
  { id: "p7", nombre: "Almuerzo Corriente", descripcion: "Sopa, seco, jugo y postre", precio: 18000, categoriaId: "c2", activo: true, emoji: "🍽️", insumos: [] },
  { id: "p8", nombre: "Papas Fritas", descripcion: "Papas fritas crocantes", precio: 8000, categoriaId: "c4", activo: true, emoji: "🍟", insumos: [{ insumoId: "i06", cantidad: 0.3 }] },
  { id: "p9", nombre: "Coca Cola", descripcion: "Refresco 350ml", precio: 4000, categoriaId: "c3", activo: true, emoji: "🥤", insumos: [{ insumoId: "i12", cantidad: 1 }] },
  { id: "p10", nombre: "Cerveza", descripcion: "Cerveza fría 330ml", precio: 5000, categoriaId: "c3", activo: false, emoji: "🍺", insumos: [{ insumoId: "i14", cantidad: 1 }] },
];

export const uid = () => `p${Date.now()}`;
export { fmt, formatCOP } from "../lib/formatMoney";