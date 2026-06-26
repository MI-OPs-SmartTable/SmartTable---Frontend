import { apiClient } from "../lib/apiClient";

export const ubicacionesService = {
  getAll: () => apiClient.get("/ubicaciones"),
  getById: (id: string) => apiClient.get(`/ubicaciones/${id}`),
  create: (body: unknown) => apiClient.post("/ubicaciones", body),
  update: (id: string, body: unknown) => apiClient.put(`/ubicaciones/${id}`, body),
  delete: (id: string) => apiClient.delete(`/ubicaciones/${id}`),
};
