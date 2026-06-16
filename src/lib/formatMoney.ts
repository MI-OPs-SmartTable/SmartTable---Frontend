/** Formato monetario en español (Colombia): $ 15.000 */
export function formatCOP(value: number): string {
  const n = Number(value);
  const amount = Number.isNaN(n) ? 0 : n;
  const formatted = new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `$ ${formatted}`;
}

export const fmt = formatCOP;
