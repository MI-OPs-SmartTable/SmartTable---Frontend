import { apiClient } from "../lib/apiClient";
import { mapUsuarioFromApi } from "../lib/mappers/usuarioMapper";
import { getRolIdByNombre } from "./rolesService";
import type { Usuario } from "../pages/dashboard/types/config.types";

export async function fetchUsuarios(): Promise<Usuario[]> {
  const data = await apiClient.get<
    { id: string; nombre_completo: string; email: string; rol: string; activo: number }[]
  >("/usuarios");
  return data.map(mapUsuarioFromApi);
}

export async function crearUsuario(usuario: Omit<Usuario, "id">): Promise<Usuario> {
  const rolId = await getRolIdByNombre(usuario.rol);

  const data = await apiClient.post<{ id: string; nombre_completo: string; email: string; rol: string; activo: number }>(
    "/usuarios",
    {
      nombre_completo: usuario.nombre,
      email: usuario.email || `${usuario.nombre.replace(/\s+/g, ".").toLowerCase()}@pos.local`,
      pin: usuario.pin,
      rol_id: rolId,
    }
  );

  return mapUsuarioFromApi(data);
}

export async function actualizarUsuario(id: string, usuario: Partial<Usuario>): Promise<Usuario> {
  const body: Record<string, unknown> = {};
  if (usuario.nombre) body.nombre_completo = usuario.nombre;
  if (usuario.email) body.email = usuario.email;
  if (usuario.pin) body.pin = usuario.pin;
  if (usuario.rol) body.rol_id = await getRolIdByNombre(usuario.rol);
  if (usuario.activo !== undefined) body.activo = usuario.activo ? 1 : 0;

  const data = await apiClient.put<{
    id: string;
    nombre_completo: string;
    email: string;
    rol: string;
    activo: number;
  }>(`/usuarios/${id}`, body);

  return mapUsuarioFromApi(data);
}

export async function eliminarUsuario(id: string): Promise<void> {
  await apiClient.delete(`/usuarios/${id}`);
}
