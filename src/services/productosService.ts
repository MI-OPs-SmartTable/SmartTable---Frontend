
import type { Producto, Categoria, Insumo } from "../pages/dashboard/types/productos.types";
import { CATEGORIAS_SEED, INSUMOS_SEED, PRODUCTOS_SEED } from "../data/seedData"
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// OBTENER PRODUCTOS (CONEXIÓN BD)
export async function fetchProductos(): Promise<Producto[]> {
  try {
    const response = await fetch(`${API_URL}/productos`);
    if (!response.ok) throw new Error("Error al cargar productos");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetchProductos:", error);
    return PRODUCTOS_SEED; // Fallback a datos locales
  }
}

// OBTENER CATEGORÍAS
export async function fetchCategorias(): Promise<Categoria[]> {
  try {
    const response = await fetch(`${API_URL}/categorias`);
    if (!response.ok) throw new Error("Error al cargar categorías");
    const data = await response.json();
    return data;
  } catch (error) {
    return CATEGORIAS_SEED;
  }
}

//  OBTENER INSUMOS
export async function fetchInsumos(): Promise<Insumo[]> {
  try {
    const response = await fetch(`${API_URL}/insumos`);
    if (!response.ok) throw new Error("Error al cargar insumos");
    const data = await response.json();
    return data;
  } catch (error) {
    return INSUMOS_SEED;
  }
}

// CREAR PRODUCTO
export async function crearProducto(producto: Omit<Producto, "id">): Promise<Producto> {
  const response = await fetch(`${API_URL}/productos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(producto),
  });
  if (!response.ok) throw new Error("Error al crear producto");
  return response.json();
}

// ACTUALIZAR PRODUCTO
export async function actualizarProducto(id: string, producto: Partial<Producto>): Promise<Producto> {
  const response = await fetch(`${API_URL}/productos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(producto),
  });
  if (!response.ok) throw new Error("Error al actualizar producto");
  return response.json();
}

// ELIMINAR PRODUCTO
export async function eliminarProducto(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/productos/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error al eliminar producto");
}