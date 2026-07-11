import { useEffect, useState } from "react";
import { formatLocalDate } from "../lib/dateTime";
import { fmt } from "../lib/formatMoney";
import {
  fetchComprasInsumo,
  registrarMovimientoInsumo,
  type CompraInsumo,
  type InsumoCompleto,
} from "../services/insumosService";
import type { Proveedor } from "../pages/dashboard/types/proveedores.types";

const I = {
  plus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  ),
  history: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1012 3.5" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

type ModoStock = "agregar" | "fijar" | null;

function formatFecha(iso: string) {
  return formatLocalDate(iso, {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

interface Props {
  insumo: InsumoCompleto;
  proveedorNombre?: string;
  proveedores: Proveedor[];
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdated: () => Promise<void> | void;
  onError: (msg: string) => void;
}

export default function InsumoInventarioCard({
  insumo,
  proveedorNombre,
  proveedores,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onUpdated,
  onError,
}: Props) {
  const stock = insumo.cantidad_actual ?? 0;
  const minimo = insumo.stock_minimo ?? 0;
  const costo = insumo.costo_unitario ?? 0;
  const bajo = stock <= minimo;
  const total = stock * costo;
  const barMax = Math.max(minimo * 2, stock, 1);
  const barPct = Math.min(100, Math.round((stock / barMax) * 100));

  const [modo, setModo] = useState<ModoStock>(null);
  const [showHistory, setShowHistory] = useState(true);
  const [openedByPlus, setOpenedByPlus] = useState(false);
  const [compras, setCompras] = useState<CompraInsumo[]>([]);
  const [loadingCompras, setLoadingCompras] = useState(false);
  const [cantidad, setCantidad] = useState("");
  const [proveedorId, setProveedorId] = useState(insumo.proveedor_id ?? "");
  const [costoInput, setCostoInput] = useState(String(costo || ""));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!expanded) {
      setModo(null);
      setFormError("");
      setOpenedByPlus(false);
      return;
    }
    let cancelled = false;
    setLoadingCompras(true);
    fetchComprasInsumo(insumo.id)
      .then((rows) => {
        if (!cancelled) setCompras(rows);
      })
      .catch((err) => {
        if (!cancelled) onError(err instanceof Error ? err.message : "No se pudo cargar el historial");
      })
      .finally(() => {
        if (!cancelled) setLoadingCompras(false);
      });
    return () => {
      cancelled = true;
    };
  }, [expanded, insumo.id, onError]);

  useEffect(() => {
    setProveedorId(insumo.proveedor_id ?? "");
    setCostoInput(String(insumo.costo_unitario ?? 0));
  }, [insumo.proveedor_id, insumo.costo_unitario]);

  const openAgregar = () => {
    // Segundo click en + cierra las opciones que abrió
    if (expanded && openedByPlus) {
      setModo(null);
      setFormError("");
      setCantidad("");
      setOpenedByPlus(false);
      onToggle();
      return;
    }
    if (!expanded) onToggle();
    setOpenedByPlus(true);
    setModo("agregar");
    setCantidad("");
    setCostoInput(String(insumo.costo_unitario ?? 0));
    setProveedorId(insumo.proveedor_id ?? "");
    setFormError("");
    setShowHistory(true);
  };

  const openFijar = () => {
    if (expanded && modo === "fijar") {
      setModo(null);
      setFormError("");
      setCantidad("");
      return;
    }
    if (!expanded) onToggle();
    setModo("fijar");
    setCantidad(String(stock));
    setFormError("");
  };

  const cancelForm = () => {
    setModo(null);
    setFormError("");
    setCantidad("");
  };

  const handleSave = async () => {
    const qty = Number(cantidad);
    if (!Number.isFinite(qty) || qty < 0) {
      setFormError("Ingrese una cantidad válida");
      return;
    }
    if (modo === "agregar" && qty <= 0) {
      setFormError("La cantidad a agregar debe ser mayor a 0");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const payload: {
        tipo: "agregar" | "fijar";
        cantidad: number;
        proveedor_id?: string;
        costo_unitario?: number;
      } = {
        tipo: modo === "fijar" ? "fijar" : "agregar",
        cantidad: qty,
      };

      if (modo === "agregar") {
        if (proveedorId) payload.proveedor_id = proveedorId;
        if (costoInput.trim() !== "") {
          const c = Number(costoInput);
          if (!Number.isFinite(c) || c < 0) {
            setFormError("El costo unitario no es válido");
            setSaving(false);
            return;
          }
          payload.costo_unitario = c;
        }
      }

      const result = await registrarMovimientoInsumo(insumo.id, payload);
      setCompras(result.compras);
      setModo(null);
      setCantidad("");
      await onUpdated();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className={`pr-ins-card${bajo ? " pr-ins-card--bajo" : ""}${expanded ? " pr-ins-card--open" : ""}`}>
      <div className="pr-ins-card-head" onClick={onToggle} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onToggle()}>
        <div className="pr-ins-card-title-wrap">
          <div className="pr-ins-card-title-row">
            <h3 className="pr-ins-card-name">{insumo.nombre}</h3>
            <span className={`pr-ins-badge${bajo ? " pr-ins-badge--bajo" : " pr-ins-badge--ok"}`}>
              {bajo ? "Bajo" : "OK"}
            </span>
          </div>
          <p className="pr-ins-card-prov">{proveedorNombre || "Sin proveedor"}</p>
        </div>
        <div className="pr-ins-card-actions" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="pr-action-btn" title="Agregar stock" onClick={openAgregar}>{I.plus}</button>
          <button type="button" className="pr-action-btn" title="Editar" onClick={onEdit}>{I.edit}</button>
          <button
            type="button"
            className={`pr-action-btn${expanded && showHistory ? " active" : ""}`}
            title="Historial"
            onClick={() => {
              if (!expanded) onToggle();
              setShowHistory((v) => (expanded ? !v : true));
            }}
          >
            {I.history}
          </button>
          <button type="button" className="pr-action-btn danger" title="Eliminar" onClick={onDelete}>{I.trash}</button>
        </div>
      </div>

      <div className="pr-ins-stock-row">
        <span className="pr-ins-stock-qty">{stock} {insumo.unidad}</span>
        <span className="pr-ins-stock-min">Mín: {minimo}</span>
      </div>
      <div className="pr-ins-bar" aria-hidden>
        <div className={`pr-ins-bar-fill${bajo ? " pr-ins-bar-fill--bajo" : ""}`} style={{ width: `${barPct}%` }} />
      </div>
      <div className="pr-ins-money-row">
        <span>Costo unitario: {fmt(costo)}</span>
        <span>Total: {fmt(total)}</span>
      </div>

      {expanded && (
        <div className="pr-ins-card-body">
          {showHistory && (
            <div className="pr-ins-history">
              <div className="pr-ins-history-title">
                {I.clock} Historial de compras
              </div>
              {loadingCompras ? (
                <p className="pr-ins-history-empty">Cargando…</p>
              ) : compras.length === 0 ? (
                <p className="pr-ins-history-empty">Sin movimientos aún</p>
              ) : (
                <ul className="pr-ins-history-list">
                  {compras.map((c) => (
                    <li key={c.id} className="pr-ins-history-item">
                      <div className="pr-ins-history-top">
                        <span>{c.proveedor_nombre || (c.tipo === "fijar" ? "Ajuste de stock" : "Sin proveedor")}</span>
                        <span>{formatFecha(c.created_at)}</span>
                      </div>
                      <div className="pr-ins-history-bot">
                        {c.tipo === "agregar" ? (
                          <>
                            <span>
                              {c.cantidad} {insumo.unidad} x {fmt(c.costo_unitario)}
                            </span>
                            <strong>{fmt(c.total)}</strong>
                          </>
                        ) : (
                          <>
                            <span>
                              Fijado a {c.cantidad_nueva} {insumo.unidad}
                              {c.cantidad_anterior !== c.cantidad_nueva
                                ? ` (antes ${c.cantidad_anterior})`
                                : ""}
                            </span>
                            <strong>—</strong>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {modo && (
            <div className="pr-ins-form">
              <div className="pr-ins-mode-toggle">
                <button
                  type="button"
                  className={`pr-ins-mode-btn${modo === "agregar" ? " active" : ""}`}
                  onClick={() => setModo("agregar")}
                >
                  + Agregar
                </button>
                <button
                  type="button"
                  className={`pr-ins-mode-btn pr-ins-mode-btn--fijar${modo === "fijar" ? " active" : ""}`}
                  onClick={() => {
                    setModo("fijar");
                    setCantidad(String(stock));
                  }}
                >
                  = Fijar
                </button>
              </div>

              {formError && <p className="pr-field-error">{formError}</p>}

              {modo === "agregar" ? (
                <>
                  <label className="pr-ins-field">
                    <span>Cantidad a agregar</span>
                    <input type="number" min={0} step="any" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
                  </label>
                  <label className="pr-ins-field">
                    <span>Seleccionar proveedor (opcional)</span>
                    <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
                      <option value="">Sin cambiar</option>
                      {proveedores.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombreEmpresa}</option>
                      ))}
                    </select>
                  </label>
                  <label className="pr-ins-field">
                    <span>Costo unitario (opcional)</span>
                    <input type="number" min={0} step="any" value={costoInput} onChange={(e) => setCostoInput(e.target.value)} />
                  </label>
                </>
              ) : (
                <label className="pr-ins-field">
                  <span>Nueva cantidad</span>
                  <input type="number" min={0} step="any" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
                </label>
              )}

              <div className="pr-ins-form-actions">
                <button type="button" className="pr-btn-submit" disabled={saving} onClick={handleSave}>
                  {saving ? "Guardando…" : "Guardar"}
                </button>
                <button type="button" className="pr-btn-cancel" disabled={saving} onClick={cancelForm}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {!modo && (
            <div className="pr-ins-quick">
              <button type="button" className="pr-ins-mode-btn active" onClick={openAgregar}>+ Agregar</button>
              <button type="button" className="pr-ins-mode-btn pr-ins-mode-btn--fijar" onClick={openFijar}>= Fijar</button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
