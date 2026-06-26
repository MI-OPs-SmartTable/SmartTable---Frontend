import { apiClient } from "../lib/apiClient";

export const sesionesService = {
  getById: (id: string) => apiClient.get(`/sesiones/${id}`),
  iniciar: (body: unknown) => apiClient.post("/sesiones/iniciar", body),
  cerrar: (id: string, body?: unknown) => apiClient.post(`/sesiones/${id}/cerrar`, body),
};
