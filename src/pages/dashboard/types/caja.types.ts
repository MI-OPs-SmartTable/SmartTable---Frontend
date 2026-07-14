export interface GastoCierreItem {
  id: string;
  descripcion: string;
  monto: number;
}

export interface CierreCaja {
  id: string;
  fecha: string;
  fechaRaw: string;
  diaSemana: string;
  cerradoPor: string;
  hora: string;
  /** Total vendido (suma de ventas) */
  total: number;
  baseInicial: number;
  totalVentas: number;
  totalGastos: number;
  neto: number;
  montoEfectivo: number;
  montoTransferencia: number;
  gastos: GastoCierreItem[];
}

export { formatCOP as formatCurrency } from "../../../lib/formatMoney";
