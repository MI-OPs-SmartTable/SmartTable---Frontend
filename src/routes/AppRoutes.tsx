import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const token = localStorage.getItem("pos_auth_token");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  try {

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userRole = payload.rol;
    
    if (!allowedRoles.includes(userRole)) {
      
      return <Navigate to="/dashboard" replace />;
    }
  } catch (error) {
    console.error("Error decodificando token:", error);
    return <Navigate to="/login" replace />;
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
          <Route path="ventas" element={<VentasPOS />} />
          
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