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

export function saveSession(token: string, expiresIn: number) {
  const exp = Date.now() + expiresIn * 1000;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXP, String(exp));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXP);
}

export function isSessionValid(): boolean {
  const token = localStorage.getItem(TOKEN_KEY);
  const exp = Number(localStorage.getItem(TOKEN_EXP) || 0);
  return !!token && Date.now() < exp;
}

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
// VALIDACIÓN DE PIN (4 DÍGITOS)
// ============================================
export function validatePin(pin: string) {
  const errs: { pin?: string } = {};
  if (!pin) errs.pin = "Campo requerido";
  else if (!/^\d{4}$/.test(pin)) errs.pin = "El PIN debe tener exactamente 4 dígitos numéricos";
  return errs;
}

// ============================================
// USUARIOS DISPONIBLES (para selector)
// ============================================
export const AVAILABLE_USERS = [
  { id: "1", username: "cajero", nombre: "Cajero", pin: "1234" },  // 👈 PIN agregado
  { id: "2", username: "mesero", nombre: "Mesero", pin: "5678" },    // 👈 PIN agregado
  { id: "3", username: "administrador", nombre: "Administrador", pin: "9012" }, // 👈 PIN agregado
];

// ============================================
// LOGIN - CONEXIÓN CON BASE DE DATOS
// ============================================
export async function apiLogin(username: string, pin: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        pin: pin,  // 👈 Cambiado de password a pin
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "PIN incorrecto");
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
// VERIFICAR PIN (local - sin backend)
// ============================================
export function verifyPin(username: string, pin: string): boolean {
  const user = AVAILABLE_USERS.find(u => u.username === username);
  return user?.pin === pin;
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