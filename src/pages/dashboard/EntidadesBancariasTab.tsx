

import { useState } from "react";

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

function IconAssign() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}



function IconBtn({ children, onClick, danger }: any) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        border: "1.5px solid",
        borderColor: hover ? (danger ? "#fca5a5" : "#d1d5db") : "#e5e7eb",
        background: hover ? (danger ? "#fff1f2" : "#f9fafb") : "#fff",
        color: hover ? (danger ? "#ef4444" : "#374151") : "#9ca3af",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all .15s"
      }}
    >
      {children}
    </button>
  );
}



function ModalShell({ title, onClose, onSave, saveLabel = "Guardar", canSave = true, children }: any) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.28)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 14,
        padding: "28px 28px 24px",
        width: 460,
        maxWidth: "calc(100vw - 32px)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.14)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111" }}>{title}</h3>
          <button onClick={onClose} style={{
            width: 30,
            height: 30,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#9ca3af",
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6
          }}>×</button>
        </div>

        {children}

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{
            flex: 1,
            padding: "11px 0",
            borderRadius: 9999,
            border: "1.5px solid #e5e7eb",
            background: "#fff",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
            color: "#374151"
          }}>Cancelar</button>
          <button
            onClick={onSave}
            disabled={!canSave}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 9999,
              border: "none",
              background: canSave ? ORANGE : "#fed7aa",
              color: "#fff",
              cursor: canSave ? "pointer" : "default",
              fontSize: 14,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ title, value, onSave, onClose }: any) {
  const [val, setVal] = useState(value);
  const [focused, setFocused] = useState(false);
  
  return (
    <ModalShell
      title={title}
      onClose={onClose}
      onSave={() => val.trim() && onSave(val.trim())}
      canSave={val.trim().length > 0}
    >
      <input
        autoFocus
        value={val}
        onChange={(e: any) => setVal(e.target.value)}
        onKeyDown={(e: any) => e.key === "Enter" && val.trim() && onSave(val.trim())}
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: `1.5px solid ${focused ? ORANGE : "#e5e7eb"}`,
          borderRadius: 8,
          padding: "10px 13px",
          fontSize: 14,
          outline: "none",
          color: "#111",
          background: "#fff",
          transition: "border-color .15s"
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </ModalShell>
  );
}

// ============================================
// DATOS INICIALES
// ============================================

const initialBanks = [
  { id: 1, name: "Bancolombia", active: false },
  { id: 2, name: "Nequi", active: true },
  { id: 3, name: "Daviplata", active: true },
  { id: 4, name: "Davivienda", active: true },
  { id: 5, name: "Banco de Bogotá", active: true },
  { id: 6, name: "BBVA", active: true },
  { id: 7, name: "Efecty", active: true },
  { id: 8, name: "xdsd", active: true },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function EntidadesBancariasTab() {
  const [banks, setBanks] = useState(initialBanks);
  const [input, setInput] = useState("");
  const [editModal, setEditModal] = useState<{ id: number; name: string } | null>(null);
  const [nextId, setNextId] = useState(50);
  const [inputFocused, setInputFocused] = useState(false);

  const activeCount = banks.filter(b => b.active).length;

  function addBank() {
    const name = input.trim();
    if (!name) return;
    setBanks(prev => [...prev, { id: nextId, name, active: true }]);
    setNextId(n => n + 1);
    setInput("");
  }

  function deleteBank(id: number) {
    setBanks(prev => prev.filter(b => b.id !== id));
  }

  function saveEdit(newName: string) {
    if (!editModal) return;
    setBanks(prev => prev.map(b => b.id === editModal.id ? { ...b, name: newName } : b));
    setEditModal(null);
  }

  return (
    <div>
      {/* Summary */}
      <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 20px" }}>
        {activeCount} activas · {banks.length} en total
      </p>

      {/* Add bank card */}
      <div style={{
        background: "#fff",
        borderRadius: 12,
        border: "1.5px solid #f0f0f0",
        boxShadow: "0 1px 6px rgba(0,0,0,.05)",
        padding: "18px 20px",
        marginBottom: 20
      }}>
        <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: "#374151" }}>
          Agregar entidad bancaria
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addBank()}
            placeholder="Ej: Bancolombia, Nequi, Daviplata..."
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            style={{
              flex: 1,
              border: `1.5px solid ${inputFocused ? ORANGE : "#e5e7eb"}`,
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 14,
              outline: "none",
              transition: "border-color .15s"
            }}
          />
          <button
            onClick={addBank}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: ORANGE,
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              boxShadow: "0 2px 8px rgba(249,115,22,.3)",
              whiteSpace: "nowrap"
            }}
          >
            <IconPlus /> Agregar
          </button>
        </div>
      </div>

      {/* Bank list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {banks.map(bank => (
          <div key={bank.id} style={{
            background: "#fff",
            borderRadius: 12,
            border: "1.5px solid #f0f0f0",
            boxShadow: "0 1px 4px rgba(0,0,0,.04)",
            display: "flex",
            alignItems: "center",
            padding: "14px 18px",
            opacity: bank.active ? 1 : 0.65,
          }}>
            {/* Bank icon */}
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: bank.active ? "#EFF6FF" : "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
              flexShrink: 0
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke={bank.active ? "#3B82F6" : "#9ca3af"}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="22" x2="21" y2="22" />
                <line x1="6" y1="18" x2="6" y2="11" />
                <line x1="10" y1="18" x2="10" y2="11" />
                <line x1="14" y1="18" x2="14" y2="11" />
                <line x1="18" y1="18" x2="18" y2="11" />
                <polygon points="12 2 20 7 4 7" />
              </svg>
            </div>

            {/* Name + status */}
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 15, fontWeight: 500, color: "#111" }}>{bank.name}</span>
              {!bank.active && (
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>Inactiva</p>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 4 }}>
              <IconBtn onClick={() => setEditModal({ id: bank.id, name: bank.name })}>
                <IconPencil />
              </IconBtn>
              <IconBtn onClick={() => {}}>
                <IconAssign />
              </IconBtn>
              <IconBtn onClick={() => deleteBank(bank.id)} danger>
                <IconTrash />
              </IconBtn>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editModal && (
        <EditModal
          title="Editar entidad bancaria"
          value={editModal.name}
          onSave={saveEdit}
          onClose={() => setEditModal(null)}
        />
      )}
    </div>
  );
}