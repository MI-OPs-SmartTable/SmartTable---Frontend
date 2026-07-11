import { useState, useEffect, useMemo, useCallback } from "react";
import type { Producto, Categoria, Insumo } from "./types/productos.types";
import { fetchProductos, fetchInsumos, crearProducto, actualizarProducto, eliminarProducto } from "../../services/productosService";
import {
  fetchCategoriasCrud,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "../../services/categoriasService";
import {
  fetchInsumosLista,
  fetchInsumosResumen,
  crearInsumo,
  actualizarInsumo,
  eliminarInsumo,
  type InsumoCompleto,
  type InsumoResumen,
} from "../../services/insumosService";
import { fetchProveedores } from "../../services/proveedoresService";
import { fmt } from "../../lib/formatMoney";
import ProductModal from "../../components/CrearEditarProductos";
import CategoriaModal from "../../components/CategoriaModal";
import InsumoModal from "../../components/InsumoModal";
import InsumoInventarioCard from "../../components/InsumoInventarioCard";
import DeleteConfirm from "../../components/DeleteConfirmProductos";
import ProveedoresTab from "../../components/ProveedoresTab";
import type { Proveedor } from "./types/proveedores.types";
import "../../styles/Productos.css";

const I = {
  plus: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  refresh: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>,
  box: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  alert: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  chart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  check: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
};

type Tab = "productos" | "categorias" | "insumos" | "proveedores";

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [insumosFull, setInsumosFull] = useState<InsumoCompleto[]>([]);
  const [insumosStats, setInsumosStats] = useState<InsumoResumen>({
    total: 0,
    stock_bajo: 0,
    stock_ok: 0,
    valor_inventario: 0,
  });
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("productos");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const [modal, setModal] = useState<"new" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Producto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Producto | null>(null);

  const [catModal, setCatModal] = useState<"new" | "edit" | null>(null);
  const [editCat, setEditCat] = useState<Categoria | null>(null);
  const [deleteCat, setDeleteCat] = useState<Categoria | null>(null);

  const [insumoModal, setInsumoModal] = useState<"new" | "edit" | null>(null);
  const [editInsumo, setEditInsumo] = useState<InsumoCompleto | null>(null);
  const [deleteInsumo, setDeleteInsumo] = useState<InsumoCompleto | null>(null);
  const [insumoSearch, setInsumoSearch] = useState("");
  const [insumoStockFilter, setInsumoStockFilter] = useState<"all" | "bajo" | "ok">("all");
  const [expandedInsumoId, setExpandedInsumoId] = useState<string | null>(null);

  const [abrirModalProveedor, setAbrirModalProveedor] = useState<boolean>(false);
  const [refrescando, setRefrescando] = useState(false);

  const cargarDatos = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (silent) setRefrescando(true);
    else setLoading(true);
    setError("");
    try {
      const [prods, cats, insList, insFull, insResumen, provs] = await Promise.all([
        fetchProductos(),
        fetchCategoriasCrud(),
        fetchInsumos(),
        fetchInsumosLista(),
        fetchInsumosResumen(),
        fetchProveedores(),
      ]);
      setProductos(prods);
      setCategorias(cats);
      setInsumos(insList);
      setInsumosFull(insFull);
      setInsumosStats(insResumen);
      setProveedores(provs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo conectar con el servidor");
    } finally {
      if (silent) setRefrescando(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const filtered = useMemo(() => {
    return productos.filter((p) => {
      const matchSearch =
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || p.categoriaId === catFilter;
      return matchSearch && matchCat;
    });
  }, [productos, search, catFilter]);

  const esStockBajo = (i: InsumoCompleto) =>
    (i.cantidad_actual ?? 0) <= (i.stock_minimo ?? 0);

  const insumosFiltrados = useMemo(() => {
    const q = insumoSearch.trim().toLowerCase();
    return insumosFull.filter((i) => {
      const proveedor = proveedores.find((p) => p.id === i.proveedor_id);
      const matchSearch =
        !q ||
        i.nombre.toLowerCase().includes(q) ||
        i.unidad.toLowerCase().includes(q) ||
        (proveedor?.nombreEmpresa.toLowerCase().includes(q) ?? false);
      const bajo = esStockBajo(i);
      const matchStock =
        insumoStockFilter === "all" ||
        (insumoStockFilter === "bajo" && bajo) ||
        (insumoStockFilter === "ok" && !bajo);
      return matchSearch && matchStock;
    });
  }, [insumosFull, proveedores, insumoSearch, insumoStockFilter]);

  const catOf = (id: string) => categorias.find((c) => c.id === id);

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {};
    productos.forEach((p) => {
      m[p.categoriaId] = (m[p.categoriaId] ?? 0) + 1;
    });
    return m;
  }, [productos]);

  const handleSaveProducto = useCallback(
    async (p: Producto) => {
      try {
        if (p.id) {
          await actualizarProducto(p.id, p);
        } else {
          await crearProducto(p);
        }
        await cargarDatos();
        setModal(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al guardar producto";
        setError(message);
        throw err;
      }
    },
    [cargarDatos]
  );

  const handleDeleteProducto = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await eliminarProducto(deleteTarget.id);
      setDeleteTarget(null);
      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar producto");
    }
  }, [deleteTarget, cargarDatos]);

  const handleSaveCategoria = async (nombre: string, emoji: string) => {
    try {
      if (editCat) {
        await actualizarCategoria(editCat.id, nombre, emoji);
      } else {
        await crearCategoria(nombre, emoji);
      }
      await cargarDatos();
      setCatModal(null);
      setEditCat(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar categoría");
      throw err;
    }
  };

  const handleDeleteCategoria = async () => {
    if (!deleteCat) return;
    try {
      await eliminarCategoria(deleteCat.id);
      setDeleteCat(null);
      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar categoría");
    }
  };

  const handleSaveInsumo = async (data: {
    nombre: string;
    unidad: string;
    cantidad_actual?: number;
    stock_minimo?: number;
    costo_unitario?: number;
    proveedor_id?: string;
  }) => {
    try {
      if (editInsumo) {
        await actualizarInsumo(editInsumo.id, data);
      } else {
        await crearInsumo(data);
      }
      await cargarDatos({ silent: true });
      setInsumoModal(null);
      setEditInsumo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar insumo");
      throw err;
    }
  };

  const handleDeleteInsumo = async () => {
    if (!deleteInsumo) return;
    try {
      await eliminarInsumo(deleteInsumo.id);
      setDeleteInsumo(null);
      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar insumo");
    }
  };

  const newButton = () => {
    if (tab === "productos") {
      setEditTarget(null);
      setModal("new");
    } else if (tab === "categorias") {
      setEditCat(null);
      setCatModal("new");
    } else if (tab === "insumos") {
      setEditInsumo(null);
      setInsumoModal("new");
    } else if (tab === "proveedores") {
      setAbrirModalProveedor(true);
    }
  };

  const showNewButton = true;

  const newButtonLabel =
    tab === "productos" ? "Nuevo Producto" : 
    tab === "categorias" ? "Nueva Categoría" : 
    tab === "insumos" ? "Nuevo Insumo" : 
    "Nuevo Proveedor";

  if (loading) {
    return (
      <div className="pr-root">
        <div className="pr-header">
          <div><h1 className="pr-title">Productos</h1><p className="pr-sub">Cargando...</p></div>
        </div>
      </div>
    );
  }

  if (error && productos.length === 0 && categorias.length === 0) {
    return (
      <div className="pr-root">
        <div className="pr-header">
          <div>
            <h1 className="pr-title">Productos</h1>
            <p className="pr-sub" style={{ color: "var(--err)" }}>{error}</p>
            <p className="pr-sub">Si la base está vacía, ejecute en el backend: npm run seed:pos</p>
          </div>
          <button type="button" className="pr-btn-new" onClick={() => cargarDatos()}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pr-root">
        <div className="pr-header">
          <div>
            <h1 className="pr-title">{tab === "insumos" ? "Inventario" : "Productos"}</h1>
            <p className="pr-sub">
              {tab === "insumos"
                ? `${insumosStats.total} insumos · Valor total: ${fmt(insumosStats.valor_inventario)}`
                : `${productos.length} productos · ${categorias.length} categorías · ${insumos.length} insumos · ${proveedores.length} proveedores`}
              {error ? ` · ${error}` : ""}
            </p>
          </div>
          {showNewButton && (
            <button type="button" className="pr-btn-new" onClick={newButton}>
              {I.plus} {newButtonLabel}
            </button>
          )}
        </div>

        <div className="pr-tabs">
          <button type="button" className={`pr-tab${tab === "productos" ? " active" : ""}`} onClick={() => setTab("productos")}>
            Productos ({productos.length})
          </button>
          <button type="button" className={`pr-tab${tab === "categorias" ? " active" : ""}`} onClick={() => setTab("categorias")}>
            Categorías ({categorias.length})
          </button>
          <button type="button" className={`pr-tab${tab === "insumos" ? " active" : ""}`} onClick={() => setTab("insumos")}>
            Insumos ({insumos.length})
          </button>
          <button type="button" className={`pr-tab${tab === "proveedores" ? " active" : ""}`} onClick={() => setTab("proveedores")}>
            Proveedores ({proveedores.length})
          </button>
        </div>

        {tab === "productos" && (
          <>
            <div className="pr-toolbar">
              <div className="pr-search-wrap">
                <span className="pr-search-icon">{I.search}</span>
                <input className="pr-search" placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select className="pr-select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
                <option value="all">Todas las categorías</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="pr-table-wrap">
              <table className="pr-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th style={{ textAlign: "right" }}>Precio</th>
                    <th style={{ textAlign: "center" }}>Estado</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="pr-empty">
                          <div className="pr-empty-icon">🔍</div>
                          <div className="pr-empty-title">Sin resultados</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => {
                      const cat = catOf(p.categoriaId);
                      return (
                        <tr key={p.id}>
                          <td>
                            <div className="pr-prod-cell">
                              <div className="pr-prod-emoji">{p.emoji ?? "📦"}</div>
                              <div>
                                <div className="pr-prod-name">{p.nombre}</div>
                                {p.descripcion && <div className="pr-prod-desc">{p.descripcion}</div>}
                              </div>
                            </div>
                          </td>
                          <td>
                            {cat && (
                              <span className="pr-cat-pill" style={{ background: cat.color }}>
                                {cat.emoji} {cat.nombre}
                              </span>
                            )}
                          </td>
                          <td className="pr-price">{fmt(p.precio)}</td>
                          <td style={{ textAlign: "center" }}>
                            <span className={`pr-status ${p.activo ? "active" : "inactive"}`}>
                              {p.activo ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td>
                            <div className="pr-actions">
                              <button type="button" className="pr-action-btn" title="Editar" onClick={() => { setEditTarget(p); setModal("edit"); }}>{I.edit}</button>
                              <button type="button" className="pr-action-btn danger" title="Eliminar" onClick={() => setDeleteTarget(p)}>{I.trash}</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "categorias" && (
          <div className="pr-table-wrap">
            <table className="pr-table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Productos</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categorias.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <div className="pr-empty">
                        <div className="pr-empty-title">Sin categorías</div>
                        <div className="pr-empty-desc">Crea la primera categoría</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  categorias.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <span className="pr-cat-pill" style={{ background: c.color }}>
                          {c.emoji} {c.nombre}
                        </span>
                      </td>
                      <td>{catCounts[c.id] ?? 0}</td>
                      <td>
                        <div className="pr-actions">
                          <button type="button" className="pr-action-btn" onClick={() => { setEditCat(c); setCatModal("edit"); }}>{I.edit}</button>
                          <button type="button" className="pr-action-btn danger" onClick={() => setDeleteCat(c)}>{I.trash}</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "insumos" && (
          <>
            <div className="pr-inv-cards-head">
              <button
                type="button"
                className="pr-inv-refresh"
                disabled={refrescando}
                onClick={() => cargarDatos({ silent: true })}
              >
                <span className={refrescando ? "pr-inv-refresh-spin" : undefined}>{I.refresh}</span>
                {refrescando ? "Actualizando…" : "Actualizar"}
              </button>
            </div>

            <div className={`pr-inv-cards${refrescando ? " pr-inv-cards--busy" : ""}`}>
              <div className="pr-inv-card">
                <span className="pr-inv-card-icon">{I.box}</span>
                <span className="pr-inv-card-label">Total Insumos</span>
                <span className="pr-inv-card-value">{insumosStats.total}</span>
              </div>
              <div className="pr-inv-card pr-inv-card--bajo">
                <span className="pr-inv-card-icon">{I.alert}</span>
                <span className="pr-inv-card-label">Stock Bajo</span>
                <span className="pr-inv-card-value">{insumosStats.stock_bajo}</span>
              </div>
              <div className="pr-inv-card">
                <span className="pr-inv-card-icon">{I.chart}</span>
                <span className="pr-inv-card-label">Valor Inventario</span>
                <span className="pr-inv-card-value">{fmt(insumosStats.valor_inventario)}</span>
              </div>
              <div className="pr-inv-card pr-inv-card--ok">
                <span className="pr-inv-card-icon">{I.check}</span>
                <span className="pr-inv-card-label">Stock OK</span>
                <span className="pr-inv-card-value">{insumosStats.stock_ok}</span>
              </div>
            </div>

            <div className="pr-toolbar pr-inv-toolbar">
              <div className="pr-search-wrap">
                <span className="pr-search-icon">{I.search}</span>
                <input
                  className="pr-search"
                  placeholder="Buscar insumo..."
                  value={insumoSearch}
                  onChange={(e) => setInsumoSearch(e.target.value)}
                />
              </div>
              <div className="pr-inv-filters">
                <button
                  type="button"
                  className={`pr-inv-filter${insumoStockFilter === "all" ? " active" : ""}`}
                  onClick={() => setInsumoStockFilter("all")}
                >
                  Todos
                </button>
                <button
                  type="button"
                  className={`pr-inv-filter${insumoStockFilter === "bajo" ? " active" : ""}`}
                  onClick={() => setInsumoStockFilter("bajo")}
                >
                  Stock Bajo
                </button>
                <button
                  type="button"
                  className={`pr-inv-filter${insumoStockFilter === "ok" ? " active" : ""}`}
                  onClick={() => setInsumoStockFilter("ok")}
                >
                  Stock OK
                </button>
              </div>
            </div>

            <div className="pr-ins-list">
              {insumosFiltrados.length === 0 ? (
                <div className="pr-empty">
                  <div className="pr-empty-icon">🔍</div>
                  <div className="pr-empty-title">
                    {insumosFull.length === 0 ? "Sin insumos" : "Sin resultados"}
                  </div>
                </div>
              ) : (
                insumosFiltrados.map((ins) => {
                  const proveedor = proveedores.find((p) => p.id === ins.proveedor_id);
                  return (
                    <InsumoInventarioCard
                      key={ins.id}
                      insumo={ins}
                      proveedorNombre={proveedor?.nombreEmpresa}
                      proveedores={proveedores}
                      expanded={expandedInsumoId === ins.id}
                      onToggle={() =>
                        setExpandedInsumoId((cur) => (cur === ins.id ? null : ins.id))
                      }
                      onEdit={() => {
                        setEditInsumo(ins);
                        setInsumoModal("edit");
                      }}
                      onDelete={() => setDeleteInsumo(ins)}
                      onUpdated={() => cargarDatos({ silent: true })}
                      onError={setError}
                    />
                  );
                })
              )}
            </div>
          </>
        )}

        {tab === "proveedores" && (
          <ProveedoresTab
            proveedores={proveedores}
            insumos={insumosFull}
            onChanged={cargarDatos}
            abrirModal={abrirModalProveedor}
            setAbrirModal={setAbrirModalProveedor}
            onError={setError}
          />
        )}
      </div>

      {(modal === "new" || modal === "edit") && (
        <ProductModal
          editTarget={modal === "edit" ? editTarget : null}
          productos={productos}
          categorias={categorias}
          insumos={insumos}
          onClose={() => setModal(null)}
          onSave={handleSaveProducto}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm nombre={deleteTarget.nombre} onCancel={() => setDeleteTarget(null)} onConfirm={handleDeleteProducto} />
      )}

      {(catModal === "new" || catModal === "edit") && (
        <CategoriaModal editTarget={catModal === "edit" ? editCat : null} onClose={() => { setCatModal(null); setEditCat(null); }} onSave={handleSaveCategoria} />
      )}

      {deleteCat && (
        <DeleteConfirm nombre={deleteCat.nombre} onCancel={() => setDeleteCat(null)} onConfirm={handleDeleteCategoria} />
      )}

      {(insumoModal === "new" || insumoModal === "edit") && (
        <InsumoModal 
          editTarget={insumoModal === "edit" ? editInsumo : null}
          proveedores={proveedores}
          onClose={() => { setInsumoModal(null); setEditInsumo(null); }} 
          onSave={handleSaveInsumo} 
        />
      )}

      {deleteInsumo && (
        <DeleteConfirm nombre={deleteInsumo.nombre} onCancel={() => setDeleteInsumo(null)} onConfirm={handleDeleteInsumo} />
      )}
    </>
  );
}