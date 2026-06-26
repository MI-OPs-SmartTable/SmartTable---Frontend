import { apiClient } from "../lib/apiClient";

export const recetasService = {
  getByVariante: (varianteId: string) => apiClient.get(`/recetas/variante/${varianteId}`),
  create: (body: unknown) => apiClient.post("/recetas", body),
  deleteInsumo: (varianteId: string, insumoId: string) =>
    apiClient.delete(`/recetas/variante/${varianteId}/insumo/${insumoId}`),
};
