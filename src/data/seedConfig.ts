
// CONFIGURACIÓN


import type { RolConfig, Rol } from "../pages/dashboard/types/config.types";

export const ROLES: RolConfig[] = [
  {
    id: "admin",
    label: "Administrador",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.1)",
    permisos: [
      "Acceso total al sistema",
      "Gestión de usuarios",
      "Reportes completos",
      "Caja y ventas",
      "Inventario y proveedores",
    ],
  },
  {
    id: "cajero",
    label: "Cajero",
    color: "#e8601c",
    bg: "rgba(232,96,28,0.1)",
    permisos: [
      "Registro de ventas",
      "Apertura y cierre de caja",
      "Consulta de productos",
    ],
  },
  {
    id: "mesero",
    label: "Mesero",
    color: "#2d7a4f",
    bg: "rgba(45,122,79,0.1)",
    permisos: ["Registro de ventas", "Consulta de productos"],
  },
  {
    id: "inventario",
    label: "Inventario",
    color: "#d4860f",
    bg: "rgba(212,134,15,0.1)",
    permisos: [
      "Gestión de inventario",
      "Gestión de productos",
      "Gestión de proveedores",
    ],
  },
];

export const uid = () => `u${Date.now()}`;
export const initials = (n: string | undefined | null) => {
  if (!n) return "??";
  return n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
};
export const rolInfo = (id: Rol) => ROLES.find((r) => r.id === id)!;