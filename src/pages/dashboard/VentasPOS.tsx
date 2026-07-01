import { useCallback, useEffect, useMemo, useState } from "react";
import { fmt } from "../../lib/formatMoney";
import { usePosSession } from "../../context/PosSessionContext";
import { getCategoriaUi } from "../../lib/categoriaUi";
import type { CatalogoItem } from "../../lib/mappers/productoMapper";
import { fetchCatalogo, fetchCategorias } from "../../services/productosService";
import type { Categoria } from "./types/productos.types";
import {
  cancelarPedido,
  crearPedido,
  fetchPedidosPendientes,
  actualizarPedidoItems,
} from "../../services/pedidosService";
import {
  registrarVenta,
  totalPedido,
  type PedidoApi,
} from "../../services/ventasService";
import { fetchInsumosStockBajo, type InsumoStockBajo } from "../../services/insumosService";
import { ubicacionesService } from "../../services/ubicacionesService";
import { mesasService } from "../../services/mesasService";
import { fetchMediosPago, type MedioPagoApi } from "../../services/mediosPagoService";
import PaymentModal, { type MetodoPago } from "../../components/PaymentModal";
import "../../styles/Dashboard.css";
import "../../styles/Ventas.css";

type CartItem = {
  variante_id: string;
  nombre: string;
  precio: number;
  cantidad: number;
};

type UbicacionApi = { id: string; nombre: string };
type MesaApi = { id: string; ubicacion_id: string; nombre: string };

const MESA_POR_COBRAR_MSG = "La mesa ya tiene un pedido pendiente por cobrar";

export default function VentasPOS() {
  const { usuario, cajaId, cajaAbierta, refreshCaja } = usePosSession();
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ubicaciones, setUbicaciones] = useState<UbicacionApi[]>([]);
  const [mesas, setMesas] = useState<MesaApi[]>([]);
  const [medios, setMedios] = useState<MedioPagoApi[]>([]);
  const [stockBajo, setStockBajo] = useState<InsumoStockBajo[]>([]);
  const [pedidosPendientes, setPedidosPendientes] = useState<PedidoApi[]>([]);

  const [catFilter, setCatFilter] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [search, setSearch] = useState("");
  const [tabSidebar, setTabSidebar] = useState<"nuevo" | "cobrar">("nuevo");
  const [ubicacionId, setUbicacionId] = useState("");
  const [mesaId, setMesaId] = useState("");

  const [pedidoEnEdicion, setPedidoEnEdicion] = useState<PedidoApi | null>(null);
  const [pedidoActivo, setPedidoActivo] = useState<PedidoApi | null>(null);
  const [editCart, setEditCart] = useState<CartItem[]>([]);
  const [showPago, setShowPago] = useState(false);
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [bancoId, setBancoId] = useState("");
  const [referencia, setReferencia] = useState("");
  const [montoEfectivo, setMontoEfectivo] = useState("");
  const [montoTransferencia, setMontoTransferencia] = useState("");
  const [processing, setProcessing] = useState(false);
  const [pagoError, setPagoError] = useState("");

  const mesasFiltradas = useMemo(
    () => mesas.filter((m) => m.ubicacion_id === ubicacionId),
    [mesas, ubicacionId]
  );

  const mesasOcupadas = useMemo(
    () => new Set(pedidosPendientes.map((p) => p.mesa_id).filter(Boolean)),
    [pedidosPendientes]
  );

  const mesaTienePedidoPendiente = useCallback(
    (id: string) => Boolean(id) && mesasOcupadas.has(id),
    [mesasOcupadas]
  );

  const filtered = useMemo(() => {
    return catalogo.filter((p) => {
      const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || p.categoria_id === catFilter;
      return matchSearch && matchCat;
    });
  }, [catalogo, search, catFilter]);

  const cartTotal = useMemo(
    () => cart.reduce((s, i) => s + i.precio * i.cantidad, 0),
    [cart]
  );

  const editCartTotal = useMemo(
    () => editCart.reduce((s, i) => s + i.precio * i.cantidad, 0),
    [editCart]
  );

  const etiquetaTabNuevo = useMemo(() => {
    if (!pedidoEnEdicion) return "Nuevo Pedido";
    const mesa = mesas.find((m) => m.id === pedidoEnEdicion.mesa_id);
    const salon = mesa ? ubicaciones.find((u) => u.id === mesa.ubicacion_id) : null;
    return `${salon?.nombre ?? "Salón"} · ${mesa?.nombre ?? "Mesa"}`;
  }, [pedidoEnEdicion, mesas, ubicaciones]);

  const pedidoTotal = useMemo(() => {
    if (!pedidoActivo) return 0;
    return totalPedido(pedidoActivo);
  }, [pedidoActivo]);

  const loadPendientes = useCallback(async () => {
    if (!cajaId) {
      setPedidosPendientes([]);
      return;
    }
    const data = await fetchPedidosPendientes(cajaId);
    setPedidosPendientes(data);
  }, [cajaId]);

  const loadBase = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [cat, cats, ubi, mes, med, stock] = await Promise.all([
        fetchCatalogo(),
        fetchCategorias(),
        ubicacionesService.getAll() as Promise<UbicacionApi[]>,
        mesasService.getAll() as Promise<MesaApi[]>,
        fetchMediosPago(),
        fetchInsumosStockBajo(),
      ]);
      setCatalogo(cat);
      setCategorias(cats);
      setUbicaciones(ubi);
      setMesas(mes);
      setMedios(med);
      setStockBajo(stock);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar catálogo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBase();
  }, [loadBase]);

  useEffect(() => {
    loadPendientes().catch(() => setPedidosPendientes([]));
  }, [loadPendientes, tabSidebar, successMsg]);

  useEffect(() => {
    setMesaId("");
  }, [ubicacionId]);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const handleMesaChange = (nextMesaId: string) => {
    if (mesaTienePedidoPendiente(nextMesaId)) {
      setMesaId("");
      setError(MESA_POR_COBRAR_MSG);
      return;
    }
    setError("");
    setMesaId(nextMesaId);
  };

  const resetNuevoPedido = () => {
    setPedidoEnEdicion(null);
    setEditCart([]);
    setCart([]);
    setUbicacionId("");
    setMesaId("");
    setError("");
  };

  const addToCart = (item: CatalogoItem) => {
    if (pedidoEnEdicion) {
      if (!cajaAbierta) return;
      setError("");
      setEditCart((prev) => {
        const existing = prev.find((c) => c.variante_id === item.variante_id);
        if (existing) {
          return prev.map((c) =>
            c.variante_id === item.variante_id ? { ...c, cantidad: c.cantidad + 1 } : c
          );
        }
        return [...prev, { variante_id: item.variante_id, nombre: item.nombre, precio: item.precio, cantidad: 1 }];
      });
      return;
    }

    if (!ubicacionId || !mesaId) {
      setError("Selecciona salón y mesa antes de agregar productos");
      return;
    }
    if (mesaTienePedidoPendiente(mesaId)) {
      setError(MESA_POR_COBRAR_MSG);
      return;
    }
    setError("");
    setCart((prev) => {
      const existing = prev.find((c) => c.variante_id === item.variante_id);
      if (existing) {
        return prev.map((c) =>
          c.variante_id === item.variante_id ? { ...c, cantidad: c.cantidad + 1 } : c
        );
      }
      return [...prev, { variante_id: item.variante_id, nombre: item.nombre, precio: item.precio, cantidad: 1 }];
    });
  };

  const updateQty = (varianteId: string, delta: number, target: "cart" | "edit" = "cart") => {
    const setter = target === "cart" ? setCart : setEditCart;
    setter((prev) =>
      prev
        .map((c) => (c.variante_id === varianteId ? { ...c, cantidad: c.cantidad + delta } : c))
        .filter((c) => c.cantidad > 0)
    );
  };

  const confirmarPedido = async () => {
    if (!usuario?.id || !cajaId || cart.length === 0 || !mesaId) return;
    if (mesaTienePedidoPendiente(mesaId)) {
      setError(MESA_POR_COBRAR_MSG);
      return;
    }
    setProcessing(true);
    setError("");
    try {
      await crearPedido({
        usuario_id: usuario.id,
        caja_id: cajaId,
        mesa_id: mesaId,
        items: cart.map((c) => ({ variante_id: c.variante_id, cantidad: c.cantidad })),
      });
      setCart([]);
      setUbicacionId("");
      setMesaId("");
      await loadPendientes();
      setTabSidebar("cobrar");
      showToast("Pedido registrado. Ve a Por Cobrar para cobrarlo.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear pedido");
    } finally {
      setProcessing(false);
    }
  };

  const seleccionarPedido = (pedido: PedidoApi) => {
    const mesa = mesas.find((m) => m.id === pedido.mesa_id);
    setPedidoEnEdicion(pedido);
    setPedidoActivo(null);
    setCart([]);
    setError("");
    if (mesa) {
      setUbicacionId(mesa.ubicacion_id);
      setMesaId(mesa.id);
    }
    setEditCart(
      (pedido.items ?? []).map((item) => ({
        variante_id: item.variante_id,
        nombre: item.variante_nombre ?? "Producto",
        precio: Number(item.precio_unitario),
        cantidad: Number(item.cantidad),
      }))
    );
    setTabSidebar("nuevo");
  };

  const guardarEdicionPedido = async () => {
    if (!pedidoEnEdicion || editCart.length === 0) return;
    setProcessing(true);
    setError("");
    try {
      await actualizarPedidoItems(
        pedidoEnEdicion.id,
        editCart.map((c) => ({ variante_id: c.variante_id, cantidad: c.cantidad }))
      );
      resetNuevoPedido();
      await loadPendientes();
      setTabSidebar("cobrar");
      showToast("Pedido actualizado");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al editar pedido");
    } finally {
      setProcessing(false);
    }
  };

  const eliminarPedido = async (pedidoId: string) => {
    if (!confirm("¿Eliminar este pedido?")) return;
    setProcessing(true);
    setError("");
    try {
      await cancelarPedido(pedidoId);
      if (pedidoEnEdicion?.id === pedidoId) resetNuevoPedido();
      if (pedidoActivo?.id === pedidoId) setPedidoActivo(null);
      await loadPendientes();
      showToast("Pedido eliminado");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar pedido");
    } finally {
      setProcessing(false);
    }
  };

  const abrirPago = (pedido: PedidoApi) => {
    resetNuevoPedido();
    setPedidoActivo(pedido);
    setMetodo("efectivo");
    setBancoId("");
    setReferencia("");
    setMontoEfectivo(String(totalPedido(pedido)));
    setMontoTransferencia("0");
    setPagoError("");
    setShowPago(true);
  };

  const confirmarVenta = async () => {
    if (!pedidoActivo || !cajaId) return;

    const total = pedidoTotal;
    const eff = metodo === "transferencia" ? 0 : Number(montoEfectivo) || 0;
    const trans = metodo === "efectivo" ? 0 : Number(montoTransferencia) || 0;
    const pagos =
      metodo === "efectivo"
        ? { monto_efectivo: total, monto_transferencia: 0 }
        : metodo === "transferencia"
          ? {
              monto_efectivo: 0,
              monto_transferencia: total,
              medio_transferencia_id: bancoId,
              comentario: referencia || undefined,
            }
          : {
              monto_efectivo: eff,
              monto_transferencia: trans,
              medio_transferencia_id: bancoId,
              comentario: referencia || undefined,
            };

    if (pagos.monto_efectivo + pagos.monto_transferencia !== total) {
      setPagoError("Los montos deben sumar exactamente el total de la venta");
      return;
    }

    setProcessing(true);
    setPagoError("");
    try {
      await registrarVenta({
        pedido_id: pedidoActivo.id,
        caja_id: cajaId,
        pagos,
      });
      setShowPago(false);
      setPedidoActivo(null);
      await loadPendientes();
      await refreshCaja();
      showToast("Venta registrada con éxito");
    } catch (e) {
      setPagoError(e instanceof Error ? e.message : "Error al registrar venta");
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
      {successMsg && <div className="ventas-toast">{successMsg}</div>}

      <div className="ventas-main">
        {stockBajo.length > 0 && (
          <div className="ventas-banner-warning">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>
              <strong>Alerta de stock:</strong>{" "}
              {stockBajo.slice(0, 3).map((i) => `${i.nombre} (${i.cantidad_actual} ${i.unidad})`).join(", ")}
              {stockBajo.length > 3 ? ` y ${stockBajo.length - 3} más` : ""}
            </span>
          </div>
        )}

        <div className="ventas-search-wrapper">
          <span className="ventas-search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input className="ventas-search-input" placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="ventas-filtros">
          <button type="button" className={`ventas-filtro${catFilter === "all" ? " active" : ""}`} onClick={() => setCatFilter("all")}>Todos</button>
          {categorias.map((c) => (
            <button key={c.id} type="button" className={`ventas-filtro${catFilter === c.id ? " active" : ""}`} onClick={() => setCatFilter(c.id)}>
              {c.emoji} {c.nombre}
            </button>
          ))}
        </div>

        <div className="ventas-grid">
          {filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", gridColumn: "1 / -1" }}>Sin productos</div>
          ) : (
            filtered.map((p) => {
              const cat = categorias.find((c) => c.id === p.categoria_id);
              const ui = getCategoriaUi(cat?.nombre ?? "");
              return (
                <button key={p.variante_id} type="button" className="ventas-producto" onClick={() => addToCart(p)} disabled={!cajaAbierta || tabSidebar !== "nuevo" || (!pedidoEnEdicion && !mesaId)}>
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
            className={`ventas-sidebar-tab ventas-sidebar-tab-nuevo${tabSidebar === "nuevo" ? " active" : ""}`}
            onClick={() => {
              setTabSidebar("nuevo");
              resetNuevoPedido();
            }}
            title={etiquetaTabNuevo}
          >
            {etiquetaTabNuevo}
          </button>
          <button type="button" className={`ventas-sidebar-tab ${tabSidebar === "cobrar" ? " active" : ""}`} onClick={() => { setTabSidebar("cobrar"); resetNuevoPedido(); }}>
            Por Cobrar {pedidosPendientes.length > 0 && `(${pedidosPendientes.length})`}
          </button>
        </div>

        <div className="ventas-sidebar-content">
          {tabSidebar === "nuevo" ? (
            <>
              {pedidoEnEdicion ? (
                <div className="ventas-banner-info">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <span>Editando pedido de <strong>{etiquetaTabNuevo}</strong>. Agrega o quita productos y guarda los cambios.</span>
                </div>
              ) : (
                <>
                  <div className="ventas-form-group">
                    <label className="ventas-label">Salón</label>
                    <select className="ventas-select" value={ubicacionId} onChange={(e) => setUbicacionId(e.target.value)}>
                      <option value="" disabled>— Seleccionar salón —</option>
                      {ubicaciones.map((u) => (
                        <option key={u.id} value={u.id}>{u.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="ventas-form-group">
                    <label className="ventas-label">Mesa</label>
                    <select
                      className="ventas-select"
                      value={mesaId}
                      onChange={(e) => handleMesaChange(e.target.value)}
                      disabled={!ubicacionId}
                    >
                      <option value="" disabled>— Seleccionar mesa —</option>
                      {mesasFiltradas.map((m) => (
                        <option key={m.id} value={m.id} disabled={mesaTienePedidoPendiente(m.id)}>
                          {m.nombre}{mesaTienePedidoPendiente(m.id) ? " (por cobrar)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!ubicacionId || !mesaId ? (
                    <div className="ventas-banner-info">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      <span>Selecciona salón y mesa para agregar productos</span>
                    </div>
                  ) : null}
                </>
              )}

              {!cajaAbierta && (
                <div className="ventas-banner-warning">
                  <span>Debe abrir la caja antes de registrar pedidos</span>
                </div>
              )}

              {error && <div className="ventas-banner-error">{error}</div>}

              {pedidoEnEdicion ? (
                editCart.length === 0 ? (
                  <div className="ventas-empty-cart">
                    <div>Agrega productos al pedido</div>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ flex: 1, overflowY: "auto", borderTop: "1px solid var(--line)" }}>
                      {editCart.map((item) => (
                        <div key={item.variante_id} className="ventas-carrito-item">
                          <div>
                            <div style={{ fontWeight: 500, color: "var(--text)" }}>{item.nombre}</div>
                            <div style={{ fontSize: 13, color: "var(--orange)" }}>{fmt(item.precio)} c/u</div>
                          </div>
                          <div className="ventas-carrito-qty">
                            <button type="button" onClick={() => updateQty(item.variante_id, -1, "edit")}>−</button>
                            <span>{item.cantidad}</span>
                            <button type="button" onClick={() => updateQty(item.variante_id, 1, "edit")}>+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="ventas-total"><span>Total</span><span>{fmt(editCartTotal)}</span></div>
                    <button type="button" className="ventas-cobrar" disabled={editCart.length === 0 || processing} onClick={guardarEdicionPedido}>
                      {processing ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </div>
                )
              ) : cart.length === 0 ? (
                <div className="ventas-empty-cart">
                  <div className="ventas-empty-cart-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
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
                  <div className="ventas-total"><span>Total</span><span>{fmt(cartTotal)}</span></div>
                  <button type="button" className="ventas-cobrar" disabled={!cajaAbierta || cart.length === 0 || !mesaId || processing || mesaTienePedidoPendiente(mesaId)} onClick={confirmarPedido}>
                    {processing ? "Guardando..." : "Confirmar pedido"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {error && <div className="ventas-banner-error">{error}</div>}
              {pedidosPendientes.length === 0 ? (
                <div className="ventas-empty-cart"><div>No hay pedidos por cobrar</div></div>
              ) : (
                <div className="ventas-pendientes-list">
                  {pedidosPendientes.map((pedido) => {
                    const total = totalPedido(pedido);
                    const mesa = mesas.find((m) => m.id === pedido.mesa_id);
                    const salon = mesa ? ubicaciones.find((u) => u.id === mesa.ubicacion_id) : null;
                    const isActive = pedidoEnEdicion?.id === pedido.id;
                    return (
                      <div key={pedido.id} className={`ventas-pedido-card${isActive ? " active" : ""}`}>
                        <div className="ventas-pedido-header">
                          <div>
                            <div className="ventas-pedido-mesa">{salon?.nombre ?? "Salón"} · {mesa?.nombre ?? "Mesa"}</div>
                            <div className="ventas-pedido-items">{(pedido.items ?? []).length} producto(s)</div>
                          </div>
                          <div className="ventas-pedido-total">{fmt(total)}</div>
                        </div>
                        <div className="ventas-pedido-actions">
                          <button type="button" className="ventas-pedido-btn" onClick={() => seleccionarPedido(pedido)}>Editar</button>
                          <button type="button" className="ventas-pedido-btn danger" onClick={() => eliminarPedido(pedido.id)}>Eliminar</button>
                          <button type="button" className="ventas-pedido-btn primary" onClick={() => abrirPago(pedido)}>Cobrar</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showPago && pedidoActivo && (
        <PaymentModal
          total={pedidoTotal}
          medios={medios}
          metodo={metodo}
          onMetodoChange={setMetodo}
          bancoId={bancoId}
          onBancoChange={setBancoId}
          referencia={referencia}
          onReferenciaChange={setReferencia}
          montoEfectivo={montoEfectivo}
          onMontoEfectivoChange={setMontoEfectivo}
          montoTransferencia={montoTransferencia}
          onMontoTransferenciaChange={setMontoTransferencia}
          processing={processing}
          error={pagoError}
          onClose={() => setShowPago(false)}
          onConfirm={confirmarVenta}
        />
      )}
    </div>
  );
}
