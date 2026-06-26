// ============================================
// TIPOS DE CONFIGURACIÓN
// ============================================

export type Rol = "admin" | "cajero" | "mesero" | "inventario";

export type Usuario = {
  id: string;
  nombre: string;
  email: string;
  pin: string;
  rol: Rol;
  activo: boolean;
  esTu?: boolean;
};

export type RolConfig = {
  id: Rol;
  label: string;
  color: string;
  bg: string;
  permisos: string[];
};

export type FormState = {
  nombre: string;
  email: string;
  pin: string;
  rol: Rol;
  activo: boolean;
};

export type FormErrors = {
  nombre?: string;
  pin?: string;
  rol?: string;
};