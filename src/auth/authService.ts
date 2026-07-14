import type { LoginResponse } from "./authTypes";
import { apiClient } from "../lib/apiClient";

const TOKEN_KEY = "pos_auth_token";
const TOKEN_EXP = "pos_auth_exp";
const USER_KEY = "pos_user";

export type PosUser = {
  id: string;
  nombre_completo: string;
  rol: string;
};

export function saveSession(token: string, expiresIn: number) {
  const exp = Date.now() + expiresIn * 1000;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXP, String(exp));
}

export function saveUser(user: PosUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): PosUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PosUser;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXP);
  localStorage.removeItem(USER_KEY);
}

export function isSessionValid(): boolean {
  const token = localStorage.getItem(TOKEN_KEY);
  const exp = Number(localStorage.getItem(TOKEN_EXP) || 0);
  return !!token && Date.now() < exp;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function validateLogin(username: string, password: string) {
  const errs: { username?: string; password?: string } = {};
  if (!username.trim()) errs.username = "Selecciona un usuario";
  if (!password) errs.password = "Campo requerido";
  else if (password.length < 4) errs.password = "Mínimo 4 caracteres";
  return errs;
}

export function validatePin(pin: string) {
  const errs: { pin?: string } = {};
  if (!pin) errs.pin = "Campo requerido";
  else if (!/^\d{4}$/.test(pin)) errs.pin = "El PIN debe tener exactamente 4 dígitos numéricos";
  return errs;
}

export async function apiLogin(
  username: string,
  pin: string,
  options?: { forzarCierre?: boolean }
): Promise<LoginResponse> {
  const data = await apiClient.post<{
    token: string;
    expiresIn?: number;
    usuario?: { id?: string; nombre_completo?: string; rol?: string };
    code?: string;
    puede_forzar?: boolean;
  }>(
    "/auth/login",
    {
      nombre_completo: username,
      pin,
      ...(options?.forzarCierre ? { forzar_cierre: true } : {}),
    },
    false
  );

  if (!data.token) {
    throw new Error("Credenciales incorrectas");
  }

  const expiresIn = data.expiresIn ?? 28800;
  saveSession(data.token, expiresIn);

  const user: PosUser = {
    id: data.usuario?.id ?? "",
    nombre_completo: data.usuario?.nombre_completo ?? username,
    rol: data.usuario?.rol ?? "cajero",
  };

  if (user.id) {
    saveUser(user);
  }

  return {
    token: data.token,
    expiresIn,
    user: {
      id: user.id,
      nombre: user.nombre_completo,
      rol: user.rol as LoginResponse["user"]["rol"],
      email: "",
    },
  };
}

export async function apiLogout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout", {});
  } catch {
    /* ignorar si falla */
  } finally {
    clearSession();
  }
}

export async function apiForgotPassword(email: string) {
  try {
    await apiClient.post("/auth/forgot-password", { email }, false);
  } catch {
    throw new Error("Error al procesar la solicitud");
  }
}
