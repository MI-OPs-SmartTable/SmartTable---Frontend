import { apiClient, ApiError } from "../lib/apiClient";
import type { ApiCajaRecord } from "../lib/mappers/cajaMapper";

export type CajaApi = ApiCajaRecord;

export async function fetchCajas(): Promise<CajaApi[]> {
  return apiClient.get<CajaApi[]>("/cajas");
}

export async function fetchCajaAbierta(usuarioId: string): Promise<CajaApi | null> {
  try {
    return await apiClient.get<CajaApi>(`/cajas/abierta/${usuarioId}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function abrirCaja(usuarioId: string, montoApertura: number): Promise<CajaApi> {
  return apiClient.post<CajaApi>("/cajas/abrir", {
    usuario_id: usuarioId,
    monto_apertura: montoApertura,
  });
}

export async function cerrarCaja(cajaId: string): Promise<CajaApi> {
  return apiClient.post<CajaApi>(`/cajas/${cajaId}/cerrar`, {});
}

export type GastoCajaApi = {
  id: string;
  caja_id: string;
  usuario_id: string;
  monto: number;
  descripcion: string;
  categoria: string;
  created_at: string;
};

export async function fetchGastosPorCaja(cajaId: string): Promise<GastoCajaApi[]> {
  return apiClient.get<GastoCajaApi[]>(`/gastos-caja/caja/${cajaId}`);
}

export async function crearGastoCaja(payload: {
  caja_id: string;
  usuario_id: string;
  monto: number;
  descripcion: string;
  categoria: string;
}): Promise<GastoCajaApi> {
  return apiClient.post<GastoCajaApi>("/gastos-caja", payload);
}
