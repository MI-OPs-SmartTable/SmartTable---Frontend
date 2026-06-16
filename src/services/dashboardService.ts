import { getCategoriaUi } from "../lib/categoriaUi";
import { fetchCategorias } from "./productosService";
import { fetchInsumosStockBajo, type InsumoStockBajo } from "./insumosService";
import type { CatalogoItem } from "../lib/mappers/productoMapper";
import { fetchCatalogo } from "./productosService";
import { fetchPedido, fetchVentas, type VentaApi } from "./ventasService";

export type DashboardStats = {
  ventasHoy: number;
  efectivoHoy: number;
  transferenciaHoy: number;
  stockBajoCount: number;
  stockBajo: InsumoStockBajo[];
  barras7Dias: { label: string; total: number; heightPct: number }[];
  porCategoria: { nombre: string; total: number; color: string }[];
  topProductos: { nombre: string; cantidad: number }[];
  ultimasVentas: { id: string; total: number; metodo: string; hora: string }[];
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseDate(value: string): Date {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  return new Date(normalized);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const DAY_LABELS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export async function getDashboardStats(): Promise<DashboardStats> {
  const [ventas, stockBajo, catalogo, categorias] = await Promise.all([
    fetchVentas(),
    fetchInsumosStockBajo(),
    fetchCatalogo(),
    fetchCategorias(),
  ]);

  const catNombreById = new Map(categorias.map((c) => [c.id, c.nombre]));

  const hoy = startOfDay(new Date());
  const ventasHoyList = ventas.filter((v) => isSameDay(parseDate(v.pagado_at), hoy));

  const ventasHoy = ventasHoyList.reduce((s, v) => s + Number(v.total), 0);
  const efectivoHoy = ventasHoyList.reduce((s, v) => s + Number(v.monto_efectivo), 0);
  const transferenciaHoy = ventasHoyList.reduce((s, v) => s + Number(v.monto_transferencia), 0);

  const barrasRaw: { label: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(hoy);
    day.setDate(day.getDate() - i);
    const total = ventas
      .filter((v) => isSameDay(parseDate(v.pagado_at), day))
      .reduce((s, v) => s + Number(v.total), 0);
    barrasRaw.push({ label: DAY_LABELS[day.getDay()], total });
  }
  const maxBar = Math.max(...barrasRaw.map((b) => b.total), 1);
  const barras7Dias = barrasRaw.map((b) => ({
    ...b,
    heightPct: b.total === 0 ? 4 : Math.round((b.total / maxBar) * 100),
  }));

  const varianteMap = new Map<string, CatalogoItem>();
  catalogo.forEach((c) => varianteMap.set(c.variante_id, c));

  const categoriaTotals = new Map<string, number>();
  const productoCounts = new Map<string, number>();

  const recentVentas = [...ventas]
    .sort((a, b) => parseDate(b.pagado_at).getTime() - parseDate(a.pagado_at).getTime())
    .slice(0, 30);

  await Promise.all(
    recentVentas.map(async (venta) => {
      try {
        const pedido = await fetchPedido(venta.pedido_id);
        for (const item of pedido.items ?? []) {
          const catItem = varianteMap.get(item.variante_id);
          const nombreProducto = catItem?.nombre ?? item.variante_nombre ?? "Producto";
          const catId = catItem?.categoria_id ?? "otros";
          categoriaTotals.set(
            catId,
            (categoriaTotals.get(catId) ?? 0) + item.cantidad * item.precio_unitario
          );
          productoCounts.set(
            nombreProducto,
            (productoCounts.get(nombreProducto) ?? 0) + Number(item.cantidad)
          );
        }
      } catch {
        /* pedido no disponible */
      }
    })
  );

  const porCategoria = Array.from(categoriaTotals.entries())
    .map(([catId, total]) => {
      const nombre = catNombreById.get(catId) ?? "Otros";
      const ui = getCategoriaUi(nombre);
      return { nombre, total, color: ui.color };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  const topProductos = Array.from(productoCounts.entries())
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  const ultimasVentas = ventas
    .sort((a, b) => parseDate(b.pagado_at).getTime() - parseDate(a.pagado_at).getTime())
    .slice(0, 5)
    .map((v: VentaApi) => ({
      id: v.id,
      total: Number(v.total),
      metodo: v.metodo_pago,
      hora: parseDate(v.pagado_at).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

  return {
    ventasHoy,
    efectivoHoy,
    transferenciaHoy,
    stockBajoCount: stockBajo.length,
    stockBajo,
    barras7Dias,
    porCategoria,
    topProductos,
    ultimasVentas,
  };
}
