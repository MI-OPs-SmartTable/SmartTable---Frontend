import type { LoginResponse } from "./authTypes";

// ============================================
// CONSTANTES
// ============================================
const TOKEN_KEY = "pos_auth_token";
const TOKEN_EXP = "pos_auth_exp";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// ============================================
// MANEJO DE SESIÓN (localStorage)
// ============================================

// Guardar sesión con token y expiración
export function saveSession(token: string, expiresIn: number) {
  const exp = Date.now() + expiresIn * 1000;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXP, String(exp));
}

// Limpiar sesión (logout)
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXP);
}

// Verificar si la sesión es válida
export function isSessionValid(): boolean {
  const token = localStorage.getItem(TOKEN_KEY);
  const exp = Number(localStorage.getItem(TOKEN_EXP) || 0);
  return !!token && Date.now() < exp;
}

// Obtener token almacenado
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// ============================================
// VALIDACIÓN DE CAMPOS (LOGIN)
// ============================================
export function validateLogin(username: string, password: string) {
  const errs: { username?: string; password?: string } = {};
  if (!username.trim()) errs.username = "Selecciona un usuario";
  if (!password) errs.password = "Campo requerido";
  else if (password.length < 4) errs.password = "Mínimo 4 caracteres";
  return errs;
}

// ============================================
// USUARIOS DISPONIBLES (para selector)
// ============================================
export const AVAILABLE_USERS = [
  { id: "1", username: "cajero", nombre: "Cajero" },
  { id: "2", username: "mesero", nombre: "Mesero" },
  { id: "3", username: "administrador", nombre: "Administrador" },
];

// ============================================
// LOGIN - CONEXIÓN CON BASE DE DATOS
// ============================================
export async function apiLogin(username: string, password: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,  // Envía username para login
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Credenciales incorrectas");
    }

    if (data.token) {
      saveSession(data.token, data.expiresIn || 28800);
    }

    return {
      token: data.token,
      expiresIn: data.expiresIn || 28800,
      user: {
        id: data.user.id,
        nombre: data.user.nombre,
        rol: data.user.rol,
        email: data.user.email || `${username}@pos.com`,
      },
    };
  } catch (error: any) {
    console.error("Error en login:", error);
    throw new Error(error.message || "Error de conexión con el servidor");
  }
}

// ============================================
// RECUPERAR CONTRASEÑA - CONEXIÓN CON BASE DE DATOS
// ============================================

export async function apiForgotPassword(email: string) {
  try {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,  
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al procesar la solicitud");
    }

    return data;
  } catch (error: any) {
    console.error("Error en forgot password:", error);
    throw new Error(error.message || "Error de conexión con el servidor");
  }
}