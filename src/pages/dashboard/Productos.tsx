import { useState, useEffect, useMemo, useCallback } from "react";
import type { Producto, Categoria, Insumo } from "./types/productos.types";
import { fetchProductos, fetchCategorias, fetchInsumos, crearProducto, actualizarProducto, eliminarProducto } from "../../services/productosService";
import { fmt } from "../../data/seedData";
import ProductModal from "../../components/ProductModal";
import DeleteConfirm from "../../components/DeleteConfirm";
import "../../styles/Productos.css";

// ============================================
// ICONOS
// ============================================
const I = {
  plus: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"productos" | "categorias">("productos");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [modal, setModal] = useState<"new" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Producto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Producto | null>(null);

  // Cargar datos desde BD
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      const [prods, cats, ins] = await Promise.all([
        fetchProductos(),
        fetchCategorias(),
        fetchInsumos(),
      ]);
      setProductos(prods);
      setCategorias(cats);
      setInsumos(ins);
      setLoading(false);
    };
    cargarDatos();
  }, []);

  // Filtrar productos
  const filtered = useMemo(() => {
    return productos.filter(p => {
      const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) || p.descripcion.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || p.categoriaId === catFilter;
      return matchSearch && matchCat;
    });
  }, [productos, search, catFilter]);

  const catOf = (id: string) => categorias.find(c => c.id === id);
  
  const catCounts = useMemo(() => {
    const m: Record<string, number> = {};
    productos.forEach(p => { m[p.categoriaId] = (m[p.categoriaId] ?? 0) + 1; });
    return m;
  }, [productos]);

  const handleSave = useCallback(async (p: Producto) => {
    try {
      let saved: Producto;
      const exists = productos.some(ex => ex.id === p.id);
      if (exists) {
        saved = await actualizarProducto(p.id, p);
        setProductos(prev => prev.map(pr => pr.id === p.id ? saved : pr));
      } else {
        saved = await crearProducto(p);
        setProductos(prev => [...prev, saved]);
      }
    } catch (error) {
      console.error("Error guardando producto:", error);
    }
  }, [productos]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await eliminarProducto(deleteTarget.id);
      setProductos(prev => prev.filter(p => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error eliminando producto:", error);
    }
  }, [deleteTarget]);

  if (loading) {
    return (
      <div className="pr-root">
        <div className="pr-header">
          <div><h1 className="pr-title">Productos</h1><p className="pr-sub">Cargando...</p></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pr-root">
        {/* Header */}
        <div className="pr-header">
          <div>
            <h1 className="pr-title">Productos</h1>
            <p className="pr-sub">{productos.length} productos · {categorias.length} categorías</p>
          </div>
          <button className="pr-btn-new" onClick={() => { setEditTarget(null); setModal("new"); }}>{I.plus} Nuevo Producto</button>
        </div>

        {/* Tabs */}
        <div className="pr-tabs">
          <button className={`pr-tab${tab === "productos" ? " active" : ""}`} onClick={() => setTab("productos")}>Productos ({productos.length})</button>
          <button className={`pr-tab${tab === "categorias" ? " active" : ""}`} onClick={() => setTab("categorias")}>Categorías ({categorias.length})</button>
        </div>

        {tab === "productos" ? (
          <>
            <div className="pr-toolbar">
              <div className="pr-search-wrap">
                <span className="pr-search-icon">{I.search}</span>
                <input className="pr-search" placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="pr-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                <option value="all">Todas las categorías</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>)}
              </select>
            </div>

            <div className="pr-table-wrap">
              <table className="pr-table">
                <thead>
                  <tr><th>Producto</th><th>Categoría</th><th style={{ textAlign: "right" }}>Precio</th><th style={{ textAlign: "center" }}>Estado</th><th style={{ textAlign: "right" }}>Acciones</th></tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5}><div className="pr-empty"><div className="pr-empty-icon">🔍</div><div className="pr-empty-title">Sin resultados</div></div></td></tr>
                  ) : (
                    filtered.map(p => {
                      const cat = catOf(p.categoriaId);
                      return (
                        <tr key={p.id}>
                          <td><div className="pr-prod-cell"><div className="pr-prod-emoji">{p.emoji ?? "📦"}</div><div><div className="pr-prod-name">{p.nombre}</div>{p.descripcion && <div className="pr-prod-desc">{p.descripcion}</div>}</div></div></td>
                          <td>{cat && <span className="pr-cat-pill" style={{ background: cat.color }}>{cat.emoji} {cat.nombre}</span>}</td>
                          <td className="pr-price">{fmt(p.precio)}</td>
                          <td style={{ textAlign: "center" }}><span className={`pr-status ${p.activo ? "active" : "inactive"}`}>{p.activo ? "Activo" : "Inactivo"}</span></td>
                          <td><div className="pr-actions"><button className="pr-action-btn" title="Editar" onClick={() => { setEditTarget(p); setModal("edit"); }}>{I.edit}</button><button className="pr-action-btn danger" title="Eliminar" onClick={() => setDeleteTarget(p)}>{I.trash}</button></div></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="pr-cats-grid">
            {categorias.map(c => (
              <div key={c.id} className="pr-cat-card">
                <div className="pr-cat-dot" style={{ background: `${c.color}18` }}><span style={{ fontSize: 20 }}>{c.emoji}</span></div>
                <div><div className="pr-cat-name">{c.nombre}</div><div className="pr-cat-count">{catCounts[c.id] ?? 0} productos</div></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(modal === "new" || modal === "edit") && <ProductModal editTarget={modal === "edit" ? editTarget : null} productos={productos} categorias={categorias} insumos={insumos} onClose={() => setModal(null)} onSave={handleSave} />}
      {deleteTarget && <DeleteConfirm nombre={deleteTarget.nombre} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />}
    </>
  );
}