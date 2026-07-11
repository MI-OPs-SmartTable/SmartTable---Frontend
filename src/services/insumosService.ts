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

export type InsumoResumen = {
  total: number;
  stock_bajo: number;
  stock_ok: number;
  valor_inventario: number;
};

export async function fetchInsumosResumen(): Promise<InsumoResumen> {
  return apiClient.get<InsumoResumen>("/insumos/resumen");
}

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

export type CompraInsumo = {
  id: string;
  insumo_id: string;
  proveedor_id: string | null;
  tipo: "agregar" | "fijar";
  cantidad: number;
  cantidad_anterior: number;
  cantidad_nueva: number;
  costo_unitario: number;
  total: number;
  created_at: string;
  proveedor_nombre?: string | null;
};

export async function fetchComprasInsumo(insumoId: string): Promise<CompraInsumo[]> {
  return apiClient.get<CompraInsumo[]>(`/insumos/${insumoId}/compras`);
}

export async function registrarMovimientoInsumo(
  insumoId: string,
  payload: {
    tipo: "agregar" | "fijar";
    cantidad: number;
    proveedor_id?: string;
    costo_unitario?: number;
  }
): Promise<{ insumo: InsumoCompleto; compras: CompraInsumo[] }> {
  const data = await apiClient.post<{
    insumo: InsumoApi;
    compras: CompraInsumo[];
  }>(`/insumos/${insumoId}/compras`, payload);

  return {
    insumo: {
      ...mapInsumoFromApi(data.insumo),
      proveedor_id: data.insumo.proveedor_id,
      cantidad_actual: data.insumo.cantidad_actual,
      stock_minimo: data.insumo.stock_minimo,
      costo_unitario: data.insumo.costo_unitario,
    },
    compras: data.compras,
  };
}

