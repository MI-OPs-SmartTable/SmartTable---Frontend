import { apiClient } from "../lib/apiClient";
import {
  mapCatalogoFromApi,
  mapCategoriaFromApi,
  mapProductoFromApi,
  mapProductoToCreateApi,
  mapProductoToUpdateApi,
  type CatalogoItem,
} from "../lib/mappers/productoMapper";
import { enrichCategoria } from "../lib/categoriaUi";
import type { Producto, Categoria, Insumo } from "../pages/dashboard/types/productos.types";
import { fetchInsumosLista } from "./insumosService";

type ApiRow = Parameters<typeof mapProductoFromApi>[0];

export async function fetchProductos(): Promise<Producto[]> {
  const data = await apiClient.get<ApiRow[]>("/productos?detalle=1");
  return data.map(mapProductoFromApi);
}

export async function fetchCatalogo(): Promise<CatalogoItem[]> {
  const data = await apiClient.get<ApiRow[]>("/productos?catalogo=1");
  return data.map(mapCatalogoFromApi);
}

export async function fetchCategorias(): Promise<Categoria[]> {
  const data = await apiClient.get<{ id: string; nombre: string; emoji?: string | null }[]>("/categorias");
  return data.map((c) => enrichCategoria(mapCategoriaFromApi(c)));
}

export async function fetchInsumos(): Promise<Insumo[]> {
  const list = await fetchInsumosLista();
  return list.map(({ id, nombre, unidad }) => ({ id, nombre, unidad }));
}

export async function crearProducto(producto: Omit<Producto, "id">): Promise<Producto> {
  const created = await apiClient.post<ApiRow>("/productos", mapProductoToCreateApi(producto));
  return mapProductoFromApi(created);
}

export async function actualizarProducto(id: string, producto: Partial<Producto>): Promise<Producto> {
  const updated = await apiClient.put<ApiRow>(`/productos/${id}`, mapProductoToUpdateApi(producto));
  // PUT devuelve producto + variantes; reconsultar detalle para traer receta/precio de catálogo
  const list = await apiClient.get<ApiRow[]>("/productos?detalle=1");
  const found = list.find((p) => p.id === id);
  if (found) return mapProductoFromApi(found);
  return mapProductoFromApi(updated);
}

export async function eliminarProducto(id: string): Promise<void> {
  await apiClient.delete(`/productos/${id}`);
}
