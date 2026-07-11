import { apiClient } from "../lib/apiClient";
import type { PedidoItemPayload } from "./ventasService";

export const itemsPedidoService = {
  getByPedido: (pedidoId: string) => apiClient.get(`/items-pedido/pedido/${pedidoId}`),
  create: (body: { pedido_id: string } & PedidoItemPayload) => apiClient.post("/items-pedido", body),
  patchEstado: (id: string, estado: string) => apiClient.patch(`/items-pedido/${id}/estado`, { estado }),
  delete: (id: string) => apiClient.delete(`/items-pedido/${id}`),
};
