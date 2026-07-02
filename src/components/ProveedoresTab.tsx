import React, { useState, useEffect } from "react";
import type { Proveedor }  from "../pages/dashboard/types/proveedores.types";
import { 
  eliminarProveedor,
  filtrarProveedores,
  crearProveedor,
  type NuevoProveedorForm,
  emptyForm
} from "../pages/dashboard/types/proveedores.types";

// Icons
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

interface ProveedoresTabProps {
  proveedores: Proveedor[];
  setProveedores: React.Dispatch<React.SetStateAction<Proveedor[]>>;
  abrirModal: boolean;
  setAbrirModal: (value: boolean) => void;
}

// Componente Tarjeta
const ProveedorCard: React.FC<{
  proveedor: Proveedor;
  onEditar: (id: string) => void;
  onEliminar: (id: string) => void;
}> = ({ proveedor, onEditar, onEliminar }) => {
  const maxVisible = 4;
  const visibles = proveedor.insumos.slice(0, maxVisible);
  const restantes = proveedor.insumos.length - visibles.length;

  return (
    <div className="pr-card">
      <div className="pr-card-header">
        <div className="pr-card-info">
          <div className="pr-card-icon">{I.truck}</div>
          <div>
            <div className="pr-card-title">{proveedor.nombreEmpresa}</div>
            <div className="pr-card-sub">{proveedor.contacto}</div>
          </div>
        </div>
        <div className="pr-actions">
          <button className="pr-action-btn" onClick={() => onEditar(proveedor.id)} title="Editar">
            {I.edit}
          </button>
          <button className="pr-action-btn danger" onClick={() => onEliminar(proveedor.id)} title="Eliminar">
            {I.trash}
          </button>
        </div>
      </div>

      <div className="pr-card-body">
        <div className="pr-card-detail">{I.phone} <span>{proveedor.telefono}</span></div>
        <div className="pr-card-detail">{I.mail} <span>{proveedor.email}</span></div>
        <div className="pr-card-detail">{I.map} <span>{proveedor.direccion}</span></div>
      </div>

      <div className="pr-card-divider">
        <div className="pr-card-label">Productos que provee:</div>
        <div className="pr-card-text">{proveedor.productos}</div>
      </div>

      <div className="pr-card-divider">
        <div className="pr-card-insumos-header">
          {I.package}
          <span>{proveedor.insumos.length} insumo(s) en inventario</span>
        </div>
        <div className="pr-card-tags">
          {visibles.map((insumo: string) => (
            <span key={insumo} className="pr-tag">{insumo}</span>
          ))}
          {restantes > 0 && <span className="pr-tag-more">+{restantes} más</span>}
        </div>
      </div>
    </div>
  );
};

// Componente Modal de Proveedor (reutilizable para crear y editar)
const ProveedorModal: React.FC<{
  onCerrar: () => void;
  onGuardar: (form: NuevoProveedorForm) => void;
  editTarget?: Proveedor | null;
}> = ({ onCerrar, onGuardar, editTarget }) => {
  const [form, setForm] = useState<NuevoProveedorForm>(() => {
    if (editTarget) {
      return {
        nombreEmpresa: editTarget.nombreEmpresa,
        contacto: editTarget.contacto,
        telefono: editTarget.telefono,
        email: editTarget.email,
        direccion: editTarget.direccion,
        productos: editTarget.productos,
      };
    }
    return emptyForm;
  });
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const actualizarCampo = (campo: keyof NuevoProveedorForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    setForm((prev) => ({ ...prev, [campo]: e.target.value }));
  };

  const manejarSubmit = async (e: React.FormEvent): Promise<void> => {
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
    <div className="pr-overlay" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="pr-modal">
        <div className="pr-modal-header">
          <div className="pr-modal-title">{editTarget ? "Editar Proveedor" : "Nuevo Proveedor"}</div>
          <button type="button" className="pr-modal-close" onClick={onCerrar}>
            {I.close}
          </button>
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
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={actualizarCampo("telefono")}
                  placeholder="3201234567"
                />
              </div>
              <div className="pr-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={actualizarCampo("email")}
                  placeholder="contacto@proveedor.com"
                />
              </div>
            </div>

            <div className="pr-form-group">
              <label>Dirección</label>
              <input
                type="text"
                value={form.direccion}
                onChange={actualizarCampo("direccion")}
                placeholder="Dirección del proveedor"
              />
            </div>

            <div className="pr-form-group">
              <label>Productos / Insumos que provee</label>
              <textarea
                value={form.productos}
                onChange={actualizarCampo("productos")}
                placeholder="Ej: Carnes, embutidos, lácteos..."
                rows={3}
              />
            </div>
          </div>

          <div className="pr-modal-footer">
            <button type="button" className="pr-btn-cancel" onClick={onCerrar}>
              Cancelar
            </button>
            <button type="submit" className="pr-btn-submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente principal
const ProveedoresTab: React.FC<ProveedoresTabProps> = ({ 
  proveedores, 
  setProveedores,
  abrirModal,
  setAbrirModal 
}) => {
  const [busqueda, setBusqueda] = useState<string>("");
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [proveedorEditando, setProveedorEditando] = useState<Proveedor | null>(null);
  const [modalEditarAbierto, setModalEditarAbierto] = useState<boolean>(false);

  // Sincronizar el estado del modal con la prop
  useEffect(() => {
    if (abrirModal) {
      setModalAbierto(true);
      setAbrirModal(false);
    }
  }, [abrirModal, setAbrirModal]);

  const proveedoresFiltrados: Proveedor[] = filtrarProveedores(proveedores, busqueda);

  const handleEliminarProveedor = (id: string): void => {
    const proveedoresActualizados: Proveedor[] = eliminarProveedor(id, proveedores);
    setProveedores(proveedoresActualizados);
  };

  const handleCrearProveedor = (form: NuevoProveedorForm): void => {
    const nuevosProveedores: Proveedor[] = crearProveedor(form, proveedores);
    setProveedores(nuevosProveedores);
    setModalAbierto(false);
  };

  const editarProveedor = (id: string): void => {
    const proveedor = proveedores.find(p => p.id === id);
    if (proveedor) {
      setProveedorEditando(proveedor);
      setModalEditarAbierto(true);
    }
  };

  const handleEditarProveedor = (form: NuevoProveedorForm): void => {
    if (!proveedorEditando) return;
    
    const proveedoresActualizados = proveedores.map(p => 
      p.id === proveedorEditando.id 
        ? { 
            ...p, 
            nombreEmpresa: form.nombreEmpresa,
            contacto: form.contacto,
            telefono: form.telefono,
            email: form.email,
            direccion: form.direccion,
            productos: form.productos
          }
        : p
    );
    setProveedores(proveedoresActualizados);
    setModalEditarAbierto(false);
    setProveedorEditando(null);
  };

  return (
    <div className="proveedores-container">
      <div className="proveedores-search">
        {I.search}
        <input
          type="text"
          value={busqueda}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)}
          placeholder="Buscar proveedor o producto..."
        />
      </div>

      {proveedoresFiltrados.length === 0 ? (
        <div className="proveedores-empty">
          No se encontraron proveedores para "{busqueda}".
        </div>
      ) : (
        <div className="proveedores-grid">
          {proveedoresFiltrados.map((proveedor: Proveedor) => (
            <ProveedorCard
              key={proveedor.id}
              proveedor={proveedor}
              onEditar={editarProveedor}
              onEliminar={handleEliminarProveedor}
            />
          ))}
        </div>
      )}

      {/* Modal para Nuevo Proveedor */}
      {modalAbierto && (
        <ProveedorModal 
          onCerrar={() => setModalAbierto(false)} 
          onGuardar={handleCrearProveedor}
          editTarget={null}
        />
      )}

      {/* Modal para Editar Proveedor */}
      {modalEditarAbierto && (
        <ProveedorModal 
          onCerrar={() => {
            setModalEditarAbierto(false);
            setProveedorEditando(null);
          }} 
          onGuardar={handleEditarProveedor}
          editTarget={proveedorEditando}
        />
      )}
    </div>
  );
};

export default ProveedoresTab;