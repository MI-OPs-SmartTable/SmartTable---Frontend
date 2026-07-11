import { apiClient } from "../lib/apiClient";
import type { NuevoProveedorForm, Proveedor } from "../pages/dashboard/types/proveedores.types";

type ProveedorApi = {
  id: string;
  nombre_empresa: string;
  persona_contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  activo?: number;
};

function mapFromApi(row: ProveedorApi): Proveedor {
  return {
    id: row.id,
    nombreEmpresa: row.nombre_empresa || "",
    contacto: row.persona_contacto || "",
    telefono: row.telefono || "",
    email: row.email || "",
    direccion: row.direccion || "",
  };
}

function mapToApi(form: NuevoProveedorForm) {
  return {
    nombre_empresa: form.nombreEmpresa.trim(),
    persona_contacto: form.contacto.trim() || null,
    telefono: form.telefono.trim() || null,
    email: form.email.trim() || null,
    direccion: form.direccion.trim() || null,
  };
}

export async function fetchProveedores(): Promise<Proveedor[]> {
  const data = await apiClient.get<ProveedorApi[]>("/proveedores");
  return data.map(mapFromApi);
}

export async function crearProveedor(form: NuevoProveedorForm): Promise<Proveedor> {
  const data = await apiClient.post<ProveedorApi>("/proveedores", mapToApi(form));
  return mapFromApi(data);
}

export async function actualizarProveedor(id: string, form: NuevoProveedorForm): Promise<Proveedor> {
  const data = await apiClient.put<ProveedorApi>(`/proveedores/${id}`, mapToApi(form));
  return mapFromApi(data);
}

export async function eliminarProveedor(id: string): Promise<void> {
  await apiClient.delete(`/proveedores/${id}`);
}
