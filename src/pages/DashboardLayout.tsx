import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Navigate } from "react-router-dom";
import { isSessionValid, clearSession } from "../auth/authService";
import { usePosSession } from "../context/PosSessionContext";
import SessionCloseModal from "../components/SessionCloseModal";
import DashboardSidebar from "../components/DashboardSidebar";
import { useSessionCloseFlow } from "../hooks/useSessionCloseFlow";
import { DASHBOARD_ICONS, DASHBOARD_NAV_ITEMS, getRolLabel } from "./dashboard.constants";
import { saveLastDashboardPath } from "../lib/sessionResume";
import "../styles/Dashboard.css";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, caja, cajaId, cajaAbierta, setCajaFromResponse } = usePosSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const userName = usuario?.nombre_completo ?? "";
  const rol = usuario?.rol ?? null;
  const closeFlow = useSessionCloseFlow({
    usuario,
    caja,
    cajaId,
    cajaAbierta,
    setCajaFromResponse,
  });

  const navItems = rol ? DASHBOARD_NAV_ITEMS.filter((item) => item.roles.includes(rol)) : [];

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    saveLastDashboardPath(location.pathname);
  }, [location.pathname]);

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

  // Registrar manejador de cierre de app (Electron)
  const closeRequestRef = useRef(closeFlow.handleAppCloseRequest);
  closeRequestRef.current = closeFlow.handleAppCloseRequest;

  useEffect(() => {
    window.__smarttableOnCloseRequest = () => {
      void closeRequestRef.current();
    };
    return () => {
      if (window.__smarttableOnCloseRequest) {
        delete window.__smarttableOnCloseRequest;
      }
    };
  }, []);

  const goTo = (path: string) => {
    navigate(path);
    setMenuOpen(false);
    mainRef.current?.scrollTo(0, 0);
  };

  const currentPageLabel =
    navItems.find((item) => item.id === location.pathname)?.label ?? "SmarTable";

  const showHeader = location.pathname === "/dashboard";

  const getAvatarInitial = () => {
    if (userName) return userName.charAt(0).toUpperCase();
    if (rol === "admin") return "A";
    if (rol === "cajero") return "C";
    if (rol === "mesero") return "M";
    return "U";
  };

  if (!isSessionValid()) {
    clearSession();
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="db-root">
      <header className="db-mobile-header">
        <button
          type="button"
          className="db-menu-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
        >
          {DASHBOARD_ICONS.menu}
        </button>
        <div className="db-mobile-header-text">
          <span className="db-mobile-title">SmarTable</span>
          <span className="db-mobile-subtitle">{currentPageLabel}</span>
        </div>
      </header>

      <DashboardSidebar
        menuOpen={menuOpen}
        navItems={navItems}
        currentPath={location.pathname}
        userDisplayName={userName || getRolLabel(rol || "usuario")}
        userInitial={getAvatarInitial()}
        onCloseMenu={() => setMenuOpen(false)}
        onNavigate={goTo}
        onLogout={() => {
          setMenuOpen(false);
          void closeFlow.handleLogout();
        }}
        icons={{
          pos: DASHBOARD_ICONS.pos,
          close: DASHBOARD_ICONS.close,
          logout: DASHBOARD_ICONS.logout,
        }}
      />

      <main ref={mainRef} className="db-main">
        {showHeader && (
          <div className="db-page-title">Dashboard</div>
        )}
        <Outlet />
      </main>

      {closeFlow.showCloseSessionModal && (
        <SessionCloseModal
          mode={closeFlow.closeMode}
          loadingCloseData={closeFlow.loadingCloseData}
          closingSession={closeFlow.closingSession}
          closeError={closeFlow.closeError}
          gastosDia={closeFlow.gastosDia.map((g) => ({ descripcion: g.descripcion, monto: Number(g.monto) }))}
          extraGastos={closeFlow.extraGastos}
          extraDesc={closeFlow.extraDesc}
          extraMonto={closeFlow.extraMonto}
          extraError={closeFlow.extraError}
          resumenCierre={closeFlow.resumenCierre}
          onExtraDescChange={closeFlow.setExtraDesc}
          onExtraMontoChange={closeFlow.setExtraMonto}
          onAddExtraGasto={closeFlow.handleAddExtraGasto}
          onCancel={closeFlow.handleCancelCloseSession}
          onQuitLeavingOpen={closeFlow.handleQuitLeavingCajaOpen}
          onConfirm={() => {
            void closeFlow.handleConfirmCloseSession();
          }}
        />
      )}
    </div>
  );
}
