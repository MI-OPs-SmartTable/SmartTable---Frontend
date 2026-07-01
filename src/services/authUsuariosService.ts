import { apiClient } from "../lib/apiClient";
import type { AuthUsuarioListItem } from "../lib/mappers/usuarioMapper";

export async function fetchUsuariosParaLogin(): Promise<AuthUsuarioListItem[]> {
  return apiClient.get<AuthUsuarioListItem[]>("/auth/usuarios", false);
}
