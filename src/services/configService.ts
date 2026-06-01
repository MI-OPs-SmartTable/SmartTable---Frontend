
// SERVICIO DE CONFIGURACIÓN - CONEXIÓN A BASE DE DATOS


import type { Usuario } from "../pages/dashboard/types/config.types";

const API_URL = "https://smarttable-backend-njq0.onrender.com/api";


const ROL_IDS: Record<string, string> = {
  admin: "e732e8c6d23e4a8dbc552d1ba19dc99e",
  cajero: "1f5b8bb1657c497d83aef3a818feb89c",
  mesero: "57b775374a9a46679045f8f2081fd001",
};

// OBTENER USUARIOS
export async function fetchUsuarios(): Promise<Usuario[]> {
  const token = localStorage.getItem("pos_auth_token");
  const response = await fetch(`${API_URL}/usuarios`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error("Error al cargar usuarios");
  }
  
  const data = await response.json();
  
  // Mapear respuesta al formato del frontend
  return data.map((user: any) => ({
    id: user.id,
    nombre: user.nombre_completo,
    email: user.email,
    pin: user.pin_hash,
    rol: user.rol,
    activo: user.activo,
    esTu: false,
  }));
}

// CREAR USUARIO
export async function crearUsuario(usuario: Omit<Usuario, "id">): Promise<Usuario> {
  const token = localStorage.getItem("pos_auth_token");
  
  const rolId = ROL_IDS[usuario.rol];
  if (!rolId) {
    throw new Error(`Rol no válido: ${usuario.rol}`);
  }
  
  const response = await fetch(`${API_URL}/usuarios`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nombre_completo: usuario.nombre,
      email: usuario.email,
      pin_hash: usuario.pin,
      rol_id: rolId,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al crear usuario");
  }
  
  const data = await response.json();
  
  return {
    id: data.id,
    nombre: data.nombre_completo,
    email: data.email,
    pin: data.pin_hash,
    rol: data.rol,
    activo: data.activo,
    esTu: false,
  };
}

// ACTUALIZAR USUARIO
export async function actualizarUsuario(id: string, usuario: Partial<Usuario>): Promise<Usuario> {
  const token = localStorage.getItem("pos_auth_token");
  
  const body: any = {};
  if (usuario.nombre) body.nombre_completo = usuario.nombre;
  if (usuario.email) body.email = usuario.email;
  if (usuario.pin) body.pin_hash = usuario.pin;
  if (usuario.rol) body.rol_id = ROL_IDS[usuario.rol];
  if (usuario.activo !== undefined) body.activo = usuario.activo ? 1 : 0;
  
  const response = await fetch(`${API_URL}/usuarios/${id}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al actualizar usuario");
  }
  
  const data = await response.json();
  
  return {
    id: data.id,
    nombre: data.nombre_completo,
    email: data.email,
    pin: data.pin_hash,
    rol: data.rol,
    activo: data.activo,
    esTu: false,
  };
}

// ELIMINAR USUARIO
export async function eliminarUsuario(id: string): Promise<void> {
  const token = localStorage.getItem("pos_auth_token");
  
  const response = await fetch(`${API_URL}/usuarios/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al eliminar usuario");
  }
}

// OBTENER SOLO USUARIOS ACTIVOS (para el login)
export async function fetchUsuariosActivos(): Promise<Usuario[]> {
  const token = localStorage.getItem("pos_auth_token");
  const response = await fetch(`${API_URL}/usuarios`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error("Error al cargar usuarios activos");
  }
  
  const data = await response.json();
  
  
  return data
    .filter((user: any) => user.activo === 1)
    .map((user: any) => ({
      id: user.id,
      nombre: user.nombre_completo,
      email: user.email,
      pin: user.pin_hash,
      rol: user.rol,
      activo: user.activo,
      esTu: false,
    }));
}
