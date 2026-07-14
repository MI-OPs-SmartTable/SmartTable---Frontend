
// MODAL CREAR/EDITAR USUARIO


import { useState, useRef, useEffect, type CSSProperties } from "react";
import type { Usuario, FormState, FormErrors } from "../pages/dashboard/types/config.types";
import { ROLES } from "../data/seedConfig";

const I = {
  close: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  check: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  alert: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  shield: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

const FORM_EMPTY: FormState = {
  nombre: "",
  email: "",
  pin: "",
  rol: "cajero",
  activo: true,
};

interface UsuarioModalProps {
  editTarget: Usuario | null;
  usuarios: Usuario[];
  onClose: () => void;
  onSave: (u: Usuario) => void;
}

export default function CrearEditarUsuario({ editTarget, usuarios, onClose, onSave }: UsuarioModalProps) {
  const isEdit = !!editTarget;

  const [form, setForm] = useState<FormState>(() =>
    editTarget
      ? {
          nombre: editTarget.nombre || "",
          email: editTarget.email || "",
          pin: editTarget.pin || "",
          rol: editTarget.rol || "cajero",
          activo: editTarget.activo !== undefined ? editTarget.activo : true,
        }
      : FORM_EMPTY
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<"dup" | "ok" | null>(null);
  const nombreRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nombreRef.current?.focus();
  }, []);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.nombre?.trim()) e.nombre = "El nombre es obligatorio";
    if (!form.pin?.trim()) e.pin = "El PIN es obligatorio";
    else if (!/^\d{4}$/.test(form.pin)) e.pin = "El PIN debe tener exactamente 4 dígitos";
    if (!form.rol) e.rol = "Selecciona un rol";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    setBanner(null);
    if (!validate()) return;

    // Verificar duplicado (solo si hay usuarios)
    let dup = false;
    if (usuarios && Array.isArray(usuarios) && usuarios.length > 0) {
      dup = usuarios.some((u) => {
        if (!u?.nombre || !form?.nombre) return false;
        return u.nombre.trim().toLowerCase() === form.nombre.trim().toLowerCase() && u.id !== editTarget?.id;
      });
    }
    
    if (dup) {
      setBanner("dup");
      return;
    }

    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));

    const saved: Usuario = {
      id: editTarget?.id ?? `u${Date.now()}`,
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      pin: form.pin,
      rol: form.rol,
      activo: form.activo,
      esTu: editTarget?.esTu || false,
    };

    setSaving(false);
    setBanner("ok");
    setTimeout(() => {
      onSave(saved);
      onClose();
    }, 500);
  };

  return (
    <div className="cfg-overlay">
      <div className="cfg-modal">
        <div className="cfg-modal-header">
          <div className="cfg-modal-title">{isEdit ? "Editar usuario" : "Nuevo Usuario"}</div>
          <button className="cfg-modal-close" onClick={onClose}>
            {I.close}
          </button>
        </div>

        <div className="cfg-modal-body">
          {banner === "dup" && (
            <div className="cfg-banner err">{I.alert} Ya existe un usuario con ese nombre.</div>
          )}
          {banner === "ok" && (
            <div className="cfg-banner ok">{I.check} Usuario guardado correctamente.</div>
          )}

          <div className="cfg-field">
            <label className="cfg-label">
              Nombre completo <span>*</span>
            </label>
            <input
              ref={nombreRef}
              className={`cfg-input${errors.nombre ? " err" : ""}`}
              placeholder="Nombre completo"
              value={form.nombre}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, nombre: e.target.value }));
                setErrors((prev) => ({ ...prev, nombre: undefined }));
              }}
            />
            {errors.nombre && (
              <div className="cfg-field-err">
                {I.alert}
                {errors.nombre}
              </div>
            )}
          </div>

          <div className="cfg-field-row">
            <div>
              <label className="cfg-label">Email</label>
              <input
                className="cfg-input"
                type="email"
                placeholder="usuario@empresa.com"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="cfg-label">
                PIN de acceso <span>*</span>
                <span style={{ fontWeight: 400, color: "var(--ash)", textTransform: "none", letterSpacing: 0 }}>
                  {" "}
                  (4 dígitos)
                </span>
              </label>
              <input
                className={`cfg-input${errors.pin ? " err" : ""}`}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="1234"
                maxLength={4}
                value={form.pin}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, pin: e.target.value.replace(/\D/g, "") }));
                  setErrors((prev) => ({ ...prev, pin: undefined }));
                }}
                style={{ WebkitTextSecurity: "disc" } as CSSProperties}
              />
              {errors.pin && (
                <div className="cfg-field-err">
                  {I.alert}
                  {errors.pin}
                </div>
              )}
            </div>
          </div>

          <div className="cfg-field">
            <div className="cfg-roles-label">{I.shield} Rol y permisos</div>
            {errors.rol && (
              <div className="cfg-field-err" style={{ marginBottom: 8 }}>
                {I.alert}
                {errors.rol}
              </div>
            )}
            <div className="cfg-roles-list">
              {ROLES.map((rol) => {
                const selected = form.rol === rol.id;
                return (
                  <div
                    key={rol.id}
                    className={`cfg-role-card${selected ? " selected" : ""}`}
                    onClick={() => {
                      setForm((prev) => ({ ...prev, rol: rol.id }));
                      setErrors((prev) => ({ ...prev, rol: undefined }));
                    }}
                  >
                    <div className="cfg-role-radio">
                      <div className="cfg-role-radio-dot" />
                    </div>
                    <div className="cfg-role-body">
                      <div className="cfg-role-pill" style={{ background: rol.bg, color: rol.color }}>
                        {rol.label}
                      </div>
                      <div className="cfg-role-perms">
                        {rol.permisos.map((p) => (
                          <div key={p} className="cfg-role-perm">
                            {p}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <label className="cfg-check-row" style={{ marginBottom: 8 }}>
            <input
              type="checkbox"
              className="cfg-checkbox"
              checked={form.activo}
              onChange={(e) => setForm((prev) => ({ ...prev, activo: e.target.checked }))}
            />
            Usuario activo
          </label>
        </div>

        <div className="cfg-modal-footer">
          <button className="cfg-btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="cfg-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <div className="cfg-spin" /> Guardando…
              </>
            ) : (
              <>
                {I.check} Guardar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}