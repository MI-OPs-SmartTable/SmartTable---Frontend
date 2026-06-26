import { apiClient } from "../lib/apiClient";

export type RolApi = { id: string; nombre: string };

let rolesCache: RolApi[] | null = null;

export async function fetchRoles(): Promise<RolApi[]> {
  if (rolesCache) return rolesCache;
  rolesCache = await apiClient.get<RolApi[]>("/roles");
  return rolesCache;
}

export async function getRolIdByNombre(nombre: string): Promise<string> {
  const roles = await fetchRoles();
  const rol = roles.find((r) => r.nombre === nombre);
  if (!rol) throw new Error(`Rol no encontrado: ${nombre}`);
  return rol.id;
}

export function clearRolesCache() {
  rolesCache = null;
}
