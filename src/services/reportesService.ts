import { apiClient } from "../lib/apiClient";

export type ReporteVentaDia = {
  fecha: string;
  cantidad_ventas: number;
  total_efectivo: number;
  total_transferencia: number;
  total: number;
};

export type ReporteProducto = {
  producto_id: string;
  producto: string;
  cantidad_vendida: number;
  total_vendido: number;
};

export type ReporteCategoria = {
  categoria_id: string;
  categoria: string;
  emoji: string;
  cantidad_vendida: number;
  total_vendido: number;
};

export type ReporteDashboard = {
  periodo: string;
  desde: string;
  hasta: string;
  ventas: {
    cantidad: number;
    total: number;
    total_efectivo: number;
    total_transferencia: number;
    ticket_promedio: number;
  };
  gastos: {
    cantidad: number;
    total: number;
  };
  ingresos_netos: number;
  ventas_diarias: ReporteVentaDia[];
  por_categoria: ReporteCategoria[];
  top_productos: ReporteProducto[];
  stock_bajo: {
    cantidad: number;
    insumos: unknown[];
  };
};

export type ReportesFiltro = {
  desde: string;
  hasta: string;
  limite?: number;
};

function buildQuery(filtro: ReportesFiltro): string {
  const params = new URLSearchParams({
    desde: filtro.desde,
    hasta: filtro.hasta,
  });
  if (filtro.limite != null) {
    params.set("limite", String(filtro.limite));
  }
  return params.toString();
}

export async function fetchReporteDashboard(filtro: ReportesFiltro): Promise<ReporteDashboard> {
  return apiClient.get<ReporteDashboard>(`/reportes/dashboard?${buildQuery(filtro)}`);
}

export async function downloadReporteExcel(filtro: ReportesFiltro): Promise<void> {
  const { blob, filename } = await apiClient.getBlob(
    `/reportes/dashboard/excel?${buildQuery(filtro)}`
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `reporte-${filtro.desde}_${filtro.hasta}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
