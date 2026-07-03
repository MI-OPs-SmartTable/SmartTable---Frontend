import { useCallback, useEffect, useState } from "react";
import { formatCOP } from "../lib/formatMoney";
import {
  crearGastoCaja,
  fetchGastosPorCaja,
  type CajaApi,
  type GastoCajaApi,
} from "../services/cajaService";
import { fetchVentas, type VentaApi } from "../services/ventasService";
import GastoCajaModal from "./GastoCajaModal";
import "../styles/Caja.css";

interface CajaActivaProps {
  caja: CajaApi;
  usuarioId: string;
}

function formatAperturaDate(value: string): string {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function CajaActiva({ caja, usuarioId }: CajaActivaProps) {
  const [ventas, setVentas] = useState<VentaApi[]>([]);
  const [gastos, setGastos] = useState<GastoCajaApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showVentas, setShowVentas] = useState(true);
  const [showGastoModal, setShowGastoModal] = useState(false);

  const baseInicial = Number(caja.monto_apertura ?? 0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [todasVentas, gastosCaja] = await Promise.all([
        fetchVentas(),
        fetchGastosPorCaja(caja.id),
      ]);
      setVentas(todasVentas.filter((venta) => venta.caja_id === caja.id));
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

  const handleGuardarGasto = async (payload: {
    monto: number;
    descripcion: string;
    categoria: string;
  }) => {
    await crearGastoCaja({
      caja_id: caja.id,
      usuario_id: usuarioId,
      monto: payload.monto,
      descripcion: payload.descripcion,
      categoria: payload.categoria,
    });
    await loadData();
  };

  if (loading) {
    return <p className="caja-loading">Cargando sesión de caja...</p>;
  }

  return (
    <div className="caja-activa">
      {error && <p className="caja-error">{error}</p>}

      <div className="caja-activa-status">
        <span className="caja-activa-dot"></span>
        <p>Caja abierta desde {formatAperturaDate(caja.apertura_at)}</p>
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
        <div className="caja-section-card">
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
          <div className={`caja-section-body${ventas.length === 0 ? " empty" : ""}`}>
            {ventas.length === 0 ? (
              <p>Sin ventas</p>
            ) : showVentas ? (
              ventas.map((venta) => (
                <div key={venta.id} className="caja-venta-item">
                  <div>
                    <p className="caja-venta-id">Pedido #{venta.pedido_id.slice(0, 8)}</p>
                    <p className="caja-venta-fecha">
                      {new Date(venta.pagado_at).toLocaleString("es-CO")}
                    </p>
                  </div>
                  <strong>{formatCOP(Number(venta.total))}</strong>
                </div>
              ))
            ) : (
              <p>Ventas ocultas</p>
            )}
          </div>
        </div>

        <div className="caja-section-card">
          <div className="caja-section-header">
            <h3>Gastos / Caja menor</h3>
            <button type="button" className="caja-add-btn" onClick={() => setShowGastoModal(true)}>
              + Agregar
            </button>
          </div>
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
      </div>

      {showGastoModal && (
        <GastoCajaModal
          onClose={() => setShowGastoModal(false)}
          onGuardar={handleGuardarGasto}
        />
      )}
    </div>
  );
}
