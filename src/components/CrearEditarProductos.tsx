// ============================================
// CREAR/EDITAR PRODUCTO
// ============================================

import { useState, useRef, useEffect } from "react";
import type { Categoria, Insumo, Producto } from "../pages/dashboard/types/productos.types";
import type { FormState, FormErrors } from "../pages/dashboard/types/productos.types";
const I = {
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  tag: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  alert: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  save: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
};

const FORM_EMPTY: FormState = {
  nombre: "", descripcion: "", precio: "", categoriaId: "", activo: true, insumos: [],
};

interface ProductModalProps {
  editTarget: Producto | null;
  productos: Producto[];
  categorias: Categoria[];
  insumos: Insumo[];
  onClose: () => void;
  onSave: (p: Producto) => void;
}

export default function ProductModal({ editTarget, productos, categorias, insumos, onClose, onSave }: ProductModalProps) {
  const isEdit = !!editTarget;

  const [form, setForm] = useState<FormState>(() =>
    editTarget
      ? { nombre: editTarget.nombre, descripcion: editTarget.descripcion, precio: String(editTarget.precio), categoriaId: editTarget.categoriaId, activo: editTarget.activo, insumos: [...editTarget.insumos] }
      : FORM_EMPTY
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<"dup" | "ok" | null>(null);
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

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio";
    if (!form.precio || isNaN(Number(form.precio)) || Number(form.precio) <= 0)
      e.precio = "Ingresa un precio válido mayor a 0";
    if (!form.categoriaId) e.categoriaId = "Selecciona una categoría";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    setBanner(null);
    if (!validate()) return;

    const dup = productos.find(p => p.nombre.trim().toLowerCase() === form.nombre.trim().toLowerCase() && p.id !== editTarget?.id);
    if (dup) { setBanner("dup"); return; }

    setSaving(true);
    await new Promise(r => setTimeout(r, 900));

    const cat = categorias.find(c => c.id === form.categoriaId);
    const saved: Producto = {
      id: editTarget?.id ?? `p${Date.now()}`,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio: Number(form.precio),
      categoriaId: form.categoriaId,
      activo: form.activo,
      insumos: form.insumos,
      emoji: editTarget?.emoji ?? cat?.emoji ?? "📦",
    };

    setSaving(false);
    setBanner("ok");
    setTimeout(() => { onSave(saved); onClose(); }, 600);
  };

  return (
    <div className="pr-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pr-modal">
        <div className="pr-modal-header">
          <div className="pr-modal-title">{isEdit ? "Editar producto" : "Nuevo producto"}</div>
          <button className="pr-modal-close" onClick={onClose}>{I.close}</button>
        </div>

        <div className="pr-modal-body">
          {banner === "dup" && <div className="pr-dup-banner">{I.alert} Ya existe un producto con ese nombre.</div>}
          {banner === "ok" && <div className="pr-ok-banner">{I.check} Producto guardado correctamente.</div>}

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
            <div className="pr-insumos-list">
              {insumos.map(ins => (
                <div key={ins.id} className="pr-insumo-row">
                  <span className="pr-insumo-name">{ins.nombre}<span className="pr-insumo-unit">({ins.unidad})</span></span>
                  <input className="pr-insumo-qty" type="number" min="0" step="0.01" value={getQty(ins.id) || ""} placeholder="0" onChange={e => setInsumoQty(ins.id, parseFloat(e.target.value) || 0)} />
                </div>
              ))}
            </div>
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