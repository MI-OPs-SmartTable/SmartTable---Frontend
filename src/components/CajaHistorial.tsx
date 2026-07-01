import { useState } from "react";
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
      width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={`caja-historial-chevron ${expanded ? "expandido" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

interface Props {
  historial: CierreCaja[];
}

export default function CajaHistorial({ historial }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fechaFiltro, setFechaFiltro] = useState("");

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  const filtrado = fechaFiltro
    ? historial.filter((c) => {
        const d = new Date(fechaFiltro);
        return c.fecha.includes(d.getDate().toString());
      })
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
          />
        </div>
      </div>

      {filtrado.map((cierre, idx) => (
        <div key={cierre.id}>
          {idx > 0 && <div className="caja-historial-divider" />}

          <div onClick={() => toggleExpand(cierre.id)}>
            <div className="caja-historial-fila">
              <div className="caja-historial-fila-info">
                <p>{cierre.diaSemana}, {cierre.fecha}</p>
                <p>Cerrado por {cierre.cerradoPor} · {cierre.hora}</p>
              </div>
              <div className="caja-historial-fila-monto">
                <div className="caja-historial-fila-monto-valor">
                  <p>{formatCOP(cierre.total)}</p>
                  <p>Total vendido</p>
                </div>
                <ChevronIcon expanded={expandedId === cierre.id} />
              </div>
            </div>

            {expandedId === cierre.id && (
              <div className="caja-historial-detalle">
                <div className="caja-historial-detalle-grid">
                  {[
                    {
                      label: "Efectivo",
                      value: formatCOP(cierre.montoEfectivo ?? Math.round(cierre.total * 0.6)),
                    },
                    {
                      label: "Transferencia",
                      value: formatCOP(cierre.montoTransferencia ?? Math.round(cierre.total * 0.4)),
                    },
                  ].map((item) => (
                    <div key={item.label} className="caja-historial-detalle-item">
                      <p>{item.label}</p>
                      <p>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
