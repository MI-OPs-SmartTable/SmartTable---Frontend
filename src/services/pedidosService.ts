import { apiClient } from "../lib/apiClient";
import type { PedidoApi, PedidoItemPayload } from "./ventasService";

export async function fetchPedidos(): Promise<PedidoApi[]> {
  return apiClient.get<PedidoApi[]>("/pedidos");
}

export async function fetchPedidosPendientes(cajaId: string): Promise<PedidoApi[]> {
  return apiClient.get<PedidoApi[]>(`/pedidos/pendientes/${cajaId}`);
}

export async function fetchPedidoById(id: string): Promise<PedidoApi> {
  return apiClient.get<PedidoApi>(`/pedidos/${id}`);
}

export async function crearPedido(payload: {
  usuario_id: string;
  caja_id: string;
  mesa_id?: string;
  items: PedidoItemPayload[];
}): Promise<PedidoApi> {
  return apiClient.post<PedidoApi>("/pedidos", payload);
}

export async function actualizarPedidoItems(
  pedidoId: string,
  items: PedidoItemPayload[]
): Promise<PedidoApi> {
  return apiClient.put<PedidoApi>(`/pedidos/${pedidoId}`, { items });
}

export async function cancelarPedido(pedidoId: string): Promise<PedidoApi> {
  return apiClient.delete<PedidoApi>(`/pedidos/${pedidoId}`);
}
