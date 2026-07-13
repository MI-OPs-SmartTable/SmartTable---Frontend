import { useEffect, useMemo, useState } from "react";
import type { InsumoCompleto } from "../services/insumosService";
import type { NuevoProveedorForm, Proveedor } from "../pages/dashboard/types/proveedores.types";
import { emptyForm } from "../pages/dashboard/types/proveedores.types";
import {
  actualizarProveedor,
  crearProveedor,
  eliminarProveedor,
} from "../services/proveedoresService";

const I = {
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  truck: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  phone: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>,
  mail: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  map: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  package: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.89 1.45l8 4A2 2 0 0122 7.24v9.53a2 2 0 01-1.11 1.79l-8 4a2 2 0 01-1.79 0l-8-4a2 2 0 01-1.1-1.8V7.24a2 2 0 011.11-1.79l8-4a2 2 0 011.78 0z"/><polyline points="2.32 6.16 12 11 21.68 6.16"/><line x1="12" y1="22.76" x2="12" y2="11"/><line x1="7" y1="3.5" x2="17" y2="8.5"/></svg>,
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

type Props = {
  proveedores: Proveedor[];
  insumos: InsumoCompleto[];
  onChanged: () => Promise<void>;
  abrirModal: boolean;
  setAbrirModal: (value: boolean) => void;
  onError: (message: string) => void;
};

function ProveedorCard({
  proveedor,
  insumosNombres,
  onEditar,
  onEliminar,
}: {
  proveedor: Proveedor;
  insumosNombres: string[];
  onEditar: (id: string) => void;
  onEliminar: (id: string) => void;
}) {
  const maxVisible = 4;
  const visibles = insumosNombres.slice(0, maxVisible);
  const restantes = insumosNombres.length - visibles.length;

  return (
    <div className="pr-card">
      <div className="pr-card-header">
        <div className="pr-card-info">
          <div className="pr-card-icon">{I.truck}</div>
          <div>
            <div className="pr-card-title">{proveedor.nombreEmpresa}</div>
            <div className="pr-card-sub">{proveedor.contacto || "Sin contacto"}</div>
          </div>
        </div>
        <div className="pr-actions">
          <button type="button" className="pr-action-btn" onClick={() => onEditar(proveedor.id)} title="Editar">
            {I.edit}
          </button>
          <button type="button" className="pr-action-btn danger" onClick={() => onEliminar(proveedor.id)} title="Eliminar">
            {I.trash}
          </button>
        </div>
      </div>

      <div className="pr-card-body">
        <div className="pr-card-detail">{I.phone} <span>{proveedor.telefono || "—"}</span></div>
        <div className="pr-card-detail">{I.mail} <span>{proveedor.email || "—"}</span></div>
        <div className="pr-card-detail">{I.map} <span>{proveedor.direccion || "—"}</span></div>
      </div>

      <div className="pr-card-divider">
        <div className="pr-card-insumos-header">
          {I.package}
          <span>{insumosNombres.length} insumo(s) vinculados</span>
        </div>
        {insumosNombres.length > 0 ? (
          <div className="pr-card-tags">
            {visibles.map((nombre) => (
              <span key={nombre} className="pr-tag">{nombre}</span>
            ))}
            {restantes > 0 && <span className="pr-tag-more">+{restantes} más</span>}
          </div>
        ) : (
          <div className="pr-card-text" style={{ color: "#9ca3af" }}>Sin insumos asignados</div>
        )}
      </div>
    </div>
  );
}

function ProveedorModal({
  onCerrar,
  onGuardar,
  editTarget,
}: {
  onCerrar: () => void;
  onGuardar: (form: NuevoProveedorForm) => Promise<void>;
  editTarget?: Proveedor | null;
}) {
  const [form, setForm] = useState<NuevoProveedorForm>(() => {
    if (editTarget) {
      return {
        nombreEmpresa: editTarget.nombreEmpresa,
        contacto: editTarget.contacto,
        telefono: editTarget.telefono,
        email: editTarget.email,
        direccion: editTarget.direccion,
      };
    }
    return emptyForm;
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const actualizarCampo = (campo: keyof NuevoProveedorForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));
  };

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombreEmpresa.trim()) {
      setError("El nombre de la empresa es obligatorio.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onGuardar(form);
      onCerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar proveedor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pr-overlay">
      <div className="pr-modal">
        <div className="pr-modal-header">
          <div className="pr-modal-title">{editTarget ? "Editar Proveedor" : "Nuevo Proveedor"}</div>
          <button type="button" className="pr-modal-close" onClick={onCerrar}>{I.close}</button>
        </div>
        <form onSubmit={manejarSubmit}>
          <div className="pr-modal-body">
            {error && <p className="pr-field-error">{error}</p>}

            <div className="pr-form-group">
              <label>Nombre de la empresa <span className="pr-required">*</span></label>
              <input
                type="text"
                value={form.nombreEmpresa}
                onChange={actualizarCampo("nombreEmpresa")}
                placeholder="Nombre del proveedor"
                autoFocus
              />
            </div>

            <div className="pr-form-group">
              <label>Persona de contacto</label>
              <input
                type="text"
                value={form.contacto}
                onChange={actualizarCampo("contacto")}
                placeholder="Nombre del contacto"
              />
            </div>

            <div className="pr-field-row">
              <div className="pr-form-group">
                <label>Teléfono</label>
                <input type="tel" value={form.telefono} onChange={actualizarCampo("telefono")} placeholder="3201234567" />
              </div>
              <div className="pr-form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={actualizarCampo("email")} placeholder="contacto@proveedor.com" />
              </div>
            </div>

            <div className="pr-form-group">
              <label>Dirección</label>
              <input type="text" value={form.direccion} onChange={actualizarCampo("direccion")} placeholder="Dirección del proveedor" />
            </div>
          </div>

          <div className="pr-modal-footer">
            <button type="button" className="pr-btn-cancel" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="pr-btn-submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProveedoresTab({
  proveedores,
  insumos,
  onChanged,
  abrirModal,
  setAbrirModal,
  onError,
}: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState<Proveedor | null>(null);

  useEffect(() => {
    if (abrirModal) {
      setModalAbierto(true);
      setProveedorEditando(null);
      setAbrirModal(false);
    }
  }, [abrirModal, setAbrirModal]);

  const insumosPorProveedor = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const ins of insumos) {
      if (!ins.proveedor_id) continue;
      if (!map[ins.proveedor_id]) map[ins.proveedor_id] = [];
      map[ins.proveedor_id].push(ins.nombre);
    }
    return map;
  }, [insumos]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return proveedores;
    return proveedores.filter((p) => {
      const metaMatch =
        p.nombreEmpresa.toLowerCase().includes(q) ||
        p.contacto.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.telefono.toLowerCase().includes(q) ||
        p.direccion.toLowerCase().includes(q);
      const insumosMatch = (insumosPorProveedor[p.id] || []).some((n) => n.toLowerCase().includes(q));
      return metaMatch || insumosMatch;
    });
  }, [proveedores, busqueda, insumosPorProveedor]);

  const handleCrear = async (form: NuevoProveedorForm) => {
    await crearProveedor(form);
    await onChanged();
  };

  const handleEditar = async (form: NuevoProveedorForm) => {
    if (!proveedorEditando) return;
    await actualizarProveedor(proveedorEditando.id, form);
    await onChanged();
  };

  const handleEliminar = async (id: string) => {
    try {
      await eliminarProveedor(id);
      await onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error al eliminar proveedor");
    }
  };

  return (
    <div className="proveedores-container">
      <div className="proveedores-search">
        {I.search}
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar proveedor o insumo..."
        />
      </div>

      {filtrados.length === 0 ? (
        <div className="proveedores-empty">
          {busqueda ? `No se encontraron proveedores para "${busqueda}".` : "No hay proveedores. Crea el primero."}
        </div>
      ) : (
        <div className="proveedores-grid">
          {filtrados.map((proveedor) => (
            <ProveedorCard
              key={proveedor.id}
              proveedor={proveedor}
              insumosNombres={insumosPorProveedor[proveedor.id] || []}
              onEditar={(id) => {
                const found = proveedores.find((p) => p.id === id) || null;
                setProveedorEditando(found);
                setModalAbierto(true);
              }}
              onEliminar={handleEliminar}
            />
          ))}
        </div>
      )}

      {modalAbierto && (
        <ProveedorModal
          onCerrar={() => {
            setModalAbierto(false);
            setProveedorEditando(null);
          }}
          onGuardar={proveedorEditando ? handleEditar : handleCrear}
          editTarget={proveedorEditando}
        />
      )}
    </div>
  );
}
