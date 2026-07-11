import { useState } from "react";
import type { InsumoCompleto } from "../services/insumosService";
import type { Proveedor } from "../pages/dashboard/types/proveedores.types";

const UNIDADES = ["unidad", "porción", "gramos", "kg", "ml", "litro", "tajada"];

const I = {
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  check: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
};

export type InsumoFormData = {
  nombre: string;
  unidad: string;
  cantidad_actual?: number;
  stock_minimo?: number;
  costo_unitario?: number;
  proveedor_id?: string;
};

interface Props {
  editTarget: InsumoCompleto | null;
  proveedores: Proveedor[];
  onClose: () => void;
  onSave: (data: InsumoFormData) => Promise<void>;
}

export default function InsumoModal({ editTarget, proveedores, onClose, onSave }: Props) {
  const isEdit = Boolean(editTarget);
  const [nombre, setNombre] = useState(editTarget?.nombre ?? "");
  const [unidad, setUnidad] = useState(editTarget?.unidad ?? "unidad");
  const [cantidad, setCantidad] = useState(String(editTarget?.cantidad_actual ?? 0));
  const [stockMin, setStockMin] = useState(String(editTarget?.stock_minimo ?? 0));
  const [costo, setCosto] = useState(String(editTarget?.costo_unitario ?? 0));
  const [proveedorId, setProveedorId] = useState(editTarget?.proveedor_id ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!unidad.trim()) {
      setError("La unidad es obligatoria");
      return;
    }
    const cantidadNum = Number(cantidad);
    const stockMinNum = Number(stockMin);
    const costoNum = Number(costo);
    if (!Number.isFinite(cantidadNum) || cantidadNum < 0) {
      setError("La cantidad a ingresar debe ser un número mayor o igual a 0");
      return;
    }
    if (!Number.isFinite(stockMinNum) || stockMinNum < 0) {
      setError("El stock mínimo debe ser un número mayor o igual a 0");
      return;
    }
    if (!Number.isFinite(costoNum) || costoNum < 0) {
      setError("El costo unitario debe ser un número mayor o igual a 0");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave({
        nombre: nombre.trim(),
        unidad: unidad.trim(),
        cantidad_actual: cantidadNum,
        stock_minimo: stockMinNum,
        costo_unitario: costoNum,
        proveedor_id: proveedorId || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pr-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pr-modal">
        <div className="pr-modal-header">
          <div className="pr-modal-title">{isEdit ? "Editar Insumo" : "Nuevo Insumo"}</div>
          <button type="button" className="pr-modal-close" onClick={onClose}>{I.close}</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="pr-modal-body">
            {error && <p className="pr-field-error">{error}</p>}

            <div className="pr-form-group">
              <label>Nombre <span className="pr-required">*</span></label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del insumo"
                autoFocus
              />
            </div>

            <div className="pr-field-row">
              <div className="pr-form-group">
                <label>Unidad</label>
                <select value={unidad} onChange={(e) => setUnidad(e.target.value)}>
                  {UNIDADES.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="pr-form-group">
                <label>{isEdit ? "Stock actual" : "Cantidad a ingresar"}</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                />
              </div>
            </div>

            <div className="pr-field-row">
              <div className="pr-form-group">
                <label>Stock mínimo</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={stockMin}
                  onChange={(e) => setStockMin(e.target.value)}
                />
              </div>
              <div className="pr-form-group">
                <label>Costo unitario</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                />
              </div>
            </div>

            <div className="pr-form-group">
              <label>Proveedor</label>
              <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
                <option value="">Sin proveedor</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombreEmpresa}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pr-modal-footer">
            <button type="button" className="pr-btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="pr-btn-submit" disabled={saving}>
              {I.check} {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
