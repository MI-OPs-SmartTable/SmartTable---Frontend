// ============================================
// TAB RESTAURANTE - GESTIÓN DE UBICACIONES Y MESAS
// ============================================

import { useCallback, useEffect, useState } from "react";
import { ubicacionesService } from "../../services/ubicacionesService";
import { mesasService } from "../../services/mesasService";

const ORANGE = "#F97316";
const ORANGE_LIGHT = "#FFF7ED";
const ORANGE_BORDER = "#FDBA74";

const initialLocations: { id: string; name: string; tables: { id: string; name: string }[] }[] = [];



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

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ============================================
// COMPONENTES UI
// ============================================

function StyledInput({ value, onChange, placeholder, autoFocus, onKeyDown }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      autoFocus={autoFocus}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
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
  );
}

function StyledTextarea({ value, onChange, placeholder }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={4}
      style={{
        width: "100%",
        boxSizing: "border-box",
        border: `1.5px solid ${focused ? ORANGE : "#e5e7eb"}`,
        borderRadius: 8,
        padding: "10px 13px",
        fontSize: 14,
        outline: "none",
        resize: "vertical",
        color: "#111",
        background: "#fff",
        fontFamily: "inherit",
        transition: "border-color .15s"
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
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

function NewLocationModal({ onSave, onClose }: any) {
  const [name, setName] = useState("");
  const [tables, setTables] = useState("");

  function handleSave() {
    if (!name.trim()) return;
    const tableNames = tables
      .split(",")
      .map((t: string) => t.trim())
      .filter(Boolean);
    if (tableNames.length === 0) return;
    onSave(name.trim(), tableNames);
  }

  return (
    <ModalShell
      title="Nueva Ubicación"
      onClose={onClose}
      onSave={handleSave}
      saveLabel="Guardar"
      canSave={name.trim().length > 0 && tables.split(",").map((t: string) => t.trim()).filter(Boolean).length > 0}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 7 }}>
            Nombre de la ubicación <span style={{ color: ORANGE }}>*</span>
          </label>
          <StyledInput
            autoFocus
            value={name}
            onChange={(e: any) => setName(e.target.value)}
            placeholder="Ej: Salón Principal, Terraza, Barra"
            onKeyDown={(e: any) => e.key === "Enter" && handleSave()}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 7 }}>
            Mesas <span style={{ color: ORANGE }}>*</span> <span style={{ fontWeight: 400, color: "#9ca3af" }}>(separadas por comas)</span>
          </label>
          <StyledTextarea
            value={tables}
            onChange={(e: any) => setTables(e.target.value)}
            placeholder="Mesa 1, Mesa 2, Mesa 3"
          />
          <p style={{ margin: "7px 0 0", fontSize: 12, color: "#9ca3af" }}>
            Escribe los nombres de las mesas separados por comas
          </p>
        </div>
      </div>
    </ModalShell>
  );
}

function EditModal({ title, value, onSave, onClose }: any) {
  const [val, setVal] = useState(value);
  return (
    <ModalShell
      title={title}
      onClose={onClose}
      onSave={() => val.trim() && onSave(val.trim())}
      canSave={val.trim().length > 0}
    >
      <StyledInput
        autoFocus
        value={val}
        onChange={(e: any) => setVal(e.target.value)}
        onKeyDown={(e: any) => e.key === "Enter" && val.trim() && onSave(val.trim())}
      />
    </ModalShell>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function RestauranteTab() {
  const [locations, setLocations] = useState(initialLocations);
  const [modal, setModal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLocations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ubi, mesas] = await Promise.all([
        ubicacionesService.getAll() as Promise<{ id: string; nombre: string }[]>,
        mesasService.getAll() as Promise<{ id: string; ubicacion_id: string; nombre: string }[]>,
      ]);
      setLocations(
        ubi.map((u) => ({
          id: u.id,
          name: u.nombre,
          tables: mesas.filter((m) => m.ubicacion_id === u.id).map((m) => ({ id: m.id, name: m.nombre })),
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar ubicaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const totalTables = locations.reduce((s, l) => s + l.tables.length, 0);

  function openModal(config: any) { setModal(config); }
  function closeModal() { setModal(null); }

  async function handleSave(newVal: string) {
    const { type, locationId, tableId } = modal;
    setError("");
    try {
      if (type === "editLocation") {
        await ubicacionesService.update(locationId, { nombre: newVal });
      } else if (type === "editTable") {
        await mesasService.update(tableId, { nombre: newVal });
      } else if (type === "addTable") {
        await mesasService.create({ ubicacion_id: locationId, nombre: newVal });
      }
      await loadLocations();
      closeModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    }
  }

  async function handleAddLocation(name: string, tableNames: string[]) {
    if (tableNames.length === 0) {
      setError("Debes agregar al menos una mesa");
      return;
    }
    setError("");
    try {
      const ubicacion = await ubicacionesService.create({ nombre: name }) as { id: string };
      for (const tableName of tableNames) {
        await mesasService.create({ ubicacion_id: ubicacion.id, nombre: tableName });
      }
      await loadLocations();
      closeModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear ubicación");
    }
  }

  async function deleteLocation(locationId: string) {
    if (!confirm("¿Eliminar esta ubicación y todas sus mesas?")) return;
    setError("");
    try {
      const loc = locations.find((l) => l.id === locationId);
      if (loc) {
        for (const table of loc.tables) {
          await mesasService.delete(table.id);
        }
      }
      await ubicacionesService.delete(locationId);
      await loadLocations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar ubicación");
    }
  }

  async function deleteTable(_locationId: string, tableId: string) {
    if (!confirm("¿Eliminar esta mesa?")) return;
    setError("");
    try {
      await mesasService.delete(tableId);
      await loadLocations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar mesa");
    }
  }

  if (loading) {
    return <p style={{ color: "#6b7280" }}>Cargando restaurante...</p>;
  }

  return (
    <div>
      {error && <p style={{ color: "#c0392b", fontSize: 14, marginBottom: 16 }}>{error}</p>}
      {/* Summary bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <span style={{ fontSize: 14, color: "#6b7280" }}>
          {locations.length} ubicaciones · {totalTables} mesas totales
        </span>
        <button
          onClick={() => openModal({ type: "addLocation", value: "", title: "Nueva Ubicación" })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 18px",
            borderRadius: 9999,
            background: ORANGE,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            boxShadow: "0 2px 8px rgba(249,115,22,.35)"
          }}
        >
          <IconPlus /> Nueva Ubicación
        </button>
      </div>

      {/* Location cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {locations.map((loc: any) => (
          <div key={loc.id} style={{
            background: "#fff",
            borderRadius: 14,
            border: "1.5px solid #f0f0f0",
            boxShadow: "0 1px 6px rgba(0,0,0,.05)"
          }}>
            {/* Location header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 20px 14px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 17, color: "#111" }}>{loc.name}</span>
                <span style={{
                  background: "#f3f4f6",
                  color: "#6b7280",
                  borderRadius: 9999,
                  padding: "2px 10px",
                  fontSize: 12,
                  fontWeight: 500
                }}>{loc.tables.length} mesas</span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <IconBtn onClick={() => openModal({ type: "editLocation", locationId: loc.id, value: loc.name, title: "Editar ubicación" })}>
                  <IconPencil />
                </IconBtn>
                <IconBtn onClick={() => deleteLocation(loc.id)} danger>
                  <IconTrash />
                </IconBtn>
              </div>
            </div>

            {/* Tables */}
            <div style={{ borderTop: "1px solid #f3f4f6" }}>
              {loc.tables.map((table: any, i: number) => (
                <div key={table.id} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "13px 20px",
                  borderBottom: i < loc.tables.length - 1 ? "1px solid #f9fafb" : "none",
                }}>
                  <span style={{ fontSize: 14, color: "#374151" }}>{table.name}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <IconBtn onClick={() => openModal({ type: "editTable", locationId: loc.id, tableId: table.id, value: table.name, title: "Editar mesa" })}>
                      <IconPencil />
                    </IconBtn>
                    <IconBtn onClick={() => deleteTable(loc.id, table.id)} danger>
                      <IconTrash />
                    </IconBtn>
                  </div>
                </div>
              ))}
            </div>

            {/* Add table */}
            <button
              onClick={() => openModal({
                type: "addTable",
                locationId: loc.id,
                value: `Mesa ${totalTables + 1}`,
                title: "Agregar mesa"
              })}
              style={{
                width: "100%",
                padding: "13px",
                border: "none",
                borderTop: loc.tables.length ? "1px solid #f3f4f6" : "none",
                background: "transparent",
                cursor: "pointer",
                color: ORANGE,
                fontSize: 14,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                borderRadius: "0 0 14px 14px",
                outline: `1.5px dashed ${ORANGE_BORDER}`,
                outlineOffset: -1,
                transition: "background .15s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ORANGE_LIGHT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <IconPlus /> Agregar mesa
            </button>
          </div>
        ))}
      </div>

      {/* Modales */}
      {modal && modal.type === "addLocation" && (
        <NewLocationModal onSave={handleAddLocation} onClose={closeModal} />
      )}
      {modal && modal.type !== "addLocation" && (
        <EditModal
          title={modal.title}
          value={modal.value}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
}