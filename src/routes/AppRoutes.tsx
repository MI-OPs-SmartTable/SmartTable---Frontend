import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import DashboardLayout from "../pages/DashboardLayout";
import DashboardHome from "../pages/dashboard/DashboardHome";
import VentasPOS from "../pages/dashboard/VentasPOS";
import Productos from "../pages/dashboard/Productos";
import Caja from "../pages/dashboard/Caja";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="ventas" element={<VentasPOS />} />
          <Route path="productos" element={<Productos />} />
          <Route path="caja" element={<Caja />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;