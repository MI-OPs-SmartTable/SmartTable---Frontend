import type { Usuario } from "../../pages/dashboard/types/config.types";

export type AuthUsuarioListItem = {
  id: string;
  nombre_completo: string;
  rol: string;
};

export function mapUsuarioFromApi(user: {
  id: string;
  nombre_completo: string;
  email?: string;
  rol?: string;
  activo?: number | boolean;
}): Usuario {
  return {
    id: user.id,
    nombre: user.nombre_completo,
    email: user.email ?? "",
    pin: "",
    rol: (user.rol ?? "cajero") as Usuario["rol"],
    activo: user.activo === undefined ? true : user.activo === 1 || user.activo === true,
    esTu: false,
  };
}

export function mapAuthUsuarioToLoginOption(user: AuthUsuarioListItem) {
  return {
    id: user.id,
    username: user.nombre_completo,
    nombre: user.nombre_completo,
    rol: user.rol,
  };
}
