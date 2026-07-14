import { apiClient } from "../lib/apiClient";

export type VentaItemApi = {
  id: string;
  variante_id: string;
  cantidad: number;
  precio_unitario: number;
  estado?: string;
  variante_nombre?: string;
  producto_nombre?: string;
  subtotal?: number;
};

export type PedidoItemPayload = {
  variante_id: string;
  cantidad: number;
  nota?: string | null;
};

export type PedidoItemApi = PedidoItemPayload & {
  id: string;
  precio_unitario: number;
  variante_nombre?: string;
};

export type VentaApi = {
  id: string;
  pedido_id: string;
  caja_id: string;
  total: number;
  monto_efectivo: number;
  monto_transferencia: number;
  metodo_pago: string;
  pagado_at: string;
  mesa_id?: string | null;
  mesa_nombre?: string | null;
  ubicacion_nombre?: string | null;
  items?: VentaItemApi[];
};

export type PedidoApi = {
  id: string;
  mesa_id?: string | null;
  usuario_id: string;
  caja_id: string;
  estado: string;
  created_at?: string;
  items?: PedidoItemApi[];
};

export async function fetchVentas(): Promise<VentaApi[]> {
  return apiClient.get<VentaApi[]>("/ventas");
}

export async function fetchVentasPorCaja(cajaId: string): Promise<VentaApi[]> {
  return apiClient.get<VentaApi[]>(`/ventas/caja/${cajaId}`);
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

export function labelMetodoPago(metodo: string): string {
  if (metodo === "efectivo") return "Efectivo";
  if (metodo === "transferencia") return "Transferencia";
  if (metodo === "mixto") return "Mixto";
  return metodo || "Pago";
}

export function labelUbicacionVenta(venta: VentaApi): string {
  const mesa = venta.mesa_nombre?.trim();
  const ubicacion = venta.ubicacion_nombre?.trim();
  if (mesa && ubicacion) return `${mesa} · ${ubicacion}`;
  if (mesa) return mesa;
  if (ubicacion) return ubicacion;
  return "Sin mesa";
}

export function labelProductoVenta(item: VentaItemApi): string {
  const producto = item.producto_nombre?.trim();
  const variante = item.variante_nombre?.trim();
  if (producto && variante && producto.toLowerCase() !== variante.toLowerCase()) {
    return `${producto} · ${variante}`;
  }
  return producto || variante || "Producto";
}
