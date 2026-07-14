// TIPOS DE PRODUCTOS PARA LA SECCION DE PRODUCTOS

export type Categoria = {
  id: string;
  nombre: string;
  color: string;
  emoji: string;
};

export type Insumo = {
  id: string;
  nombre: string;
  unidad: string;
};

export type ProductoInsumo = {
  insumoId: string;
  cantidad: number;
};

export type Producto = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoriaId: string;
  activo: boolean;
  insumos: ProductoInsumo[];
  emoji?: string;
  varianteId?: string;
};

export type FormState = {
  nombre: string;
  descripcion: string;
  precio: string;
  categoriaId: string;
  activo: boolean;
  insumos: ProductoInsumo[];
  emoji: string;
};

export type FormErrors = { nombre?: string; precio?: string; categoriaId?: string; insumos?: string };