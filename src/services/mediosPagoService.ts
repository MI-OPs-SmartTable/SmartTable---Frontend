import { apiClient } from "../lib/apiClient";

export type MedioPagoApi = {
  id: string;
  nombre: string;
  activo: number;
};

export async function fetchMediosPago(): Promise<MedioPagoApi[]> {
  return apiClient.get<MedioPagoApi[]>("/medios-pago-transferencia");
}

export async function crearMedioPago(nombre: string): Promise<MedioPagoApi> {
  return apiClient.post<MedioPagoApi>("/medios-pago-transferencia", { nombre });
}

export async function actualizarMedioPago(
  id: string,
  payload: { nombre?: string; activo?: number }
): Promise<MedioPagoApi> {
  return apiClient.put<MedioPagoApi>(`/medios-pago-transferencia/${id}`, payload);
}

export async function eliminarMedioPago(id: string): Promise<void> {
  await apiClient.delete(`/medios-pago-transferencia/${id}`);
}
