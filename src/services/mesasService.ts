import { apiClient } from "../lib/apiClient";

export const mesasService = {
  getAll: () => apiClient.get("/mesas"),
  getByUbicacion: (ubicacionId: string) => apiClient.get(`/mesas/ubicacion/${ubicacionId}`),
  getById: (id: string) => apiClient.get(`/mesas/${id}`),
  create: (body: unknown) => apiClient.post("/mesas", body),
  update: (id: string, body: unknown) => apiClient.put(`/mesas/${id}`, body),
  patchEstado: (id: string, estado: string) => apiClient.patch(`/mesas/${id}/estado`, { estado }),
};
