import { apiClient } from "../lib/apiClient";
import { enrichCategoria } from "../lib/categoriaUi";
import type { Categoria } from "../pages/dashboard/types/productos.types";

type CategoriaApi = { id: string; nombre: string; emoji?: string | null; activo?: number };

export async function fetchCategoriasCrud(): Promise<Categoria[]> {
  const data = await apiClient.get<CategoriaApi[]>("/categorias");
  return data.map((c) => enrichCategoria({ id: c.id, nombre: c.nombre, emoji: c.emoji }));
}

export async function crearCategoria(nombre: string, emoji?: string): Promise<Categoria> {
  const data = await apiClient.post<CategoriaApi>("/categorias", { nombre, emoji });
  return enrichCategoria({ id: data.id, nombre: data.nombre, emoji: data.emoji });
}

export async function actualizarCategoria(
  id: string,
  nombre: string,
  emoji?: string
): Promise<Categoria> {
  const data = await apiClient.put<CategoriaApi>(`/categorias/${id}`, { nombre, emoji });
  return enrichCategoria({ id: data.id, nombre: data.nombre, emoji: data.emoji });
}

export async function eliminarCategoria(id: string): Promise<void> {
  await apiClient.delete(`/categorias/${id}`);
}
