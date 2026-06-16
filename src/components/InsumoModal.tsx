import { useState } from "react";
import type { InsumoCompleto } from "../services/insumosService";

const UNIDADES = ["unidad", "porción", "gramos", "kg", "ml", "litro", "tajada"];

const I = {
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

interface Props {
  editTarget: InsumoCompleto | null;
  onClose: () => void;
  onSave: (data: { nombre: string; unidad: string; cantidad_actual?: number; stock_minimo?: number }) => Promise<void>;
}

export default function InsumoModal({ editTarget, onClose, onSave }: Props) {
  const [nombre, setNombre] = useState(editTarget?.nombre ?? "");
  const [unidad, setUnidad] = useState(editTarget?.unidad ?? "unidad");
  const [stock, setStock] = useState(String(editTarget?.cantidad_actual ?? 100));
  const [stockMin, setStockMin] = useState(String(editTarget?.stock_minimo ?? 10));
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
    setSaving(true);
    setError("");
    try {
      await onSave({
        nombre: nombre.trim(),
        unidad: unidad.trim(),
        cantidad_actual: Number(stock) || 0,
        stock_minimo: Number(stockMin) || 0,
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
          <div className="pr-modal-title">{editTarget ? "Editar insumo" : "Nuevo insumo"}</div>
          <button type="button" className="pr-modal-close" onClick={onClose}>{I.close}</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="pr-modal-body">
            {error && <p className="pr-field-error">{error}</p>}
            <div className="pr-form-group">
              <label>Nombre</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Pan de hamburguesa" autoFocus />
            </div>
            <div className="pr-form-group">
              <label>Unidad de medida</label>
              <select value={unidad} onChange={(e) => setUnidad(e.target.value)}>
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <input
                style={{ marginTop: 8 }}
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                placeholder="O escriba otra unidad"
              />
            </div>
            <div className="pr-field-row">
              <div className="pr-form-group">
                <label>Stock actual</label>
                <input type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} />
              </div>
              <div className="pr-form-group">
                <label>Stock mínimo</label>
                <input type="number" min={0} value={stockMin} onChange={(e) => setStockMin(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="pr-modal-footer">
            <button type="button" className="pr-btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="pr-btn-submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
