// types.ts
export interface CierreCaja {
  id: number;
  fecha: string;
  diaSemana: string;
  cerradoPor: string;
  hora: string;
  total: number;
}

export function formatCurrency(value: number): string {
  return `$ ${value.toLocaleString("es-CO")}`;
}