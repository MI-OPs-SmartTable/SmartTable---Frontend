import { apiClient } from "../lib/apiClient";

export type FilaOmitida = {
  fila: number;
  motivo: string;
  producto?: string;
};

export type ImportacionResumen = {
  categorias_creadas: number;
  proveedores_creados: number;
  insumos_creados: number;
  insumos_con_stock_ajustado: number;
  insumos_sin_proveedor_asignado_na: number;
  productos_creados: number;
  productos_fusionados_por_duplicado: number;
  filas_omitidas: FilaOmitida[];
};

export async function importarExcel(file: File): Promise<ImportacionResumen> {
  const formData = new FormData();
  formData.append("archivo", file, file.name);
  return apiClient.postFormData<ImportacionResumen>("/importacion/excel", formData);
}
