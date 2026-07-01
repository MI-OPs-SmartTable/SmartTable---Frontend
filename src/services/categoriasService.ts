import { apiClient } from "../lib/apiClient";
import { enrichCategoria } from "../lib/categoriaUi";
import type { Categoria } from "../pages/dashboard/types/productos.types";

type CategoriaApi = { id: string; nombre: string; activo?: number };

export async function fetchCategoriasCrud(): Promise<Categoria[]> {
  const data = await apiClient.get<CategoriaApi[]>("/categorias");
  return data.map((c) => enrichCategoria({ id: c.id, nombre: c.nombre }));
}

export async function crearCategoria(nombre: string): Promise<Categoria> {
  const data = await apiClient.post<CategoriaApi>("/categorias", { nombre });
  return enrichCategoria({ id: data.id, nombre: data.nombre });
}

export async function actualizarCategoria(id: string, nombre: string): Promise<Categoria> {
  const data = await apiClient.put<CategoriaApi>(`/categorias/${id}`, { nombre });
  return enrichCategoria({ id: data.id, nombre: data.nombre });
}

export async function eliminarCategoria(id: string): Promise<void> {
  await apiClient.delete(`/categorias/${id}`);
}
