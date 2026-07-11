
import { useCallback, useEffect, useState } from "react";
import {
  actualizarMedioPago,
  crearMedioPago,
  eliminarMedioPago,
  fetchMediosPago,
  type MedioPagoApi,
} from "../../services/mediosPagoService";

const ORANGE = "#F97316";

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function IconBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 32, height: 32, borderRadius: 8, border: "1.5px solid",
        borderColor: hover ? (danger ? "#fca5a5" : "#d1d5db") : "#e5e7eb",
        background: hover ? (danger ? "#fff1f2" : "#f9fafb") : "#fff",
        color: hover ? (danger ? "#ef4444" : "#374151") : "#9ca3af",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s",
      }}
    >
      {children}
    </button>
  );
}

function ModalShell({ title, onClose, onSave, saveLabel = "Guardar", canSave = true, children }: any) {
  return (
    <div className="st-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.28)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000 }}>
      <div className="st-modal-panel" style={{ background: "#fff", borderRadius: 14, padding: "28px 28px 24px", width: 460, maxWidth: "calc(100vw - 32px)", boxShadow: "0 12px 40px rgba(0,0,0,0.14)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111" }}>{title}</h3>
          <button onClick={onClose} style={{ width: 30, height: 30, border: "none", background: "transparent", cursor: "pointer", color: "#9ca3af", fontSize: 20 }}>×</button>
        </div>
        {children}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 9999, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#374151" }}>Cancelar</button>
          <button onClick={onSave} disabled={!canSave} style={{ flex: 1, padding: "11px 0", borderRadius: 9999, border: "none", background: canSave ? ORANGE : "#fed7aa", color: "#fff", cursor: canSave ? "pointer" : "default", fontSize: 14, fontWeight: 700 }}>{saveLabel}</button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ title, value, onSave, onClose }: any) {
  const [val, setVal] = useState(value);
  return (
    <ModalShell title={title} onClose={onClose} onSave={() => val.trim() && onSave(val.trim())} canSave={val.trim().length > 0}>
      <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && val.trim() && onSave(val.trim())} style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "10px 13px", fontSize: 14, outline: "none" }} />
    </ModalShell>
  );
}

export default function EntidadesBancariasTab() {
  const [banks, setBanks] = useState<MedioPagoApi[]>([]);
  const [input, setInput] = useState("");
  const [editModal, setEditModal] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBanks(await fetchMediosPago());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar entidades");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeCount = banks.filter((b) => b.activo).length;

  async function addBank() {
    const name = input.trim();
    if (!name) return;
    setError("");
    try {
      await crearMedioPago(name);
      setInput("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al agregar entidad");
    }
  }

  async function deleteBank(id: string) {
    if (!confirm("¿Eliminar esta entidad bancaria?")) return;
    try {
      await eliminarMedioPago(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    }
  }

  async function saveEdit(newName: string) {
    if (!editModal) return;
    try {
      await actualizarMedioPago(editModal.id, { nombre: newName });
      setEditModal(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al editar");
    }
  }

  if (loading) return <p style={{ color: "#6b7280" }}>Cargando entidades bancarias...</p>;

  return (
    <div>
      <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 20px" }}>{activeCount} activas · {banks.length} en total</p>
      {error && <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #f0f0f0", boxShadow: "0 1px 6px rgba(0,0,0,.05)", padding: "18px 20px", marginBottom: 20 }}>
        <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: "#374151" }}>Agregar entidad bancaria</p>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addBank()} placeholder="Ej: Bancolombia, Nequi, Daviplata..." style={{ flex: 1, border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none" }} />
          <button onClick={addBank} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 8, border: "none", background: ORANGE, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap" }}>
            <IconPlus /> Agregar
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {banks.map((bank) => (
          <div key={bank.id} style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #f0f0f0", boxShadow: "0 1px 4px rgba(0,0,0,.04)", display: "flex", alignItems: "center", padding: "14px 18px", opacity: bank.activo ? 1 : 0.65 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: bank.activo ? "#EFF6FF" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 14, flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={bank.activo ? "#3B82F6" : "#9ca3af"} strokeWidth="2"><line x1="3" y1="22" x2="21" y2="22" /><polygon points="12 2 20 7 4 7" /></svg>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 15, fontWeight: 500, color: "#111" }}>{bank.nombre}</span>
              {!bank.activo && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>Inactiva</p>}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <IconBtn onClick={() => setEditModal({ id: bank.id, name: bank.nombre })}><IconPencil /></IconBtn>
              <IconBtn onClick={() => deleteBank(bank.id)} danger><IconTrash /></IconBtn>
            </div>
          </div>
        ))}
      </div>

      {editModal && (
        <EditModal title="Editar entidad bancaria" value={editModal.name} onSave={saveEdit} onClose={() => setEditModal(null)} />
      )}
    </div>
  );
}
