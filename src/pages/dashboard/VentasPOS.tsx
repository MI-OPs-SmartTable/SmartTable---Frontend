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
    if (catFilter === "all") return catalogo;
    return catalogo.filter((p) => p.categoria_id === catFilter);
  }, [catalogo, catFilter]);

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
      {!cajaAbierta && (
        <div className="ventas-banner">
          Debes abrir la caja antes de cobrar.{" "}
          <Link to="/dashboard/caja">Ir a Caja →</Link>
        </div>
      )}

      {error && (
        <div className="ventas-banner" style={{ background: "rgba(192,57,43,0.1)" }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div className="ventas-banner" style={{ background: "rgba(45,122,79,0.1)" }}>
          {successMsg}
        </div>
      )}

      <div className="ventas-catalogo db-card" style={{ padding: 16 }}>
        <div className="db-card-title">Catálogo</div>
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
        <div className="ventas-grid" style={{ marginTop: 12 }}>
          {filtered.length === 0 ? (
            <div className="db-empty">
              <div className="db-empty-title">Sin productos</div>
              <div className="db-empty-desc">Crea productos en el módulo Productos</div>
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
                  <div style={{ fontSize: 20 }}>{ui.emoji}</div>
                  <div className="ventas-producto-nombre">{p.nombre}</div>
                  <div className="ventas-producto-precio">{fmt(p.precio)}</div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="ventas-carrito db-card" style={{ padding: 16 }}>
        <div className="db-card-title">Carrito ({cart.length})</div>
        {cart.length === 0 ? (
          <div className="db-empty" style={{ padding: "24px 0" }}>
            <div className="db-empty-icon">🛒</div>
            <div className="db-empty-title">Carrito vacío</div>
            <div className="db-empty-desc">Agrega productos para comenzar una venta</div>
          </div>
        ) : (
          <>
            {cart.map((item) => (
              <div key={item.variante_id} className="ventas-carrito-item">
                <div>
                  <div>{item.nombre}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{fmt(item.precio)} c/u</div>
                </div>
                <div className="ventas-carrito-qty">
                  <button type="button" onClick={() => updateQty(item.variante_id, -1)}>−</button>
                  <span>{item.cantidad}</span>
                  <button type="button" onClick={() => updateQty(item.variante_id, 1)}>+</button>
                </div>
              </div>
            ))}
            <div className="ventas-total">Total: {fmt(total)}</div>
            <button
              type="button"
              className="ventas-cobrar"
              disabled={!cajaAbierta || cart.length === 0}
              onClick={openPago}
            >
              Cobrar
            </button>
          </>
        )}
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
