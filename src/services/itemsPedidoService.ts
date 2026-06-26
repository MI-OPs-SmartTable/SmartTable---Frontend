import { apiClient } from "../lib/apiClient";

export const itemsPedidoService = {
  getByPedido: (pedidoId: string) => apiClient.get(`/items-pedido/pedido/${pedidoId}`),
  create: (body: unknown) => apiClient.post("/items-pedido", body),
  patchEstado: (id: string, estado: string) => apiClient.patch(`/items-pedido/${id}/estado`, { estado }),
  delete: (id: string) => apiClient.delete(`/items-pedido/${id}`),
};
