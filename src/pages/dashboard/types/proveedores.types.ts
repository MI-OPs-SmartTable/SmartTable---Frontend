export interface Proveedor {
  id: string;
  nombreEmpresa: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
  productos: string;
  insumos: string[];
}

export interface NuevoProveedorForm {
  nombreEmpresa: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
  productos: string;
}

export const emptyForm: NuevoProveedorForm = {
  nombreEmpresa: "",
  contacto: "",
  telefono: "",
  email: "",
  direccion: "",
  productos: "",
};

export const proveedoresIniciales: Proveedor[] = [
  {
    id: "1",
    nombreEmpresa: "Distribuidora El Sol",
    contacto: "Juan Pérez",
    telefono: "3201234567",
    email: "elsol@email.com",
    direccion: "Cra 45 #12-34",
    productos: "Harinas, papas, verduras",
    insumos: ["Pan de hamburguesa", "Lechuga", "Tomate", "Papa", "Cebolla", "Aceite", "Sal", "Queso"],
  },
  {
    id: "2",
    nombreEmpresa: "Frigorífico Andino",
    contacto: "María Torres",
    telefono: "3109876543",
    email: "andino@email.com",
    direccion: "Av 68 #23-45",
    productos: "Carnes, embutidos",
    insumos: ["Carne de res (100g)", "Queso tajado", "Chicharrón", "Salchicha"],
  },
  {
    id: "3",
    nombreEmpresa: "Bebidas del Valle",
    contacto: "Carlos Ruiz",
    telefono: "3157894561",
    email: "bebidasvalle@email.com",
    direccion: "Cl 10 #5-20",
    productos: "Gaseosas, jugos, agua",
    insumos: ["Coca-Cola 400ml", "Jugo de mango", "Agua 600ml"],
  },
];

export const crearProveedor = (form: NuevoProveedorForm, proveedoresActuales: Proveedor[]): Proveedor[] => {
  const nuevo: Proveedor = {
    id: crypto.randomUUID(),
    nombreEmpresa: form.nombreEmpresa,
    contacto: form.contacto,
    telefono: form.telefono,
    email: form.email,
    direccion: form.direccion,
    productos: form.productos,
    insumos: [],
  };
  return [...proveedoresActuales, nuevo];
};

export const eliminarProveedor = (id: string, proveedoresActuales: Proveedor[]): Proveedor[] => {
  return proveedoresActuales.filter((p: Proveedor) => p.id !== id);
};

export const filtrarProveedores = (proveedores: Proveedor[], busqueda: string): Proveedor[] => {
  const texto = busqueda.toLowerCase();
  return proveedores.filter((p: Proveedor) => 
    p.nombreEmpresa.toLowerCase().includes(texto) ||
    p.productos.toLowerCase().includes(texto) ||
    p.insumos.some((i: string) => i.toLowerCase().includes(texto))
  );
};