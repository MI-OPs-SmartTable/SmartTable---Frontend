import { apiClient } from "../lib/apiClient";
import type { PedidoApi } from "./ventasService";

export async function fetchPedidos(): Promise<PedidoApi[]> {
  return apiClient.get<PedidoApi[]>("/pedidos");
}

export async function fetchPedidoById(id: string): Promise<PedidoApi> {
  return apiClient.get<PedidoApi>(`/pedidos/${id}`);
}
