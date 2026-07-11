import type { CierreCaja, GastoCierreItem } from "../../pages/dashboard/types/caja.types";
import type { VentaApi } from "../../services/ventasService";

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
  ventasCaja: VentaApi[],
  gastosCaja: GastoCierreItem[] = []
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

  const baseInicial = Number(caja.monto_apertura ?? 0);
  const totalVentas = ventasCaja.reduce((sum, v) => sum + Number(v.total), 0);
  const montoEfectivo = ventasCaja.reduce((sum, v) => sum + Number(v.monto_efectivo), 0);
  const montoTransferencia = ventasCaja.reduce(
    (sum, v) => sum + Number(v.monto_transferencia),
    0
  );
  const totalGastos = gastosCaja.reduce((sum, g) => sum + Number(g.monto), 0);

  return {
    id: caja.id,
    fecha,
    fechaRaw: cierreAt.toISOString().split("T")[0],
    diaSemana: DIAS[cierreAt.getDay()],
    cerradoPor: usuarioNombre,
    hora,
    total: totalVentas,
    baseInicial,
    totalVentas,
    totalGastos,
    neto: baseInicial + totalVentas - totalGastos,
    montoEfectivo,
    montoTransferencia,
    gastos: gastosCaja,
  };
}

export type ApiCajaRecord = ApiCaja;
