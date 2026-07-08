import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { clearSession, isSessionValid } from "../auth/authService";
import { PosSessionProvider } from "../context/PosSessionContext";
import LoginPage from "../pages/LoginPage";
import DashboardLayout from "../pages/DashboardLayout";
import DashboardHome from "../pages/dashboard/DashboardHome";
import VentasPOS from "../pages/dashboard/VentasPOS";
import Productos from "../pages/dashboard/Productos";
import Caja from "../pages/dashboard/Caja";
import Configuracion from "../pages/dashboard/ConfiguracionUsuarios";


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

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/dashboard" element={<PosSessionProvider><DashboardLayout /></PosSessionProvider>}>
          <Route index element={<DashboardHome />} />
          
          <Route path="ventas" element={
            <ProtectedRoute allowedRoles={["admin", "cajero", "mesero"]}>
              <VentasPOS />
            </ProtectedRoute>
          } />
          
          {/* Solo admin puede ver productos */}
          <Route path="productos" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Productos />
            </ProtectedRoute>
          } />
          
          {/* Admin y cajero pueden ver caja */}
          <Route path="caja" element={
            <ProtectedRoute allowedRoles={["admin", "cajero"]}>
              <Caja />
            </ProtectedRoute>
          } />
          
          {/* Solo admin puede ver configuración */}
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