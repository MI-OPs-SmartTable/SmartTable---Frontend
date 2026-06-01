import type { LoginResponse } from "./authTypes";

// ============================================
// CONSTANTES
// ============================================
const TOKEN_KEY = "pos_auth_token";
const TOKEN_EXP = "pos_auth_exp";
const API_URL = "https://smarttable-backend-njq0.onrender.com/api";

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
  { id: "16151ab6fdb64b41a0b7c105f34cd158", username: "Admin Nathalia", nombre: "Admin Nathalia", pin: "1234" },
  { id: "162441725c614d008ecc699e9e683ca1", username: "Admin Principal Lina", nombre: "Admin Principal Lina", pin: "1234" },
  { id: "45f3dca8b4794f20b159b3f70d6787ec", username: "Cajero Santiago", nombre: "Cajero Santiago", pin: "1234" },
  { id: "0a748b8dc1f14020a6d77f74a60ac108", username: "Mesero Carlos", nombre: "Mesero Carlos", pin: "1234" },
];


export async function apiLogin(username: string, pin: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre_completo: username,
        pin: pin,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
 
      throw new Error("Credenciales incorrectas");
    }

    if (data.token) {
      saveSession(data.token, data.expiresIn || 28800);
    }

    return {
      token: data.token,
      expiresIn: data.expiresIn || 28800,
      user: {
        id: data.usuario?.id || `u${Date.now()}`,
        nombre: data.usuario?.nombre_completo || username,
        rol: data.usuario?.rol || "cajero",
        email: "",
      },
    };
  } catch (error: any) {
 
    if (import.meta.env.DEV && error.message !== "Credenciales incorrectas") {
      console.error("Error en login:", error);
    }
    throw new Error("Credenciales incorrectas");
  }
}


export function verifyPin(username: string, pin: string): boolean {
  const user = AVAILABLE_USERS.find(u => u.username === username);
  return user?.pin === pin;
}


// RECUPERAR CONTRASEÑA - CONEXIÓN CON BASE DE DATOS

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
    // No mostrar error detallado en consola
    if (import.meta.env.DEV) {
      console.error("Error en forgot password:", error);
    }
    throw new Error("Error al procesar la solicitud");
  }
}