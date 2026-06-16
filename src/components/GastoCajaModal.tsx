import { useState } from "react";

interface Props {
  onClose: () => void;
  onGuardar: (payload: { monto: number; descripcion: string; categoria: string }) => Promise<void>;
}

export default function GastoCajaModal({ onClose, onGuardar }: Props) {
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("Operativo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseInt(monto.replace(/\D/g, ""), 10);
    if (!valor || !descripcion.trim()) {
      setError("Monto y descripción son obligatorios");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onGuardar({ monto: valor, descripcion: descripcion.trim(), categoria });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar gasto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="caja-modal-overlay">
      <div className="caja-modal">
        <div className="caja-modal-header">
          <div className="caja-modal-title">Registrar gasto</div>
          <button type="button" className="caja-modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="caja-modal-body">
            {error && <p style={{ color: "var(--err)", fontSize: 13 }}>{error}</p>}
            <div className="caja-modal-field">
              <label>Categoría</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="Operativo">Operativo</option>
                <option value="Insumos">Insumos</option>
                <option value="Servicios">Servicios</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="caja-modal-field">
              <label>Descripción</label>
              <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>
            <div className="caja-modal-field">
              <label>Monto (COP)</label>
              <input
                value={monto}
                onChange={(e) => setMonto(e.target.value.replace(/\D/g, ""))}
                placeholder="50000"
              />
            </div>
          </div>
          <div className="caja-modal-acts">
            <button type="button" className="caja-btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="caja-btn-submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar gasto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
