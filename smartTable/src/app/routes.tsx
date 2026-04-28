import { createBrowserRouter, Navigate } from "react-router";
import { useApp } from "./context/AppContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import CashRegister from "./pages/CashRegister";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Suppliers from "./pages/Suppliers";

function RequireAuth({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "sales", element: <RequireAuth allowedRoles={["admin", "cashier", "waiter"]}><Sales /></RequireAuth> },
      { path: "products", element: <RequireAuth allowedRoles={["admin", "inventory"]}><Products /></RequireAuth> },
      { path: "inventory", element: <RequireAuth allowedRoles={["admin", "inventory"]}><Inventory /></RequireAuth> },
      { path: "cash", element: <RequireAuth allowedRoles={["admin", "cashier"]}><CashRegister /></RequireAuth> },
      { path: "reports", element: <RequireAuth allowedRoles={["admin"]}><Reports /></RequireAuth> },
      { path: "settings", element: <RequireAuth allowedRoles={["admin"]}><Settings /></RequireAuth> },
      { path: "users", element: <Navigate to="/settings" replace /> },
      { path: "suppliers", element: <RequireAuth allowedRoles={["admin", "inventory"]}><Suppliers /></RequireAuth> },
    ],
  },
]);
