import type { CierreCaja, GastoCierreItem } from "../../pages/dashboard/types/caja.types";
import type { VentaApi } from "../../services/ventasService";
import { parseLocalDateTime } from "../dateTime";

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

export function mapCajaHistorialItem(
  caja: ApiCaja,
  usuarioNombre: string,
  ventasCaja: VentaApi[],
  gastosCaja: GastoCierreItem[] = []
): CierreCaja {
  const cierreAt = caja.cierre_at
    ? parseLocalDateTime(caja.cierre_at)
    : parseLocalDateTime(caja.apertura_at);

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

  const y = cierreAt.getFullYear();
  const m = String(cierreAt.getMonth() + 1).padStart(2, "0");
  const d = String(cierreAt.getDate()).padStart(2, "0");

  return {
    id: caja.id,
    fecha,
    fechaRaw: `${y}-${m}-${d}`,
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
