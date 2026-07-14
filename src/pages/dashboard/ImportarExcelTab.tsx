import { useState } from "react";
import { ApiError } from "../../lib/apiClient";
import { importarExcel, type ImportacionResumen } from "../../services/importacionService";

const ORANGE = "#F97316";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 12, color: "#6b7280" }}>{hint}</span>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1.5px solid #e5e7eb",
  borderRadius: 8,
  padding: "10px 13px",
  fontSize: 14,
  outline: "none",
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "12px 14px",
        display: "grid",
        gap: 4,
        minWidth: 140,
      }}
    >
      <span style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{value}</span>
      <span style={{ fontSize: 12, color: "#6b7280" }}>{label}</span>
    </div>
  );
}

export default function ImportarExcelTab() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [resumen, setResumen] = useState<ImportacionResumen | null>(null);
  const [error, setError] = useState("");

  const handleFileChange = (selected: File | null) => {
    setFile(selected);
    setResumen(null);
    setError("");
  };

  const handleImport = async () => {
    if (!file) {
      setError("Selecciona el archivo .xlsx exportado de tu sistema anterior.");
      return;
    }

    const ok = window.confirm(
      "Esto creará nuevas categorías, proveedores, insumos y productos a partir del archivo.\n\n" +
        "Si ya importaste este archivo antes, no lo vuelvas a subir: se crearán insumos y productos duplicados " +
        "(solo las categorías y proveedores existentes se reutilizan).\n\n¿Continuar?"
    );
    if (!ok) return;

    setImporting(true);
    setError("");
    setResumen(null);
    try {
      const result = await importarExcel(file);
      setResumen(result);
      setFile(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo importar el archivo");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
      <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "14px 16px" }}>
        <p style={{ margin: 0, fontSize: 13, color: "#9a3412", lineHeight: 1.5 }}>
          Sube el Excel de inventario exportado de tu sistema POS anterior. SmartTable creará automáticamente
          las categorías, proveedores, insumos y productos que reconozca en el archivo.
        </p>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 10, padding: "12px 14px", fontSize: 13 }}>
          {error}
        </div>
      )}

      <section style={{ display: "grid", gap: 14 }}>
        <Field label="Archivo Excel" hint="Formato: .xlsx (máx. 15MB)">
          <input
            type="file"
            accept=".xlsx"
            disabled={importing}
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            style={{ ...inputStyle, padding: "8px 10px" }}
          />
        </Field>

        <button
          type="button"
          onClick={handleImport}
          disabled={importing || !file}
          style={{
            padding: "11px 22px",
            borderRadius: 999,
            border: "none",
            background: importing || !file ? "#fed7aa" : ORANGE,
            color: "#fff",
            fontWeight: 700,
            cursor: importing || !file ? "default" : "pointer",
            fontSize: 14,
            width: "fit-content",
          }}
        >
          {importing ? "Importando…" : "Importar archivo"}
        </button>
      </section>

      {resumen && (
        <section style={{ borderTop: "1px solid #f3f4f6", paddingTop: 20, display: "grid", gap: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>Resultado de la importación</h3>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <StatCard label="Categorías creadas" value={resumen.categorias_creadas} />
            <StatCard label="Proveedores creados" value={resumen.proveedores_creados} />
            <StatCard label="Insumos creados" value={resumen.insumos_creados} />
            <StatCard label="Productos creados" value={resumen.productos_creados} />
          </div>

          <div style={{ display: "grid", gap: 6, fontSize: 13, color: "#4b5563" }}>
            {resumen.insumos_con_stock_ajustado > 0 && (
              <div>
                {resumen.insumos_con_stock_ajustado} insumo(s) tenían stock negativo en el archivo original y se
                dejaron en 0.
              </div>
            )}
            {resumen.insumos_sin_proveedor_asignado_na > 0 && (
              <div>
                {resumen.insumos_sin_proveedor_asignado_na} insumo(s) no tenían proveedor en el archivo y se
                asignaron a un proveedor genérico "N/A"; puedes editarlos después.
              </div>
            )}
            {resumen.productos_fusionados_por_duplicado > 0 && (
              <div>
                {resumen.productos_fusionados_por_duplicado} producto(s) tenían el nombre repetido en el archivo;
                se conservó solo la primera aparición de cada uno.
              </div>
            )}
          </div>

          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#9a3412", lineHeight: 1.5 }}>
            Los productos importados no tienen receta (insumos asociados) configurada. El descuento automático de
            inventario no funcionará para ellos hasta que configures la receta de cada uno manualmente en la
            sección de Productos.
          </div>

          {resumen.filas_omitidas.length > 0 && (
            <div>
              <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#374151" }}>
                Filas omitidas ({resumen.filas_omitidas.length})
              </h4>
              <div style={{ display: "grid", gap: 6, fontSize: 12.5, color: "#4b5563", maxHeight: 220, overflowY: "auto" }}>
                {resumen.filas_omitidas.map((f) => (
                  <div key={f.fila} style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: 6 }}>
                    Fila {f.fila}: {f.motivo}
                    {f.producto ? ` (${f.producto})` : ""}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
