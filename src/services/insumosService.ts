import { apiClient } from "../lib/apiClient";
import { mapInsumoFromApi } from "../lib/mappers/productoMapper";
import type { Insumo } from "../pages/dashboard/types/productos.types";

export type InsumoCompleto = Insumo & {
  proveedor_id?: string;
  cantidad_actual?: number;
  stock_minimo?: number;
  costo_unitario?: number;
};

export type InsumoStockBajo = Insumo & {
  cantidad_actual: number;
  stock_minimo: number;
};

type InsumoApi = {
  id: string;
  proveedor_id: string;
  nombre: string;
  unidad: string;
  cantidad_actual: number;
  stock_minimo: number;
  costo_unitario: number;
};

export async function fetchInsumosLista(): Promise<InsumoCompleto[]> {
  const data = await apiClient.get<InsumoApi[]>("/insumos");
  return data.map((row) => ({
    ...mapInsumoFromApi(row),
    proveedor_id: row.proveedor_id,
    cantidad_actual: row.cantidad_actual,
    stock_minimo: row.stock_minimo,
    costo_unitario: row.costo_unitario,
  }));
}

export async function fetchInsumosStockBajo(): Promise<InsumoStockBajo[]> {
  const data = await apiClient.get<InsumoApi[]>("/insumos/stock-bajo");
  return data.map((row) => ({
    ...mapInsumoFromApi(row),
    cantidad_actual: row.cantidad_actual,
    stock_minimo: row.stock_minimo,
  }));
}

export async function crearInsumo(payload: {
  nombre: string;
  unidad: string;
  proveedor_id?: string;
  cantidad_actual?: number;
  stock_minimo?: number;
  costo_unitario?: number;
}): Promise<InsumoCompleto> {
  const data = await apiClient.post<InsumoApi>("/insumos", {
    nombre: payload.nombre,
    unidad: payload.unidad,
    proveedor_id: payload.proveedor_id,
    cantidad_actual: payload.cantidad_actual ?? 100,
    stock_minimo: payload.stock_minimo ?? 10,
    costo_unitario: payload.costo_unitario ?? 0,
  });
  return {
    ...mapInsumoFromApi(data),
    proveedor_id: data.proveedor_id,
    cantidad_actual: data.cantidad_actual,
    stock_minimo: data.stock_minimo,
    costo_unitario: data.costo_unitario,
  };
}

export async function actualizarInsumo(
  id: string,
  payload: Partial<{
    nombre: string;
    unidad: string;
    proveedor_id: string;
    cantidad_actual: number;
    stock_minimo: number;
    costo_unitario: number;
  }>
): Promise<InsumoCompleto> {
  const data = await apiClient.put<InsumoApi>(`/insumos/${id}`, payload);
  return {
    ...mapInsumoFromApi(data),
    proveedor_id: data.proveedor_id,
    cantidad_actual: data.cantidad_actual,
    stock_minimo: data.stock_minimo,
    costo_unitario: data.costo_unitario,
  };
}

export async function eliminarInsumo(id: string): Promise<void> {
  await apiClient.delete(`/insumos/${id}`);
}
