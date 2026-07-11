export type Proveedor = {
  id: string;
  nombreEmpresa: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
};

export type NuevoProveedorForm = {
  nombreEmpresa: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
};

export const emptyForm: NuevoProveedorForm = {
  nombreEmpresa: "",
  contacto: "",
  telefono: "",
  email: "",
  direccion: "",
};

export function filtrarProveedores(proveedores: Proveedor[], busqueda: string): Proveedor[] {
  const texto = busqueda.trim().toLowerCase();
  if (!texto) return proveedores;
  return proveedores.filter(
    (p) =>
      p.nombreEmpresa.toLowerCase().includes(texto) ||
      p.contacto.toLowerCase().includes(texto) ||
      p.email.toLowerCase().includes(texto) ||
      p.telefono.toLowerCase().includes(texto) ||
      p.direccion.toLowerCase().includes(texto)
  );
}
