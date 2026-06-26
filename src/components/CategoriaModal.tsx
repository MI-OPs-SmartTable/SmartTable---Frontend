import { useState } from "react";
import type { Categoria } from "../pages/dashboard/types/productos.types";

const I = {
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

interface Props {
  editTarget: Categoria | null;
  onClose: () => void;
  onSave: (nombre: string) => Promise<void>;
}

export default function CategoriaModal({ editTarget, onClose, onSave }: Props) {
  const [nombre, setNombre] = useState(editTarget?.nombre ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(nombre.trim());
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
          <div className="pr-modal-title">{editTarget ? "Editar categoría" : "Nueva categoría"}</div>
          <button type="button" className="pr-modal-close" onClick={onClose}>{I.close}</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="pr-modal-body">
            {error && <p className="pr-field-error">{error}</p>}
            <div className="pr-form-group">
              <label>Nombre</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Bebidas"
                autoFocus
              />
            </div>
            <p style={{ fontSize: 12, color: "var(--ash)" }}>
              El color y emoji se asignan automáticamente según el nombre.
            </p>
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
