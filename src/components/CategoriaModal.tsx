import { useState } from "react";
import type { Categoria } from "../pages/dashboard/types/productos.types";
import IconPicker, { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from "./IconPicker";

const I = {
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

interface Props {
  editTarget: Categoria | null;
  onClose: () => void;
  onSave: (nombre: string, emoji: string) => Promise<void>;
}

export default function CategoriaModal({ editTarget, onClose, onSave }: Props) {
  const [nombre, setNombre] = useState(editTarget?.nombre ?? "");
  const [emoji, setEmoji] = useState(editTarget?.emoji || DEFAULT_CATEGORY_ICON);
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
      await onSave(nombre.trim(), emoji);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pr-overlay">
      <div className="pr-modal">
        <div className="pr-modal-header">
          <div className="pr-modal-title">{editTarget ? "Editar categoría" : "Nueva categoría"}</div>
          <button type="button" className="pr-modal-close" onClick={onClose}>{I.close}</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="pr-modal-body">
            {error && <p className="pr-field-error">{error}</p>}
            <IconPicker value={emoji} onChange={setEmoji} icons={CATEGORY_ICONS} label="Ícono de categoría" />
            <div className="pr-form-group">
              <label>Nombre</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Bebidas"
                autoFocus
              />
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
