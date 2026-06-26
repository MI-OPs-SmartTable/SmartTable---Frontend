// types.ts
export interface CierreCaja {
  id: string;
  fecha: string;
  diaSemana: string;
  cerradoPor: string;
  hora: string;
  total: number;
  montoEfectivo?: number;
  montoTransferencia?: number;
}

export { formatCOP as formatCurrency } from "../../../lib/formatMoney";