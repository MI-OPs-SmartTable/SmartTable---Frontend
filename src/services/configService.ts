// ============================================
// SERVICIO DE CONFIGURACIÓN - CONEXIÓN A BASE DE DATOS
// ============================================

import type { Usuario } from "../pages/dashboard/types/config.types";
import { USUARIOS_SEED } from "../data/seedConfig";  // 👈 Cambiar a seedConfig

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// OBTENER USUARIOS
export async function fetchUsuarios(): Promise<Usuario[]> {
  try {
    const response = await fetch(`${API_URL}/usuarios`);
    if (!response.ok) throw new Error("Error al cargar usuarios");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetchUsuarios:", error);
    return USUARIOS_SEED;
  }
}

// CREAR USUARIO
export async function crearUsuario(usuario: Omit<Usuario, "id">): Promise<Usuario> {
  const response = await fetch(`${API_URL}/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usuario),
  });
  if (!response.ok) throw new Error("Error al crear usuario");
  return response.json();
}

// ACTUALIZAR USUARIO
export async function actualizarUsuario(id: string, usuario: Partial<Usuario>): Promise<Usuario> {
  const response = await fetch(`${API_URL}/usuarios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usuario),
  });
  if (!response.ok) throw new Error("Error al actualizar usuario");
  return response.json();
}

// ELIMINAR USUARIO
export async function eliminarUsuario(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/usuarios/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error al eliminar usuario");
}