import { apiClient } from "../lib/apiClient";

export const variantesService = {
  getByProducto: (productoId: string) => apiClient.get(`/variantes/producto/${productoId}`),
  getById: (id: string) => apiClient.get(`/variantes/${id}`),
  create: (body: unknown) => apiClient.post("/variantes", body),
  update: (id: string, body: unknown) => apiClient.put(`/variantes/${id}`, body),
  delete: (id: string) => apiClient.delete(`/variantes/${id}`),
};
