import { apiClient } from "../lib/apiClient";
import type { ApiCajaRecord } from "../lib/mappers/cajaMapper";

export type CajaApi = ApiCajaRecord;

export async function fetchCajas(): Promise<CajaApi[]> {
  return apiClient.get<CajaApi[]>("/cajas");
}

export async function fetchCajaById(cajaId: string): Promise<CajaApi> {
  return apiClient.get<CajaApi>(`/cajas/${cajaId}`);
}

/** Caja abierta del usuario (sin usar el endpoint 404 de /abierta/{id}). */
export async function fetchCajaAbierta(usuarioId: string): Promise<CajaApi | null> {
  const cajas = await fetchCajas();
  return (
    cajas.find(
      (caja) => caja.usuario_id === usuarioId && caja.estado === "abierta"
    ) ?? null
  );
}

export async function fetchCajaAbiertaActual(): Promise<CajaApi | null> {
  const cajas = await fetchCajas();
  return cajas.find((caja) => caja.estado === "abierta") ?? null;
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

export async function fetchGastos(): Promise<GastoCajaApi[]> {
  return apiClient.get<GastoCajaApi[]>("/gastos-caja");
}

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
