import { useState, useEffect, useMemo, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { apiLogout } from "../auth/authService";
import { usePosSession } from "../context/PosSessionContext";
import { cerrarCaja, crearGastoCaja, fetchGastosPorCaja, type GastoCajaApi } from "../services/cajaService";
import { fetchVentas, type VentaApi } from "../services/ventasService";
import { formatCOP } from "../lib/formatMoney";
import "../styles/Dashboard.css";


// ============================================
// ICONOS
// ============================================
const Ic = {
  pos: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 9h2M11 9h6M7 12h10"/></svg>,
  grid: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  cart: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  box: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
  cash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  gear: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  chev: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  logout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  config: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

// CONFIGURACIÓN DEL MENÚ POR ROL

const ALL_NAV_ITEMS = [
  { id: "/dashboard", label: "Dashboard", icon: Ic.grid, roles: ["admin", "cajero", "mesero"] },
  { id: "/dashboard/ventas", label: "Ventas", icon: Ic.cart, roles: ["admin", "cajero", "mesero"] },
  { id: "/dashboard/productos", label: "Productos", icon: Ic.box, roles: ["admin"] },
  { id: "/dashboard/caja", label: "Caja", icon: Ic.cash, roles: ["admin", "cajero"] },
  { id: "/dashboard/configuracion", label: "Configuración", icon: Ic.config, roles: ["admin"] },
];

const getRolLabel = (rol: string) => {
  const roles: Record<string, string> = {
    admin: "Administrador",
    cajero: "Cajero",
    mesero: "Mesero",
  };
  return roles[rol] || rol;
};

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, caja, cajaId, cajaAbierta, setCajaFromResponse } = usePosSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastPath, setLastPath] = useState(location.pathname);
  const mainRef = useRef<HTMLElement>(null);
  const [showCloseSessionModal, setShowCloseSessionModal] = useState(false);
  const [loadingCloseData, setLoadingCloseData] = useState(false);
  const [closingSession, setClosingSession] = useState(false);
  const [closeError, setCloseError] = useState("");

  const [ventasCaja, setVentasCaja] = useState<VentaApi[]>([]);
  const [gastosDia, setGastosDia] = useState<GastoCajaApi[]>([]);
  const [extraDesc, setExtraDesc] = useState("");
  const [extraMonto, setExtraMonto] = useState("");
  const [extraError, setExtraError] = useState("");
  const [extraGastos, setExtraGastos] = useState<Array<{ descripcion: string; monto: number }>>([]);
  const userName = usuario?.nombre_completo ?? "";
  const rol = usuario?.rol ?? null;
  const canManageCaja = rol === "admin" || rol === "cajero";

  const resumenCierre = useMemo(() => {
    const baseInicial = Number(caja?.monto_apertura ?? 0);
    const totalEfectivo = ventasCaja.reduce((sum, venta) => sum + Number(venta.monto_efectivo), 0);
    const totalTransferencias = ventasCaja.reduce(
      (sum, venta) => sum + Number(venta.monto_transferencia),
      0
    );
    const totalVentas = ventasCaja.reduce((sum, venta) => sum + Number(venta.total), 0);
    const gastosRegistrados = gastosDia.reduce((sum, gasto) => sum + Number(gasto.monto), 0);
    const gastosExtras = extraGastos.reduce((sum, gasto) => sum + Number(gasto.monto), 0);
    const totalGastos = gastosRegistrados + gastosExtras;
    const saldoNeto = baseInicial + totalVentas - totalGastos;

    return {
      baseInicial,
      totalEfectivo,
      totalTransferencias,
      totalVentas,
      totalGastos,
      saldoNeto,
    };
  }, [caja?.monto_apertura, extraGastos, gastosDia, ventasCaja]);

  if (location.pathname !== lastPath) {
    setLastPath(location.pathname);
    setMenuOpen(false);
  }

  const loadCloseSessionData = async () => {
    if (!caja?.id) return;
    setLoadingCloseData(true);
    setCloseError("");
    try {
      const [ventas, gastos] = await Promise.all([
        fetchVentas(),
        fetchGastosPorCaja(caja.id),
      ]);
      setVentasCaja(ventas.filter((venta) => venta.caja_id === caja.id));
      setGastosDia(gastos);
    } catch (error) {
      setCloseError(error instanceof Error ? error.message : "No se pudo cargar el cierre de caja");
    } finally {
      setLoadingCloseData(false);
    }
  };

  const resetCloseSessionModal = () => {
    setExtraDesc("");
    setExtraMonto("");
    setExtraError("");
    setExtraGastos([]);
    setCloseError("");
    setVentasCaja([]);
    setGastosDia([]);
  };

  const completeLogout = async () => {
    await apiLogout();
    window.location.href = "/login";
  };

  const handleLogout = async () => {
    setMenuOpen(false);

    if (canManageCaja && cajaAbierta && cajaId) {
      setShowCloseSessionModal(true);
      await loadCloseSessionData();
      return;
    }

    await completeLogout();
  };

  const handleAddExtraGasto = () => {
    const monto = Number(extraMonto);
    if (!extraDesc.trim()) {
      setExtraError("Ingresa una descripción");
      return;
    }
    if (Number.isNaN(monto) || monto <= 0) {
      setExtraError("Ingresa un monto válido");
      return;
    }
    setExtraGastos((prev) => [...prev, { descripcion: extraDesc.trim(), monto }]);
    setExtraDesc("");
    setExtraMonto("");
    setExtraError("");
  };

  const handleCancelCloseSession = () => {
    if (closingSession) return;
    setShowCloseSessionModal(false);
    resetCloseSessionModal();
  };

  const handleConfirmCloseSession = async () => {
    if (!caja?.id || !usuario?.id) {
      setCloseError("No hay una caja activa para cerrar");
      return;
    }

    setClosingSession(true);
    try {
      await Promise.all(
        extraGastos.map((gasto) =>
          crearGastoCaja({
            caja_id: caja.id,
            usuario_id: usuario.id,
            descripcion: gasto.descripcion,
            monto: gasto.monto,
            categoria: "caja menor",
          })
        )
      );
      await cerrarCaja(caja.id);
      setCajaFromResponse(null);
      await completeLogout();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo cerrar caja y sesión";
      setCloseError(errorMessage);
    } finally {
      setClosingSession(false);
    }
  };

  const navItems = rol ? ALL_NAV_ITEMS.filter((item) => item.roles.includes(rol)) : [];

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  const goTo = (path: string) => {
    navigate(path);
    setMenuOpen(false);
    mainRef.current?.scrollTo(0, 0);
  };

  const currentPageLabel =
    navItems.find((item) => item.id === location.pathname)?.label ?? "SmarTable";

  const showHeader = location.pathname === "/dashboard";

  // Obtener inicial para el avatar
  const getAvatarInitial = () => {
    if (userName) return userName.charAt(0).toUpperCase();
    if (rol === "admin") return "A";
    if (rol === "cajero") return "C";
    if (rol === "mesero") return "M";
    return "U";
  };

  return (
    <div className="db-root">
      <header className="db-mobile-header">
        <button
          type="button"
          className="db-menu-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
        >
          {Ic.menu}
        </button>
        <div className="db-mobile-header-text">
          <span className="db-mobile-title">SmarTable</span>
          <span className="db-mobile-subtitle">{currentPageLabel}</span>
        </div>
      </header>

      {menuOpen && (
        <button
          type="button"
          className="db-sidebar-overlay"
          onClick={() => setMenuOpen(false)}
          aria-label="Cerrar menú"
        />
      )}

      <aside className={`db-sidebar${menuOpen ? " open" : ""}`}>
        <button
          type="button"
          className="db-sidebar-close"
          onClick={() => setMenuOpen(false)}
          aria-label="Cerrar menú"
        >
          {Ic.close}
        </button>

        <div className="db-brand">
          <div className="db-brand-icon">{Ic.pos}</div>
          <div>
            <div className="db-brand-name">SmarTable</div>
            <div className="db-brand-sub">Punto de Venta</div>
          </div>
        </div>

        <nav className="db-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`db-nav-item ${location.pathname === item.id ? "active" : ""}`}
              onClick={() => goTo(item.id)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="db-user" onClick={handleLogout}>
          <div className="db-user-avatar">{getAvatarInitial()}</div>
          <div>
            <div className="db-user-name">{userName || getRolLabel(rol || "usuario")}</div>
            <div className="db-user-role">Cerrar sesión</div>
          </div>
          <div className="db-user-chevron">{Ic.logout}</div>
        </div>
      </aside>

      <main ref={mainRef} className="db-main">
        {showHeader && (
          <div className="db-page-title">Dashboard</div>
        )}
        <Outlet />
      </main>

      {showCloseSessionModal && (
        <div className="db-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="db-close-title">
          <div className="db-close-modal">
            <div className="db-close-header">
              <h3 id="db-close-title">Cerrar Caja y Sesión</h3>
              <button
                type="button"
                className="db-close-x"
                onClick={handleCancelCloseSession}
                aria-label="Cerrar"
                disabled={closingSession}
              >
                ×
              </button>
            </div>

            <div className="db-close-warning">Debe cerrar la caja antes de cerrar sesión</div>

            {loadingCloseData ? (
              <p className="db-close-loading">Cargando información de caja...</p>
            ) : (
              <>
                <div className="db-close-summary">
                  <div className="db-close-row"><span>Base inicial:</span><strong>{formatCOP(resumenCierre.baseInicial)}</strong></div>
                  <div className="db-close-row"><span>Total en efectivo:</span><strong className="ok">{formatCOP(resumenCierre.totalEfectivo)}</strong></div>
                  <div className="db-close-row"><span>Total transferencias:</span><strong className="info">{formatCOP(resumenCierre.totalTransferencias)}</strong></div>
                  <div className="db-close-row"><span>Total ventas:</span><strong className="ok">{formatCOP(resumenCierre.totalVentas)}</strong></div>
                  <div className="db-close-row"><span>Gastos:</span><strong className="bad">- {formatCOP(resumenCierre.totalGastos)}</strong></div>
                  <div className="db-close-total"><span>Saldo neto:</span><strong>{formatCOP(resumenCierre.saldoNeto)}</strong></div>
                </div>

                <div className="db-close-section">
                  <p className="db-close-label">Gastos del día</p>
                  <div className="db-close-gastos-list">
                    {gastosDia.length === 0 && extraGastos.length === 0 ? (
                      <p>Sin gastos registrados</p>
                    ) : (
                      [...gastosDia.map((g) => ({ descripcion: g.descripcion, monto: Number(g.monto) })), ...extraGastos].map(
                        (g, idx) => (
                          <div key={`${g.descripcion}-${idx}`} className="db-close-gasto-item">
                            <span>{g.descripcion}</span>
                            <strong>- {formatCOP(g.monto)}</strong>
                          </div>
                        )
                      )
                    )}
                  </div>
                </div>

                <div className="db-close-section">
                  <p className="db-close-label">Agregar gasto adicional (opcional)</p>
                  <div className="db-close-add-gasto">
                    <input
                      type="text"
                      placeholder="Descripción"
                      value={extraDesc}
                      onChange={(e) => setExtraDesc(e.target.value)}
                      disabled={closingSession}
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="$0"
                      value={extraMonto}
                      onChange={(e) => setExtraMonto(e.target.value)}
                      disabled={closingSession}
                    />
                    <button
                      type="button"
                      onClick={handleAddExtraGasto}
                      disabled={closingSession}
                      aria-label="Agregar gasto"
                    >
                      +
                    </button>
                  </div>
                  {extraError && <p className="db-close-error">{extraError}</p>}
                </div>

                <p className="db-close-help">¿Está seguro de cerrar la caja y salir? Esta acción no se puede deshacer.</p>

                {closeError && <p className="db-close-error">{closeError}</p>}

                <div className="db-close-actions">
                  <button type="button" className="db-close-cancel" onClick={handleCancelCloseSession} disabled={closingSession}>
                    Cancelar
                  </button>
                  <button type="button" className="db-close-confirm" onClick={handleConfirmCloseSession} disabled={closingSession}>
                    {closingSession ? "Cerrando..." : "Cerrar y Salir"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}