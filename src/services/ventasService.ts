import { apiClient } from "../lib/apiClient";

export type VentaApi = {
  id: string;
  pedido_id: string;
  caja_id: string;
  total: number;
  monto_efectivo: number;
  monto_transferencia: number;
  metodo_pago: string;
  pagado_at: string;
};

export type PedidoApi = {
  id: string;
  mesa_id?: string | null;
  usuario_id: string;
  caja_id: string;
  estado: string;
  created_at?: string;
  items?: {
    id: string;
    variante_id: string;
    cantidad: number;
    precio_unitario: number;
    variante_nombre?: string;
  }[];
};

export async function fetchVentas(): Promise<VentaApi[]> {
  return apiClient.get<VentaApi[]>("/ventas");
}

export async function fetchPedido(id: string): Promise<PedidoApi> {
  return apiClient.get<PedidoApi>(`/pedidos/${id}`);
}

export async function registrarVenta(payload: {
  pedido_id: string;
  caja_id: string;
  pagos: {
    monto_efectivo: number;
    monto_transferencia: number;
    medio_transferencia_id?: string;
    banco_nombre?: string;
    comentario?: string;
    descripcion_transferencia?: string;
  };
}): Promise<VentaApi> {
  return apiClient.post<VentaApi>("/ventas", payload);
}

export function totalPedido(pedido: PedidoApi): number {
  if (!pedido.items?.length) return 0;
  return pedido.items.reduce(
    (sum, item) => sum + Number(item.cantidad) * Number(item.precio_unitario),
    0
  );
}
