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

export type SesionApi = {
  id: string;
  usuario_id: string;
  caja_id: string;
  rol_sesion: string;
  inicio_at: string;
  fin_at: string | null;
};

export type ColaboradorApi = {
  sesion_id: string;
  usuario_id: string;
  caja_id: string;
  rol_sesion: string;
  inicio_at: string;
  fin_at: string | null;
  nombre_completo: string;
  email: string;
  rol: string;
};

export async function fetchColaboradores(cajaId: string): Promise<ColaboradorApi[]> {
  const data = await apiClient.get<{ caja: CajaApi; colaboradores: ColaboradorApi[] }>(
    `/cajas/${cajaId}/colaboradores`
  );
  return data.colaboradores;
}

export async function agregarColaborador(cajaId: string, usuarioId: string): Promise<SesionApi> {
  return apiClient.post<SesionApi>(`/cajas/${cajaId}/colaboradores`, {
    usuario_id: usuarioId,
  });
}

export async function cerrarSesion(sesionId: string): Promise<SesionApi> {
  return apiClient.post<SesionApi>(`/sesiones/${sesionId}/cerrar`, {});
}
