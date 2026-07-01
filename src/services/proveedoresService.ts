import { apiClient } from "../lib/apiClient";

export const proveedoresService = {
  getAll: () => apiClient.get("/proveedores"),
  getById: (id: string) => apiClient.get(`/proveedores/${id}`),
  create: (body: unknown) => apiClient.post("/proveedores", body),
  update: (id: string, body: unknown) => apiClient.put(`/proveedores/${id}`, body),
  delete: (id: string) => apiClient.delete(`/proveedores/${id}`),
};
