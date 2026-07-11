import { useState, useRef, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom"; 
import { 
  saveSession, 
  clearSession, 
  validatePin,
  apiLogin, 
  apiForgotPassword,
} from "../auth/authService";
import { ApiError } from "../lib/apiClient";
import { fetchUsuariosParaLogin } from "../services/authUsuariosService";
import { mapAuthUsuarioToLoginOption } from "../lib/mappers/usuarioMapper";
import { waitForBackendReady } from "../lib/waitForBackend";
import { getResumePath } from "../lib/sessionResume";
import "../styles/LoginPage.css";

// ============================================
// ICONOS
// ============================================
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconEye = ({ open }: { open: boolean }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/>
  </svg>
);

const IconAlert = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconPOS = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
    <rect x="2" y="3" width="20" height="13" rx="2"/>
    <path d="M8 21h8M12 17v4"/>
    <path d="M7 9h2M11 9h6M7 12h10"/>
  </svg>
);

const IconChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ============================================
// SPINNER COMPONENT
// ============================================
const Spinner = () => (
  <div style={{
    width: "40px",
    height: "40px",
    margin: "20px auto",
    border: "3px solid var(--line)",
    borderTopColor: "var(--orange)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  }} />
);

// ============================================
// MODAL DE RECUPERAR CONTRASEÑA
// ============================================
function ForgotModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (v: string) => Promise<void> }) {
  const [val, setVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async () => {
    setErr("");
    setLoading(true);
    try {
      await onSubmit(val);
      setDone(true);
    } catch (e: any) {
      setErr(e.message || "No se pudo procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pl-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pl-modal">
        {!done ? (
          <>
            <div className="pl-modal-title">Recuperar contraseña</div>
            <p className="pl-modal-sub">
              Ingresa tu correo electrónico para restablecer tu contraseña.
            </p>
            {err && (
              <div className="pl-banner err">
                <IconAlert />{err}
              </div>
            )}
            <div className="pl-field">
              <label className="pl-label">Correo electrónico</label>
              <div className="pl-input-wrap">
                <input
                  ref={inputRef}
                  type="email"
                  className={`pl-input${err ? " err" : ""}`}
                  style={{ paddingLeft: 16 }}
                  placeholder="tucorreo@empresa.com"
                  value={val}
                  onChange={(e) => { setVal(e.target.value); setErr(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>
            </div>
            <div className="pl-modal-actions">
              <button className="pl-btn-secondary" onClick={onClose}>Cancelar</button>
              <button className="pl-btn-primary" onClick={handleSubmit} disabled={loading || !val.trim()}>
                {loading && <div className="pl-spin" />}
                {loading ? "Enviando…" : "Enviar enlace"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: "center", padding: "8px 0 20px" }}>
              <div style={{ width:52, height:52, borderRadius:"50%", background:"#f0faf4", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                <IconCheck />
              </div>
              <div className="pl-modal-title" style={{marginBottom:8}}>¡Listo!</div>
              <p className="pl-modal-sub" style={{marginBottom:0}}>
                Si el correo existe, recibirás instrucciones para restablecer tu contraseña.
              </p>
            </div>
            <button className="pl-btn-primary" style={{width:"100%"}} onClick={onClose}>
              Volver al login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// PÁGINA PRINCIPAL DE LOGIN
// ============================================
export default function LoginPage() {
  const navigate = useNavigate();  
  const [selectedUser, setSelectedUser] = useState("");
  const [pin, setPin] = useState("");  
  const [showPin, setShowPin] = useState(false);  
  const [loading, setLoading] = useState(false);
  const [fieldErrs, setFieldErrs] = useState<{ username?: string; pin?: string }>({});  
  const [banner, setBanner] = useState<{ type: "err" | "ok"; msg: string } | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<{ id: string; username: string; nombre: string; rol: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [loadingStatus, setLoadingStatus] = useState("Cargando usuarios…");
  const selectRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);

  
  const getRolLabel = (rol: string) => {
    const roles: Record<string, string> = {
      admin: "Administrador",
      cajero: "Cajero",
      mesero: "Mesero",
    };
    return roles[rol] || rol;
  };

  const cargarUsuarios = async (opts?: { waitForBackend?: boolean }) => {
    setLoadingUsers(true);
    setUsersError("");
    setLoadingStatus(
      opts?.waitForBackend
        ? "Esperando al servidor…"
        : "Cargando usuarios…"
    );

    try {
      if (opts?.waitForBackend) {
        const ready = await waitForBackendReady({ timeoutMs: 45000, intervalMs: 700 });
        if (!ready) {
          throw new Error("El servidor no respondió a tiempo");
        }
      }

      const usuarios = await fetchUsuariosParaLogin();
      const mapped = usuarios.map(mapAuthUsuarioToLoginOption);
      setAvailableUsers(mapped);
      setUsersError("");
      // Si solo hay un usuario, seleccionarlo para poder escribir el PIN de inmediato
      if (mapped.length === 1) {
        setSelectedUser(mapped[0].username);
      }
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      setAvailableUsers([]);
      setUsersError(
        "No se pudo conectar con el servidor. Si acabas de restaurar un respaldo, espera unos segundos y reintenta."
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  // Cargar usuarios activos desde el backend (con reintento si aún reinicia)
  useEffect(() => {
    void cargarUsuarios({ waitForBackend: true });
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Enfocar el PIN cuando se selecciona un usuario
  useEffect(() => {
    if (selectedUser) {
      pinRef.current?.focus();
    }
  }, [selectedUser]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBanner(null);
    
    const pinErr = validatePin(pin);
    
    setFieldErrs({
      username: !selectedUser ? "Selecciona un usuario" : undefined,
      pin: pinErr.pin
    });
    
    if (!selectedUser || pinErr.pin) return;

    setLoading(true);
    try {
      const data = await apiLogin(selectedUser, pin);  
      saveSession(data.token, data.expiresIn);
      setBanner({ type: "ok", msg: `¡Bienvenido, ${data.user.nombre}!` });

      // Si el token había caducado pero la caja sigue abierta en BD,
      // reanudamos en la última pantalla permitida para ese rol.
      const resumePath = getResumePath(data.user.rol);
      setTimeout(() => {
        navigate(resumePath);
      }, 600);
      
    } catch (err: unknown) {
      clearSession();
      const apiErr = err instanceof ApiError ? err : null;
      const message = err instanceof Error ? err.message : "PIN incorrecto";
      const isSessionElsewhere =
        apiErr?.status === 409 &&
        (message.includes("otro dispositivo") || message.includes("sesión activa"));

      if (isSessionElsewhere) {
        const forzar = window.confirm(
          "Este usuario ya tiene una sesión activa en otro dispositivo.\n\n¿Cerrar esa sesión e iniciar aquí?"
        );
        if (forzar) {
          try {
            const data = await apiLogin(selectedUser, pin, { forzarCierre: true });
            saveSession(data.token, data.expiresIn);
            setBanner({ type: "ok", msg: `¡Bienvenido, ${data.user.nombre}!` });
            const resumePath = getResumePath(data.user.rol);
            setTimeout(() => navigate(resumePath), 600);
            return;
          } catch (forceErr: unknown) {
            clearSession();
            setBanner({
              type: "err",
              msg: forceErr instanceof Error ? forceErr.message : "No se pudo forzar el inicio de sesión",
            });
            setPin("");
            pinRef.current?.focus();
            return;
          }
        }
      }

      setBanner({ type: "err", msg: message || "PIN incorrecto" });
      setPin("");
      pinRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (val: string) => {
    await apiForgotPassword(val);
  };
  
  const selectedUserData = availableUsers.find(u => u.username === selectedUser);

  // Pantalla de carga con spinner naranja
  if (loadingUsers) {
    return (
      <div className="pl-root">
        <div className="pl-left">
          <div className="pl-left-bg" />
          <div className="pl-brand">
            <div className="pl-brand-mark"><IconPOS /></div>
            <div>
              <div className="pl-brand-name">SmarTable</div>
              <div className="pl-brand-tag">Sistema de Punto de Venta</div>
            </div>
          </div>
          <div className="pl-hero">
            <div className="pl-hero-label">Acceso al sistema</div>
            <h1 className="pl-hero-title">Control total<br />de cada <em>venta</em></h1>
            <p className="pl-hero-sub">Gestiona productos, registra ventas y controla tu caja de forma rápida, sencilla y eficiente desde un solo lugar</p>
          </div>
        </div>
        <div className="pl-right">
          <div className="pl-form-wrap" style={{ textAlign: "center" }}>
            <Spinner />
            <p style={{ marginTop: 20, color: "var(--ash)" }}>{loadingStatus}</p>
          </div>
        </div>
      </div>
    );
  }

  if (usersError && availableUsers.length === 0) {
    return (
      <div className="pl-root">
        <div className="pl-left">
          <div className="pl-left-bg" />
          <div className="pl-brand">
            <div className="pl-brand-mark"><IconPOS /></div>
            <div>
              <div className="pl-brand-name">SmarTable</div>
              <div className="pl-brand-tag">Sistema de Punto de Venta</div>
            </div>
          </div>
          <div className="pl-hero">
            <div className="pl-hero-label">Acceso al sistema</div>
            <h1 className="pl-hero-title">Control total<br />de cada <em>venta</em></h1>
            <p className="pl-hero-sub">Gestiona productos, registra ventas y controla tu caja de forma rápida, sencilla y eficiente desde un solo lugar</p>
          </div>
        </div>
        <div className="pl-right">
          <div className="pl-form-wrap" style={{ textAlign: "center" }}>
            <div className="pl-banner err" style={{ textAlign: "left", marginBottom: 16 }}>
              <IconAlert />
              {usersError}
            </div>
            <button
              type="button"
              className="pl-submit"
              onClick={() => void cargarUsuarios({ waitForBackend: true })}
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pl-root">
        {/* PANEL IZQUIERDO - INFORMACIÓN */}
        <aside className="pl-left">
          <div className="pl-left-bg" />
          
          <div className="pl-brand">
            <div className="pl-brand-mark"><IconPOS /></div>
            <div>
              <div className="pl-brand-name">SmarTable</div>
              <div className="pl-brand-tag">Sistema de Punto de Venta</div>
            </div>
          </div>

          <div className="pl-hero">
            <div className="pl-hero-label">Acceso al sistema</div>
            <h1 className="pl-hero-title">
              Control total<br />de cada <em>venta</em>
            </h1>
            <p className="pl-hero-sub">
              Gestiona productos, registra ventas y controla tu caja de forma rápida, sencilla y eficiente desde un solo lugar
            </p>
          </div>
        </aside>

        {/* PANEL DERECHO - FORMULARIO DE LOGIN */}
        <main className="pl-right">
          <div className="pl-form-wrap">
            <header className="pl-form-header">
              <h2 className="pl-form-title">
                Inicia <span>sesión</span>
              </h2>
              <p className="pl-form-desc">
                Selecciona tu usuario e ingresa tu PIN de acceso.
              </p>
            </header>

            {banner && (
              <div className={`pl-banner ${banner.type}`}>
                {banner.type === "err" ? <IconAlert /> : <IconCheck />}
                {banner.msg}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* SELECTOR DE USUARIO */}
              <div className="pl-field">
                <label className="pl-label">Seleccionar usuario</label>
                <div className="pl-input-wrap" ref={selectRef}>
                  <div 
                    className={`pl-select ${fieldErrs.username ? "err" : ""}`}
                    onClick={() => setIsOpen(!isOpen)}
                  >
                    <span className={selectedUser ? "" : "placeholder"}>
                      {selectedUserData ? selectedUserData.nombre : "Selecciona un usuario"}
                    </span>
                    <span className={`pl-select-arrow ${isOpen ? "open" : ""}`}>
                      <IconChevronDown />
                    </span>
                  </div>
                  {isOpen && (
                    <div className="pl-select-dropdown">
                      {availableUsers.map((user) => (
                        <div
                          key={user.id}
                          className={`pl-select-option ${selectedUser === user.username ? "selected" : ""}`}
                          onClick={() => {
                            setSelectedUser(user.username);
                            setIsOpen(false);
                            setFieldErrs(p => ({...p, username: undefined}));
                          }}
                        >
                          <div className="pl-select-option-role">{getRolLabel(user.rol)}</div>
                          <div className="pl-select-option-name">{user.nombre}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {fieldErrs.username && (
                  <div className="pl-field-err"><IconAlert />{fieldErrs.username}</div>
                )}
              </div>

              {/* CAMPO PIN - 4 DÍGITOS NUMÉRICOS */}
              <div className="pl-field">
                <label className="pl-label" htmlFor="pos-pin">PIN de acceso (4 dígitos)</label>
                <div className="pl-input-wrap">
                  <input
                    ref={pinRef}
                    id="pos-pin"
                    className={`pl-input${fieldErrs.pin ? " err" : ""}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={4}
                    placeholder={selectedUser ? "····" : "Elige un usuario primero"}
                    value={pin}
                    disabled={loading}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setPin(value);
                      setFieldErrs((p) => ({ ...p, pin: undefined }));
                    }}
                    onKeyDown={(e) => {
                      // Permitir control/navegación; bloquear letras
                      if (
                        e.ctrlKey ||
                        e.metaKey ||
                        e.altKey ||
                        ["Backspace", "Delete", "Tab", "Enter", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                      ) {
                        return;
                      }
                      if (!/^\d$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    style={{
                      paddingRight: 44,
                      textAlign: "center",
                      letterSpacing: "4px",
                      fontSize: "18px",
                      // Evita el bug de type=password en Electron con input controlado
                      WebkitTextSecurity: showPin ? "none" : "disc",
                    } as CSSProperties}
                  />
                  <span className="pl-input-icon"><IconLock /></span>
                  <button
                    type="button"
                    className="pl-eye"
                    tabIndex={-1}
                    onClick={() => setShowPin((v) => !v)}
                    disabled={loading}
                    aria-label={showPin ? "Ocultar PIN" : "Mostrar PIN"}
                  >
                    <IconEye open={showPin} />
                  </button>
                </div>
                {!selectedUser && (
                  <div className="pl-field-err" style={{ color: "var(--ash)" }}>
                    Selecciona un usuario para continuar
                  </div>
                )}
                {fieldErrs.pin && (
                  <div className="pl-field-err"><IconAlert />{fieldErrs.pin}</div>
                )}
              </div>

              <button type="submit" className="pl-submit" disabled={loading || !selectedUser}>
                <span className="pl-submit-inner">
                  {loading && <div className="pl-spin" />}
                  {loading ? "Verificando acceso…" : "Ingresar al sistema"}
                </span>
              </button>
            </form>

            <button className="pl-forgot" type="button" onClick={() => setShowForgot(true)}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </main>
      </div>

      {showForgot && (
        <ForgotModal onClose={() => setShowForgot(false)} onSubmit={handleForgot} />
      )}
    </>
  );
}