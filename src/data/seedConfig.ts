// ============================================
// DATOS DE PRUEBA - CONFIGURACIÓN
// ============================================

import type { Usuario, RolConfig, Rol } from "../pages/dashboard/types/config.types";

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

export const USUARIOS_SEED: Usuario[] = [
  { id: "u1", nombre: "Lina Marcela Rivas", email: "lina@restaurante.com", pin: "1234", rol: "admin", activo: true, esTu: true },
  { id: "u2", nombre: "María López", email: "maria@restaurante.com", pin: "5678", rol: "cajero", activo: true },
  { id: "u3", nombre: "Carlos García", email: "carlos@restaurante.com", pin: "9012", rol: "mesero", activo: true },
  { id: "u4", nombre: "Ana Pérez", email: "ana@restaurante.com", pin: "3456", rol: "inventario", activo: true },
];

export const uid = () => `u${Date.now()}`;
export const initials = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
export const rolInfo = (id: Rol) => ROLES.find((r) => r.id === id)!;