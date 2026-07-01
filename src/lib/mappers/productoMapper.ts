import { enrichCategoria } from "../categoriaUi";
import type { Categoria, Insumo, Producto, ProductoInsumo } from "../../pages/dashboard/types/productos.types";

type ApiInsumoReceta = {
  insumo_id: string;
  cantidad?: number;
  cantidad_requerida?: number;
};

type ApiProductoBase = {
  id: string;
  categoria_id: string;
  nombre: string;
  descripcion?: string | null;
  activo?: number | boolean;
  variante_id?: string;
  precio?: number;
  insumos?: ApiInsumoReceta[];
  variantes?: { id: string; precio: number; nombre?: string }[];
};

export type CatalogoItem = {
  variante_id: string;
  producto_id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria_id: string;
};

export function mapInsumoFromApi(row: {
  id: string;
  nombre: string;
  unidad: string;
}): Insumo {
  return { id: row.id, nombre: row.nombre, unidad: row.unidad };
}

export function mapCategoriaFromApi(row: { id: string; nombre: string }): Categoria {
  return enrichCategoria({ id: row.id, nombre: row.nombre });
}

export function mapProductoFromApi(row: ApiProductoBase): Producto {
  const insumos: ProductoInsumo[] = (row.insumos ?? []).map((i) => ({
    insumoId: i.insumo_id,
    cantidad: Number(i.cantidad ?? i.cantidad_requerida ?? 0),
  }));

  const precio =
    row.precio ??
    row.variantes?.[0]?.precio ??
    0;

  const activo = row.activo === undefined ? true : row.activo === 1 || row.activo === true;

  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion ?? "",
    precio: Number(precio),
    categoriaId: row.categoria_id,
    activo,
    insumos,
    varianteId: row.variante_id,
  } as Producto & { varianteId?: string };
}

export function mapProductoToCreateApi(
  producto: Omit<Producto, "id"> | Producto
): Record<string, unknown> {
  return {
    categoria_id: producto.categoriaId,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precio: producto.precio,
    insumos: producto.insumos.map((i) => ({
      insumo_id: i.insumoId,
      cantidad: i.cantidad,
    })),
  };
}

export function mapProductoToUpdateApi(producto: Partial<Producto>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (producto.categoriaId !== undefined) body.categoria_id = producto.categoriaId;
  if (producto.nombre !== undefined) body.nombre = producto.nombre;
  if (producto.descripcion !== undefined) body.descripcion = producto.descripcion;
  return body;
}

export function mapCatalogoFromApi(row: ApiProductoBase): CatalogoItem {
  return {
    variante_id: String(row.variante_id),
    producto_id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion ?? "",
    precio: Number(row.precio ?? 0),
    categoria_id: row.categoria_id,
  };
}
