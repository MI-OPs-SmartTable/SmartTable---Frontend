import { useEffect, useState } from "react";
import type { CierreCaja } from "../pages/dashboard/types/caja.types";
import { formatCOP } from "../lib/formatMoney";

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#6B7280"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`caja-historial-chevron ${expanded ? "expandido" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

interface Props {
  historial: CierreCaja[];
}

export default function CajaHistorial({ historial }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fechaFiltro, setFechaFiltro] = useState("");

  useEffect(() => {
    if (!expandedId && historial[0]) {
      setExpandedId(historial[0].id);
    }
  }, [historial, expandedId]);

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  const filtrado = fechaFiltro
    ? historial.filter((c) => c.fechaRaw === fechaFiltro)
    : historial;

  return (
    <div className="caja-historial">
      <div className="caja-historial-header">
        <h3>Historial de Cierres de Caja</h3>
        <div className="caja-historial-fecha">
          <CalendarIcon />
          <input
            type="date"
            value={fechaFiltro}
            onChange={(e) => setFechaFiltro(e.target.value)}
            aria-label="Filtrar por fecha"
          />
        </div>
      </div>

      {filtrado.length === 0 ? (
        <p className="caja-historial-empty">Sin cierres registrados</p>
      ) : (
        filtrado.map((cierre, idx) => {
          const abierto = expandedId === cierre.id;
          return (
            <div key={cierre.id} className={`caja-historial-item${abierto ? " abierto" : ""}`}>
              {idx > 0 && <div className="caja-historial-divider" />}

              <button
                type="button"
                className="caja-historial-fila"
                onClick={() => toggleExpand(cierre.id)}
                aria-expanded={abierto}
              >
                <div className="caja-historial-fila-info">
                  <p>
                    {cierre.diaSemana}, {cierre.fecha}
                  </p>
                  <p>
                    Cerrado por {cierre.cerradoPor} · {cierre.hora}
                  </p>
                </div>
                <div className="caja-historial-fila-monto">
                  <div className="caja-historial-fila-monto-valor">
                    <p>{formatCOP(cierre.totalVentas)}</p>
                    <p>Total vendido</p>
                  </div>
                  <ChevronIcon expanded={abierto} />
                </div>
              </button>

              {abierto && (
                <div className="caja-historial-detalle">
                  <div className="caja-historial-detalle-grid">
                    <section className="caja-historial-panel">
                      <h4>Resumen</h4>
                      <div className="caja-historial-panel-rows">
                        <div className="caja-historial-row">
                          <span>Base inicial:</span>
                          <strong>{formatCOP(cierre.baseInicial)}</strong>
                        </div>
                        <div className="caja-historial-row">
                          <span>Total ventas:</span>
                          <strong className="ok">{formatCOP(cierre.totalVentas)}</strong>
                        </div>
                        <div className="caja-historial-row">
                          <span>Gastos:</span>
                          <strong className="err">- {formatCOP(cierre.totalGastos)}</strong>
                        </div>
                        <div className="caja-historial-row neto">
                          <span>Neto:</span>
                          <strong>{formatCOP(cierre.neto)}</strong>
                        </div>
                      </div>
                    </section>

                    <section className="caja-historial-panel">
                      <h4>Por método de pago</h4>
                      <div className="caja-historial-panel-rows">
                        <div className="caja-historial-row">
                          <span className="caja-historial-metodo">
                            <CashIcon />
                            Efectivo:
                          </span>
                          <strong className="ok">{formatCOP(cierre.montoEfectivo)}</strong>
                        </div>
                        <div className="caja-historial-row">
                          <span className="caja-historial-metodo">
                            <TransferIcon />
                            Transferencia:
                          </span>
                          <strong className="info">{formatCOP(cierre.montoTransferencia)}</strong>
                        </div>
                      </div>
                    </section>

                    <section className="caja-historial-panel">
                      <h4>Gastos ({cierre.gastos.length})</h4>
                      {cierre.gastos.length === 0 ? (
                        <p className="caja-historial-panel-empty">Sin gastos</p>
                      ) : (
                        <ul className="caja-historial-gastos">
                          {cierre.gastos.map((gasto) => (
                            <li key={gasto.id}>
                              <span>{gasto.descripcion}:</span>
                              <strong className="err">{formatCOP(gasto.monto)}</strong>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
