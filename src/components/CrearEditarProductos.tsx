// ============================================
// CREAR/EDITAR PRODUCTO
// ============================================

import { useState, useRef, useEffect, useMemo } from "react";
import type { Categoria, Insumo, Producto } from "../pages/dashboard/types/productos.types";
import type { FormState, FormErrors } from "../pages/dashboard/types/productos.types";
import IconPicker, { DEFAULT_PRODUCT_ICON } from "./IconPicker";

const I = {
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  tag: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  alert: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  save: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

const FORM_EMPTY: FormState = {
  nombre: "",
  descripcion: "",
  precio: "",
  categoriaId: "",
  activo: true,
  insumos: [],
  emoji: DEFAULT_PRODUCT_ICON,
};

interface ProductModalProps {
  editTarget: Producto | null;
  productos: Producto[];
  categorias: Categoria[];
  insumos: Insumo[];
  onClose: () => void;
  onSave: (p: Producto) => Promise<void>;
}

export default function ProductModal({ editTarget, productos, categorias, insumos, onClose, onSave }: ProductModalProps) {
  const isEdit = !!editTarget;

  const [form, setForm] = useState<FormState>(() =>
    editTarget
      ? {
          nombre: editTarget.nombre,
          descripcion: editTarget.descripcion,
          precio: String(editTarget.precio),
          categoriaId: editTarget.categoriaId,
          activo: editTarget.activo,
          insumos: [...editTarget.insumos],
          emoji: editTarget.emoji || DEFAULT_PRODUCT_ICON,
        }
      : FORM_EMPTY
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<"dup" | "ok" | null>(null);
  const [insumoSearch, setInsumoSearch] = useState("");
  const nombreRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nombreRef.current?.focus(); }, []);

  const setInsumoQty = (id: string, qty: number) => {
    setForm(f => {
      const existing = f.insumos.find(x => x.insumoId === id);
      if (qty <= 0) return { ...f, insumos: f.insumos.filter(x => x.insumoId !== id) };
      if (existing) return { ...f, insumos: f.insumos.map(x => x.insumoId === id ? { ...x, cantidad: qty } : x) };
      return { ...f, insumos: [...f.insumos, { insumoId: id, cantidad: qty }] };
    });
  };

  const getQty = (id: string) => form.insumos.find(x => x.insumoId === id)?.cantidad ?? 0;

  const filteredInsumos = useMemo(() => {
    const q = insumoSearch.trim().toLowerCase();
    if (!q) return insumos;
    return insumos.filter(ins => ins.nombre.toLowerCase().includes(q));
  }, [insumos, insumoSearch]);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio";
    if (!form.precio || isNaN(Number(form.precio)) || Number(form.precio) < 0)
      e.precio = "Ingresa un precio válido (0 o mayor)";
    if (!form.categoriaId) e.categoriaId = "Selecciona una categoría";
    if (form.insumos.length === 0) e.insumos = "Agrega al menos un insumo con cantidad";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    setBanner(null);
    if (!validate()) return;

    const dup = productos.find(
      (p) =>
        p.nombre.trim().toLowerCase() === form.nombre.trim().toLowerCase() &&
        p.id !== editTarget?.id
    );
    if (dup) {
      setBanner("dup");
      return;
    }

    setSaving(true);
    const saved: Producto = {
      id: editTarget?.id ?? "",
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio: Number(form.precio),
      categoriaId: form.categoriaId,
      activo: form.activo,
      insumos: form.insumos,
      emoji: form.emoji || DEFAULT_PRODUCT_ICON,
    };

    try {
      await onSave(saved);
      onClose();
    } catch (err) {
      setBanner(null);
      setErrors({
        nombre: err instanceof Error ? err.message : "Error al guardar producto",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pr-overlay">
      <div className="pr-modal">
        <div className="pr-modal-header">
          <div className="pr-modal-title">{isEdit ? "Editar producto" : "Nuevo producto"}</div>
          <button className="pr-modal-close" onClick={onClose}>{I.close}</button>
        </div>

        <div className="pr-modal-body">
          {banner === "dup" && <div className="pr-dup-banner">{I.alert} Ya existe un producto con ese nombre.</div>}
          {banner === "ok" && <div className="pr-ok-banner">{I.check} Producto guardado correctamente.</div>}

          <IconPicker
            value={form.emoji}
            onChange={(emoji) => setForm((f) => ({ ...f, emoji }))}
            label="Ícono del producto"
          />

          <div className="pr-field">
            <label className="pr-label">Nombre <span>*</span></label>
            <input ref={nombreRef} className={`pr-input${errors.nombre ? " err" : ""}`} placeholder="Nombre del producto" value={form.nombre} onChange={e => { setForm(f => ({...f, nombre: e.target.value})); setErrors(v=>({...v,nombre:undefined})); }} />
            {errors.nombre && <div className="pr-field-err">{I.alert}{errors.nombre}</div>}
          </div>

          <div className="pr-field-row">
            <div>
              <label className="pr-label">Precio <span>*</span></label>
              <input className={`pr-input${errors.precio ? " err" : ""}`} type="number" min="0" placeholder="0" value={form.precio} onChange={e => { setForm(f => ({...f, precio: e.target.value})); setErrors(v=>({...v,precio:undefined})); }} />
              {errors.precio && <div className="pr-field-err">{I.alert}{errors.precio}</div>}
            </div>
            <div>
              <label className="pr-label">Categoría <span>*</span></label>
              <select className={`pr-input pr-select${errors.categoriaId ? " err" : ""}`} value={form.categoriaId} onChange={e => { setForm(f => ({...f, categoriaId: e.target.value})); setErrors(v=>({...v,categoriaId:undefined})); }}>
                <option value="">Seleccionar...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>)}
              </select>
              {errors.categoriaId && <div className="pr-field-err">{I.alert}{errors.categoriaId}</div>}
            </div>
          </div>

          <div className="pr-field">
            <label className="pr-label">Descripción</label>
            <textarea className="pr-textarea" placeholder="Descripción corta" value={form.descripcion} onChange={e => setForm(f => ({...f, descripcion: e.target.value}))} />
          </div>

          <div className="pr-field">
            <div className="pr-insumos-title">{I.tag} Insumos (ingredientes)</div>
            <div className="pr-search-wrap pr-insumos-search-wrap">
              <span className="pr-search-icon">{I.search}</span>
              <input
                className="pr-search"
                placeholder="Buscar insumo..."
                value={insumoSearch}
                onChange={e => setInsumoSearch(e.target.value)}
              />
            </div>
            <div className="pr-insumos-list">
              {filteredInsumos.length === 0 && (
                <div className="pr-insumos-empty">No se encontraron insumos que coincidan con "{insumoSearch}"</div>
              )}
              {filteredInsumos.map(ins => (
                <div key={ins.id} className="pr-insumo-row">
                  <span className="pr-insumo-name">{ins.nombre}<span className="pr-insumo-unit">({ins.unidad})</span></span>
                  <input className="pr-insumo-qty" type="number" min="0" step="0.01" value={getQty(ins.id) || ""} placeholder="0" onChange={e => { setInsumoQty(ins.id, parseFloat(e.target.value) || 0); setErrors(v => ({ ...v, insumos: undefined })); }} />
                </div>
              ))}
            </div>
            {errors.insumos && <div className="pr-field-err">{I.alert}{errors.insumos}</div>}
          </div>

          <label className="pr-check-row">
            <input type="checkbox" className="pr-checkbox" checked={form.activo} onChange={e => setForm(f => ({...f, activo: e.target.checked}))} />
            Producto activo
          </label>
        </div>

        <div className="pr-modal-footer">
          <button className="pr-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="pr-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? <><div className="pr-spin"/>&nbsp;Guardando…</> : <>{I.save}&nbsp;Guardar</>}
          </button>
        </div>
      </div>
    </div>
  );
}