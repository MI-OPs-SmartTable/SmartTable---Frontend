import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { clearSession, getUser, isSessionValid } from "../auth/authService";
import { PosSessionProvider } from "../context/PosSessionContext";
import LoginPage from "../pages/LoginPage";
import DashboardLayout from "../pages/DashboardLayout";
import DashboardHome from "../pages/dashboard/DashboardHome";
import VentasPOS from "../pages/dashboard/VentasPOS";
import Productos from "../pages/dashboard/Productos";
import Caja from "../pages/dashboard/Caja";
import Configuracion from "../pages/dashboard/ConfiguracionUsuarios";
import { getResumePath } from "../lib/sessionResume";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

function decodeJwtPayload(token: string): { rol?: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      return null;
    }

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const token = localStorage.getItem("pos_auth_token");

  if (!token || !isSessionValid()) {
    clearSession();
    return <Navigate to="/login" replace />;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    clearSession();
    return <Navigate to="/login" replace />;
  }

  if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
    clearSession();
    return <Navigate to="/login" replace />;
  }

  const userRole = payload.rol;
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/** Si hay sesión válida, reanuda en la última pantalla; si no, login. */
function ResumeOrLogin() {
  if (isSessionValid()) {
    const rol = getUser()?.rol;
    return <Navigate to={getResumePath(rol)} replace />;
  }
  return <LoginPage />;
}

function RootRedirect() {
  if (isSessionValid()) {
    const rol = getUser()?.rol;
    return <Navigate to={getResumePath(rol)} replace />;
  }
  return <Navigate to="/login" replace />;
}

/**
 * Escucha el cierre de la ventana en Electron.
 * En dashboard, DashboardLayout registra el handler con caja.
 * En login u otras pantallas, se permite salir de inmediato.
 */
function DesktopCloseBridge() {
  const location = useLocation();

  useEffect(() => {
    if (!window.smarttable?.onRequestClose) return;

    return window.smarttable.onRequestClose(() => {
      if (typeof window.__smarttableOnCloseRequest === "function") {
        window.__smarttableOnCloseRequest();
        return;
      }
      // Login u otra ruta sin handler: salir dejando sesión si existe
      window.smarttable?.confirmQuit();
    });
  }, [location.pathname]);

  return null;
}

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <DesktopCloseBridge />
      <Routes>
        <Route path="/login" element={<ResumeOrLogin />} />
        <Route path="/" element={<RootRedirect />} />

        <Route path="/dashboard" element={<PosSessionProvider><DashboardLayout /></PosSessionProvider>}>
          <Route index element={<DashboardHome />} />

          <Route path="ventas" element={
            <ProtectedRoute allowedRoles={["admin", "cajero", "mesero"]}>
              <VentasPOS />
            </ProtectedRoute>
          } />

          <Route path="productos" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Productos />
            </ProtectedRoute>
          } />

          <Route path="caja" element={
            <ProtectedRoute allowedRoles={["admin", "cajero"]}>
              <Caja />
            </ProtectedRoute>
          } />

          <Route path="configuracion" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Configuracion />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
