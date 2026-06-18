import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fmt } from "../../lib/formatMoney";
import { usePosSession } from "../../context/PosSessionContext";
import { getCategoriaUi } from "../../lib/categoriaUi";
import type { CatalogoItem } from "../../lib/mappers/productoMapper";
import { fetchCatalogo, fetchCategorias } from "../../services/productosService";
import type { Categoria } from "./types/productos.types";
import {
  crearPedido,
  registrarVenta,
  totalPedido,
} from "../../services/ventasService";
import "../../styles/Dashboard.css";
import "../../styles/Ventas.css";

type CartItem = {
  variante_id: string;
  nombre: string;
  precio: number;
  cantidad: number;
};

type MetodoPago = "efectivo" | "transferencia" | "mixto";

export default function VentasPOS() {
  const { usuario, cajaId, cajaAbierta, refreshCaja } = usePosSession();
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [catFilter, setCatFilter] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPago, setShowPago] = useState(false);
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [montoEfectivo, setMontoEfectivo] = useState("");
  const [montoTransferencia, setMontoTransferencia] = useState("");
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  // UI states
  const [search, setSearch] = useState("");
  const [tabSidebar, setTabSidebar] = useState<"nuevo" | "cobrar">("nuevo");
  const [salon, setSalon] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [cat, cats] = await Promise.all([fetchCatalogo(), fetchCategorias()]);
        setCatalogo(cat);
        setCategorias(cats);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar catálogo");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return catalogo.filter((p) => {
      const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || p.categoria_id === catFilter;
      return matchSearch && matchCat;
    });
  }, [catalogo, search, catFilter]);

  const total = useMemo(
    () => cart.reduce((s, i) => s + i.precio * i.cantidad, 0),
    [cart]
  );

  const addToCart = (item: CatalogoItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.variante_id === item.variante_id);
      if (existing) {
        return prev.map((c) =>
          c.variante_id === item.variante_id ? { ...c, cantidad: c.cantidad + 1 } : c
        );
      }
      return [
        ...prev,
        {
          variante_id: item.variante_id,
          nombre: item.nombre,
          precio: item.precio,
          cantidad: 1,
        },
      ];
    });
  };

  const updateQty = (varianteId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.variante_id === varianteId ? { ...c, cantidad: c.cantidad + delta } : c
        )
        .filter((c) => c.cantidad > 0)
    );
  };

  const openPago = () => {
    setMetodo("efectivo");
    setMontoEfectivo(String(total));
    setMontoTransferencia("0");
    setShowPago(true);
  };

  const cobrar = async () => {
    if (!usuario?.id || !cajaId || cart.length === 0) return;

    const eff = metodo === "transferencia" ? 0 : Number(montoEfectivo) || 0;
    const trans = metodo === "efectivo" ? 0 : Number(montoTransferencia) || 0;
    const pagos =
      metodo === "efectivo"
        ? { monto_efectivo: total, monto_transferencia: 0 }
        : metodo === "transferencia"
          ? { monto_efectivo: 0, monto_transferencia: total }
          : { monto_efectivo: eff, monto_transferencia: trans };

    if (pagos.monto_efectivo + pagos.monto_transferencia !== total) {
      setError("Los montos deben sumar exactamente el total de la venta");
      return;
    }

    setProcessing(true);
    setError("");
    try {
      const pedido = await crearPedido({
        usuario_id: usuario.id,
        caja_id: cajaId,
        items: cart.map((c) => ({ variante_id: c.variante_id, cantidad: c.cantidad })),
      });

      const pedidoTotal = totalPedido(pedido);
      if (Math.abs(pedidoTotal - total) > 0.01) {
        throw new Error("El total del pedido no coincide con el carrito");
      }

      await registrarVenta({
        pedido_id: pedido.id,
        caja_id: cajaId,
        pagos,
      });

      setCart([]);
      setShowPago(false);
      setSuccessMsg("Venta registrada correctamente");
      await refreshCaja();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al registrar venta");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="db-card">
        <div className="db-card-title">Punto de Venta</div>
        <p style={{ color: "var(--muted)" }}>Cargando catálogo...</p>
      </div>
    );
  }

  return (
    <div className="ventas-root">
      <div className="ventas-main">
        <div className="ventas-search-wrapper">
          <span className="ventas-search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            className="ventas-search-input"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ventas-filtros">
          <button
            type="button"
            className={`ventas-filtro${catFilter === "all" ? " active" : ""}`}
            onClick={() => setCatFilter("all")}
          >
            Todos
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`ventas-filtro${catFilter === c.id ? " active" : ""}`}
              onClick={() => setCatFilter(c.id)}
            >
              {c.emoji} {c.nombre}
            </button>
          ))}
        </div>

        <div className="ventas-grid">
          {filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", gridColumn: "1 / -1" }}>
              Sin productos
            </div>
          ) : (
            filtered.map((p) => {
              const cat = categorias.find((c) => c.id === p.categoria_id);
              const ui = getCategoriaUi(cat?.nombre ?? "");
              return (
                <button
                  key={p.variante_id}
                  type="button"
                  className="ventas-producto"
                  onClick={() => addToCart(p)}
                  disabled={!cajaAbierta}
                >
                  <div className="ventas-producto-emoji">{ui.emoji}</div>
                  <div className="ventas-producto-info">
                    <div className="ventas-producto-nombre">{p.nombre}</div>
                    <div className="ventas-producto-precio">{fmt(p.precio)}</div>
                    {cat && <div className="ventas-producto-cat">{cat.nombre}</div>}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="ventas-sidebar">
        <div className="ventas-sidebar-tabs">
          <button 
            type="button"
            className={`ventas-sidebar-tab ${tabSidebar === "nuevo" ? "active" : ""}`} 
            onClick={() => setTabSidebar("nuevo")}
          >
            Nuevo Pedido
          </button>
          <button 
            type="button"
            className={`ventas-sidebar-tab ${tabSidebar === "cobrar" ? "active" : ""}`} 
            onClick={() => setTabSidebar("cobrar")}
          >
            Por Cobrar
          </button>
        </div>

        <div className="ventas-sidebar-content">
          {tabSidebar === "nuevo" ? (
            <>
              <div className="ventas-form-group">
                <label className="ventas-label">Salón</label>
                <select className="ventas-select" value={salon} onChange={(e) => setSalon(e.target.value)}>
                  <option value="" disabled>— Seleccionar salón —</option>
                  <option value="principal">Salón Principal</option>
                  <option value="terraza">Terraza</option>
                  <option value="vip">Salón VIP</option>
                  <option value="barra">Barra</option>
                  <option value="llevar">Para Llevar</option>
                </select>
              </div>

              <div className="ventas-banner-info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                <span>Selecciona salón y mesa para agregar productos</span>
              </div>

              {!cajaAbierta && (
                <div className="ventas-banner-warning">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  <span>Debe abrir la caja antes de registrar ventas</span>
                </div>
              )}

              {error && (
                <div className="ventas-banner-error">{error}</div>
              )}

              {successMsg && (
                <div className="ventas-banner-success">{successMsg}</div>
              )}

              {cart.length === 0 ? (
                <div className="ventas-empty-cart">
                  <div className="ventas-empty-cart-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                  </div>
                  <div>Agrega productos al pedido</div>
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ flex: 1, overflowY: "auto", borderTop: "1px solid var(--line)" }}>
                    {cart.map((item) => (
                      <div key={item.variante_id} className="ventas-carrito-item">
                        <div>
                          <div style={{ fontWeight: 500, color: "var(--text)" }}>{item.nombre}</div>
                          <div style={{ fontSize: 13, color: "var(--orange)" }}>{fmt(item.precio)} c/u</div>
                        </div>
                        <div className="ventas-carrito-qty">
                          <button type="button" onClick={() => updateQty(item.variante_id, -1)}>−</button>
                          <span>{item.cantidad}</span>
                          <button type="button" onClick={() => updateQty(item.variante_id, 1)}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="ventas-total">
                    <span>Total</span>
                    <span>{fmt(total)}</span>
                  </div>
                  
                  <button
                    type="button"
                    className="ventas-cobrar"
                    disabled={!cajaAbierta || cart.length === 0 || !salon}
                    onClick={openPago}
                  >
                    Cobrar
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="ventas-empty-cart">
              <div>No hay pedidos por cobrar</div>
            </div>
          )}
        </div>
      </div>

      {showPago && (
        <div className="caja-modal-overlay">
          <div className="caja-modal">
            <div className="caja-modal-header">
              <div className="caja-modal-title">Registrar pago — {fmt(total)}</div>
              <button type="button" className="caja-modal-close" onClick={() => setShowPago(false)}>×</button>
            </div>
            <div className="caja-modal-body">
              <div className="caja-modal-field">
                <label>Método</label>
                <select
                  value={metodo}
                  onChange={(e) => {
                    const m = e.target.value as MetodoPago;
                    setMetodo(m);
                    if (m === "efectivo") {
                      setMontoEfectivo(String(total));
                      setMontoTransferencia("0");
                    } else if (m === "transferencia") {
                      setMontoEfectivo("0");
                      setMontoTransferencia(String(total));
                    }
                  }}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="mixto">Mixto</option>
                </select>
              </div>
              {metodo !== "transferencia" && (
                <div className="caja-modal-field">
                  <label>Efectivo</label>
                  <input
                    value={montoEfectivo}
                    onChange={(e) => setMontoEfectivo(e.target.value.replace(/\D/g, ""))}
                    disabled={metodo === "efectivo"}
                  />
                </div>
              )}
              {metodo !== "efectivo" && (
                <div className="caja-modal-field">
                  <label>Transferencia</label>
                  <input
                    value={montoTransferencia}
                    onChange={(e) => setMontoTransferencia(e.target.value.replace(/\D/g, ""))}
                    disabled={metodo === "transferencia"}
                  />
                </div>
              )}
            </div>
            <div className="caja-modal-acts">
              <button type="button" className="caja-btn-cancel" onClick={() => setShowPago(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="caja-btn-submit"
                disabled={processing}
                onClick={cobrar}
              >
                {processing ? "Procesando..." : "Confirmar venta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
