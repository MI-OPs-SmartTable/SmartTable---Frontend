import { useEffect, useRef } from "react";
import { getToken } from "../auth/authService";

export type PosRealtimeEvent = {
  type: string;
  caja_id?: string;
  at?: string;
};

type UsePosRealtimeOptions = {
  enabled?: boolean;
  cajaId?: string | null;
  onPedidosChanged?: () => void;
};

/**
 * SSE no pasa bien por el proxy de Vite (la conexión se corta y parece polling).
 * Si VITE_API_URL es relativo (/api), conectamos directo al backend en el mismo host.
 */
function resolveEventsUrl(token: string): string {
  const explicit = (import.meta.env.VITE_SSE_URL as string | undefined)?.replace(/\/$/, "");
  if (explicit) {
    return `${explicit}/events?token=${encodeURIComponent(token)}`;
  }

  const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "/api";
  if (/^https?:\/\//i.test(apiBase)) {
    const root = apiBase.endsWith("/api") ? apiBase : `${apiBase}/api`;
    return `${root}/events?token=${encodeURIComponent(token)}`;
  }

  const port = (import.meta.env.VITE_API_PORT as string | undefined) || "8080";
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:${port}/api/events?token=${encodeURIComponent(token)}`;
}

/**
 * Suscripción SSE a eventos del POS (pedidos/mesas por cobrar).
 * Una sola conexión larga; solo reintenta si se cae (no es polling).
 */
export function usePosRealtime({
  enabled = true,
  cajaId,
  onPedidosChanged,
}: UsePosRealtimeOptions) {
  const onPedidosChangedRef = useRef(onPedidosChanged);
  onPedidosChangedRef.current = onPedidosChanged;

  useEffect(() => {
    if (!enabled || !cajaId) return;

    const token = getToken();
    if (!token) return;

    let closed = false;
    let retryTimer: number | undefined;
    let source: EventSource | null = null;
    let attempt = 0;

    const clearRetry = () => {
      if (retryTimer !== undefined) {
        window.clearTimeout(retryTimer);
        retryTimer = undefined;
      }
    };

    const connect = () => {
      if (closed) return;
      clearRetry();
      source?.close();

      const url = resolveEventsUrl(token);
      source = new EventSource(url);

      source.addEventListener("connected", () => {
        attempt = 0;
      });

      source.addEventListener("message", (evt) => {
        try {
          const data = JSON.parse((evt as MessageEvent).data) as PosRealtimeEvent;
          if (data.type !== "pedidos_changed") return;
          if (data.caja_id && data.caja_id !== cajaId) return;
          onPedidosChangedRef.current?.();
        } catch {
          /* ignorar payloads inválidos */
        }
      });

      source.onerror = () => {
        // Cerrar para desactivar el auto-reconnect nativo (evita storm cada ~1s).
        source?.close();
        source = null;
        if (closed) return;

        attempt += 1;
        const delay = Math.min(30000, 2000 * 2 ** Math.min(attempt - 1, 4));
        retryTimer = window.setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      closed = true;
      clearRetry();
      source?.close();
      source = null;
    };
  }, [enabled, cajaId]);
}
