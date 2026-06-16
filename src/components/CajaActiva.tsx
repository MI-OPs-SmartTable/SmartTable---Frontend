import type { GastoCajaApi } from "../services/cajaService";
import { formatCOP } from "../lib/formatMoney";
import "../styles/Caja.css";

interface CajaActivaProps {
  baseInicial: number;
  aperturaAt: string;
  totalVendido: number;
  gastos: number;
  efectivo: number;
  transferencia: number;
  ventasCount: number;
  gastosList: GastoCajaApi[];
  onAgregarGasto: () => void;
}

export default function CajaActiva({
  baseInicial,
  aperturaAt,
  totalVendido,
  gastos,
  efectivo,
  transferencia,
  ventasCount,
  gastosList,
  onAgregarGasto,
}: CajaActivaProps) {
  const formatCurrency = formatCOP;
  const saldoNeto = baseInicial + totalVendido - gastos;
  const txEfectivo = efectivo > 0 ? ventasCount : 0;
  const txTransferencia = transferencia > 0 ? ventasCount : 0;

  return (
    <div className="caja-activa">
      <div className="caja-activa-status">
        <span className="caja-activa-dot"></span>
        <p>Caja Abierta desde {aperturaAt}</p>
      </div>

      <div className="caja-activa-metrics">
        <div className="caja-metric-card base">
          <p className="caja-metric-title"><span className="caja-metric-icon">$</span> Base inicial</p>
          <p className="caja-metric-value">{formatCurrency(baseInicial)}</p>
        </div>
        <div className="caja-metric-card ven">
          <p className="caja-metric-title"><span className="caja-metric-icon">📈</span> Total vendido</p>
          <p className="caja-metric-value success">{formatCurrency(totalVendido)}</p>
        </div>
        <div className="caja-metric-card gas">
          <p className="caja-metric-title"><span className="caja-metric-icon">📉</span> Gastos</p>
          <p className="caja-metric-value error">{formatCurrency(gastos)}</p>
        </div>
        <div className="caja-metric-card neto">
          <p className="caja-metric-title"><span className="caja-metric-icon">$</span> Saldo neto</p>
          <p className="caja-metric-value primary">{formatCurrency(saldoNeto)}</p>
        </div>
      </div>

      <div className="caja-activa-methods">
        <div className="caja-method-card">
          <p className="caja-method-title"><span className="caja-method-icon">💵</span> Efectivo recibido</p>
          <p className="caja-method-value">{formatCurrency(efectivo)}</p>
          <p className="caja-method-transactions">{txEfectivo} transacciones</p>
        </div>
        <div className="caja-method-card">
          <p className="caja-method-title"><span className="caja-method-icon">💳</span> Transferencias</p>
          <p className="caja-method-value">{formatCurrency(transferencia)}</p>
          <p className="caja-method-transactions">{txTransferencia} transacciones</p>
        </div>
      </div>

      <div className="caja-activa-sections">
        <div className="caja-section-card">
          <div className="caja-section-header">
            <h3>Ventas de esta sesión ({ventasCount})</h3>
          </div>
          <div className={`caja-section-body${ventasCount === 0 ? " empty" : ""}`}>
            {ventasCount === 0 ? <p>Sin ventas</p> : <p>{ventasCount} venta(s) registradas en SQLite</p>}
          </div>
        </div>

        <div className="caja-section-card">
          <div className="caja-section-header">
            <h3>Gastos / Caja menor</h3>
            <button type="button" className="caja-add-btn" onClick={onAgregarGasto}>
              + Agregar
            </button>
          </div>
          <div className={`caja-section-body${gastosList.length === 0 ? " empty" : ""}`}>
            {gastosList.length === 0 ? (
              <p>Sin gastos registrados</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {gastosList.map((g) => (
                  <li key={g.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                    <strong>{g.descripcion}</strong> — {formatCurrency(Number(g.monto))}
                    <span style={{ color: "var(--muted)", fontSize: 12 }}> ({g.categoria})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
