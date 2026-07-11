import { useCallback, useEffect, useState } from "react";
import { formatLocalDateTime, formatLocalTime } from "../lib/dateTime";
import { formatCOP } from "../lib/formatMoney";
import {
  crearGastoCaja,
  fetchGastosPorCaja,
  type CajaApi,
  type GastoCajaApi,
} from "../services/cajaService";
import {
  fetchVentasPorCaja,
  labelMetodoPago,
  labelProductoVenta,
  labelUbicacionVenta,
  type VentaApi,
} from "../services/ventasService";
import ColaboradoresCaja from "./ColaboradoresCaja";
import "../styles/Caja.css";

interface CajaActivaProps {
  caja: CajaApi;
  usuarioId: string;
}

export default function CajaActiva({ caja, usuarioId }: CajaActivaProps) {
  const [ventas, setVentas] = useState<VentaApi[]>([]);
  const [gastos, setGastos] = useState<GastoCajaApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showVentas, setShowVentas] = useState(true);
  const [expandedVentaId, setExpandedVentaId] = useState<string | null>(null);
  const [showGastoForm, setShowGastoForm] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [savingGasto, setSavingGasto] = useState(false);
  const [gastoError, setGastoError] = useState("");

  const baseInicial = Number(caja.monto_apertura ?? 0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ventasCaja, gastosCaja] = await Promise.all([
        fetchVentasPorCaja(caja.id),
        fetchGastosPorCaja(caja.id),
      ]);
      setVentas(ventasCaja);
      setGastos(gastosCaja);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la caja activa");
    } finally {
      setLoading(false);
    }
  }, [caja.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const totalVendido = ventas.reduce((sum, venta) => sum + Number(venta.total), 0);
  const totalEfectivo = ventas.reduce((sum, venta) => sum + Number(venta.monto_efectivo), 0);
  const totalTransferencias = ventas.reduce(
    (sum, venta) => sum + Number(venta.monto_transferencia),
    0
  );
  const totalGastos = gastos.reduce((sum, gasto) => sum + Number(gasto.monto), 0);
  const saldoNeto = baseInicial + totalVendido - totalGastos;
  const transaccionesEfectivo = ventas.filter((venta) => Number(venta.monto_efectivo) > 0).length;
  const transaccionesTransferencia = ventas.filter(
    (venta) => Number(venta.monto_transferencia) > 0
  ).length;

  const resetGastoForm = () => {
    setDescripcion("");
    setMonto("");
    setGastoError("");
    setShowGastoForm(false);
  };

  const handleGuardarGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseInt(monto.replace(/\D/g, ""), 10);
    if (!valor || !descripcion.trim()) {
      setGastoError("Descripción y monto son obligatorios");
      return;
    }

    setSavingGasto(true);
    setGastoError("");
    try {
      await crearGastoCaja({
        caja_id: caja.id,
        usuario_id: usuarioId,
        monto: valor,
        descripcion: descripcion.trim(),
        categoria: "Operativo",
      });
      resetGastoForm();
      await loadData();
    } catch (err) {
      setGastoError(err instanceof Error ? err.message : "Error al registrar gasto");
    } finally {
      setSavingGasto(false);
    }
  };

  if (loading) {
    return <p className="caja-loading">Cargando sesión de caja...</p>;
  }

  return (
    <div className="caja-activa">
      {error && <p className="caja-error">{error}</p>}

      <div className="caja-activa-status">
        <span className="caja-activa-dot"></span>
        <p>Caja abierta desde {formatLocalDateTime(caja.apertura_at)}</p>
      </div>

      <div className="caja-activa-metrics">
        <div className="caja-metric-card base">
          <p className="caja-metric-title"><span className="caja-metric-icon">$</span> Base inicial</p>
          <p className="caja-metric-value">{formatCOP(baseInicial)}</p>
        </div>
        <div className="caja-metric-card ven">
          <p className="caja-metric-title"><span className="caja-metric-icon">📈</span> Total vendido</p>
          <p className="caja-metric-value success">{formatCOP(totalVendido)}</p>
        </div>
        <div className="caja-metric-card gas">
          <p className="caja-metric-title"><span className="caja-metric-icon">📉</span> Gastos</p>
          <p className="caja-metric-value error">{formatCOP(totalGastos)}</p>
        </div>
        <div className="caja-metric-card neto">
          <p className="caja-metric-title"><span className="caja-metric-icon">$</span> Saldo neto</p>
          <p className="caja-metric-value primary">{formatCOP(saldoNeto)}</p>
        </div>
      </div>

      <div className="caja-activa-methods">
        <div className="caja-method-card">
          <p className="caja-method-title"><span className="caja-method-icon">💵</span> Efectivo recibido</p>
          <p className="caja-method-value">{formatCOP(totalEfectivo)}</p>
          <p className="caja-method-transactions">{transaccionesEfectivo} transacciones</p>
        </div>
        <div className="caja-method-card">
          <p className="caja-method-title"><span className="caja-method-icon">💳</span> Transferencias</p>
          <p className="caja-method-value">{formatCOP(totalTransferencias)}</p>
          <p className="caja-method-transactions">{transaccionesTransferencia} transacciones</p>
        </div>
      </div>

      <div className="caja-activa-sections">
        <div className="caja-section-card caja-ventas-card">
          <div className="caja-section-header">
            <h3>Ventas de esta sesión ({ventas.length})</h3>
            <button
              type="button"
              className="caja-eye-btn"
              onClick={() => setShowVentas((prev) => !prev)}
              aria-label={showVentas ? "Ocultar ventas" : "Mostrar ventas"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
          <div className={`caja-section-body${ventas.length === 0 ? " empty" : " ventas"}`}>
            {ventas.length === 0 ? (
              <p>Sin ventas</p>
            ) : showVentas ? (
              ventas.map((venta) => {
                const abierto = expandedVentaId === venta.id;
                const metodo = String(venta.metodo_pago || "").toLowerCase();
                return (
                  <div
                    key={venta.id}
                    className={`caja-venta-row${abierto ? " abierto" : ""}`}
                  >
                    <button
                      type="button"
                      className="caja-venta-item"
                      onClick={() =>
                        setExpandedVentaId(abierto ? null : venta.id)
                      }
                      aria-expanded={abierto}
                    >
                      <div className="caja-venta-main">
                        <p className="caja-venta-lugar">{labelUbicacionVenta(venta)}</p>
                        <p className="caja-venta-fecha">{formatLocalTime(venta.pagado_at)}</p>
                      </div>
                      <div className="caja-venta-meta">
                        <span className={`caja-venta-badge ${metodo}`}>
                          {labelMetodoPago(metodo)}
                        </span>
                        <strong className="caja-venta-total">
                          {formatCOP(Number(venta.total))}
                        </strong>
                        <svg
                          className={`caja-venta-chevron${abierto ? " expandido" : ""}`}
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#9CA3AF"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </button>

                    {abierto && (
                      <div className="caja-venta-detalle">
                        {(venta.items?.length ?? 0) === 0 ? (
                          <p className="caja-venta-detalle-empty">Sin productos</p>
                        ) : (
                          <ul className="caja-venta-productos">
                            {venta.items!.map((item) => (
                              <li key={item.id}>
                                <span>
                                  {item.cantidad} × {labelProductoVenta(item)}
                                </span>
                                <strong>
                                  {formatCOP(
                                    Number(
                                      item.subtotal ??
                                        Number(item.cantidad) * Number(item.precio_unitario)
                                    )
                                  )}
                                </strong>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p>Ventas ocultas</p>
            )}
          </div>
        </div>

        <div className="caja-section-card caja-gastos-card">
          <div className="caja-section-header">
            <h3>Gastos / Caja menor</h3>
            {!showGastoForm && (
              <button
                type="button"
                className="caja-add-btn"
                onClick={() => setShowGastoForm(true)}
              >
                + Agregar
              </button>
            )}
          </div>

          {showGastoForm && (
            <form className="caja-gasto-form" onSubmit={handleGuardarGasto}>
              <div className="caja-gasto-form-fields">
                <input
                  type="text"
                  className="caja-gasto-input desc"
                  placeholder="Descripción del gasto"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  disabled={savingGasto}
                  autoFocus
                />
                <input
                  type="text"
                  className="caja-gasto-input monto"
                  placeholder="Monto"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value.replace(/\D/g, ""))}
                  disabled={savingGasto}
                  inputMode="numeric"
                />
              </div>
              {gastoError && <p className="caja-gasto-form-error">{gastoError}</p>}
              <div className="caja-gasto-form-acts">
                <button
                  type="submit"
                  className="caja-gasto-btn-guardar"
                  disabled={savingGasto}
                >
                  {savingGasto ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  className="caja-gasto-btn-cancelar"
                  onClick={resetGastoForm}
                  disabled={savingGasto}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className={`caja-section-body${gastos.length === 0 ? " empty" : ""}`}>
            {gastos.length === 0 ? (
              <p>Sin gastos registrados</p>
            ) : (
              gastos.map((gasto) => (
                <div key={gasto.id} className="caja-gasto-item">
                  <div>
                    <p className="caja-gasto-desc">{gasto.descripcion}</p>
                    <p className="caja-gasto-cat">{gasto.categoria}</p>
                  </div>
                  <strong>- {formatCOP(Number(gasto.monto))}</strong>
                </div>
              ))
            )}
          </div>
        </div>

        <ColaboradoresCaja cajaId={caja.id} titularId={caja.usuario_id} />
      </div>
    </div>
  );
}
