import type { CierreCaja } from "../../pages/dashboard/types/caja.types";

type ApiCaja = {
  id: string;
  usuario_id: string;
  monto_apertura: number;
  monto_cierre?: number | null;
  apertura_at: string;
  cierre_at?: string | null;
  estado: string;
};

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function parseSqliteDate(value: string): Date {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export function mapCajaHistorialItem(
  caja: ApiCaja,
  usuarioNombre: string,
  totalVendido: number
): CierreCaja {
  const cierreAt = caja.cierre_at ? parseSqliteDate(caja.cierre_at) : parseSqliteDate(caja.apertura_at);
  const fecha = cierreAt.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hora = cierreAt.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return {
    id: caja.id,
    fecha,
    diaSemana: DIAS[cierreAt.getDay()],
    cerradoPor: usuarioNombre,
    hora,
    total: totalVendido,
    montoEfectivo: 0,
    montoTransferencia: 0,
  };
}

export type ApiCajaRecord = ApiCaja;
