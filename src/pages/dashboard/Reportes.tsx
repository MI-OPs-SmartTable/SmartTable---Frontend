import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, TrendingUp, Calendar, Package, BarChart3 } from "lucide-react";
import { formatCOP } from "../../lib/formatMoney";
import { getCategoriaUi } from "../../lib/categoriaUi";
import {
  downloadReporteExcel,
  fetchReporteDashboard,
  type ReporteDashboard,
} from "../../services/reportesService";
import "../../styles/Reportes.css";

type TabKey = "daily" | "products" | "categories";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return toLocalIsoDate(d);
}

function formatDayLabel(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00`);
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

function formatDayLong(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00`);
  return d.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

const TABS: { key: TabKey; label: string; icon: typeof Calendar }[] = [
  { key: "daily", label: "Ventas por Día", icon: Calendar },
  { key: "products", label: "Por Producto", icon: Package },
  { key: "categories", label: "Por Categoría", icon: BarChart3 },
];

export default function Reportes() {
  const [desde, setDesde] = useState(() => daysAgoIso(30));
  const [hasta, setHasta] = useState(() => toLocalIsoDate(new Date()));
  const [quickDays, setQuickDays] = useState<number | null>(30);
  const [tab, setTab] = useState<TabKey>("daily");
  const [data, setData] = useState<ReporteDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const reporte = await fetchReporteDashboard({ desde, hasta, limite: 50 });
      setData(reporte);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Error al cargar reportes");
    } finally {
      setLoading(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyQuick = (days: number) => {
    setQuickDays(days);
    setDesde(daysAgoIso(days));
    setHasta(toLocalIsoDate(new Date()));
  };

  const onDesdeChange = (value: string) => {
    setQuickDays(null);
    setDesde(value);
  };

  const onHastaChange = (value: string) => {
    setQuickDays(null);
    setHasta(value);
  };

  const handleExcel = async () => {
    setExporting(true);
    setError("");
    try {
      await downloadReporteExcel({ desde, hasta, limite: 50 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el Excel");
    } finally {
      setExporting(false);
    }
  };

  const ventas = data?.ventas;
  const total = ventas?.total ?? 0;
  const efectivo = ventas?.total_efectivo ?? 0;
  const transferencia = ventas?.total_transferencia ?? 0;
  const pctEfectivo = total > 0 ? Math.round((efectivo / total) * 100) : 0;
  const pctTransfer = total > 0 ? Math.round((transferencia / total) * 100) : 0;

  const dias = data?.ventas_diarias ?? [];
  const maxDia = Math.max(...dias.map((d) => d.total), 1);

  const productos = data?.top_productos ?? [];
  const maxQty = Math.max(...productos.map((p) => p.cantidad_vendida), 1);

  const categorias = useMemo(() => {
    const list = data?.por_categoria ?? [];
    const sum = list.reduce((s, c) => s + c.total_vendido, 0) || 1;
    return list.map((c) => {
      const ui = getCategoriaUi(c.categoria);
      return {
        ...c,
        color: ui.color,
        pct: Math.round((c.total_vendido / sum) * 100),
      };
    });
  }, [data?.por_categoria]);

  const donutGradient = useMemo(() => {
    if (categorias.length === 0) return "rgba(46,31,14,0.08)";
    let acc = 0;
    const parts: string[] = [];
    for (const cat of categorias) {
      const start = acc;
      acc += cat.pct;
      parts.push(`${cat.color} ${start}% ${acc}%`);
    }
    if (acc < 100) parts.push(`rgba(46,31,14,0.06) ${acc}% 100%`);
    return `conic-gradient(${parts.join(", ")})`;
  }, [categorias]);

  return (
    <div className="rp-page">
      <div className="rp-header">
        <div>
          <h1 className="rp-title">Reportes</h1>
          <p className="rp-subtitle">Análisis de ventas y rendimiento</p>
        </div>
        <button
          type="button"
          className="rp-btn-excel"
          onClick={() => void handleExcel()}
          disabled={exporting || loading}
        >
          <Download size={16} />
          {exporting ? "Generando…" : "Exportar Excel"}
        </button>
      </div>

      <div className="rp-filters">
        <span className="rp-filters-label">Período:</span>
        <div className="rp-date-row">
          <input
            type="date"
            value={desde}
            max={hasta}
            onChange={(e) => onDesdeChange(e.target.value)}
          />
          <span style={{ color: "var(--muted)", fontSize: 13 }}>hasta</span>
          <input
            type="date"
            value={hasta}
            min={desde}
            max={toLocalIsoDate(new Date())}
            onChange={(e) => onHastaChange(e.target.value)}
          />
        </div>
        <div className="rp-quick">
          {[7, 15, 30].map((days) => (
            <button
              key={days}
              type="button"
              className={quickDays === days ? "is-active" : undefined}
              onClick={() => applyQuick(days)}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {error && <p className="rp-error">{error}</p>}
      {loading && <p className="rp-loading">Cargando reportes…</p>}

      {!loading && data && (
        <>
          <div className="rp-kpis">
            <div className="rp-kpi">
              <div className="rp-kpi-label">
                <TrendingUp size={14} style={{ color: "var(--orange)" }} />
                Total Ingresos
              </div>
              <p className="rp-kpi-value">{formatCOP(total)}</p>
              <p className="rp-kpi-hint">{ventas?.cantidad ?? 0} ventas</p>
            </div>
            <div className="rp-kpi">
              <div className="rp-kpi-label">Ticket Promedio</div>
              <p className="rp-kpi-value">{formatCOP(ventas?.ticket_promedio ?? 0)}</p>
              <p className="rp-kpi-hint">por pedido</p>
            </div>
            <div className="rp-kpi is-green">
              <div className="rp-kpi-label">Efectivo</div>
              <p className="rp-kpi-value">{formatCOP(efectivo)}</p>
              <p className="rp-kpi-hint">{pctEfectivo}% del total</p>
            </div>
            <div className="rp-kpi is-blue">
              <div className="rp-kpi-label">Transferencias</div>
              <p className="rp-kpi-value">{formatCOP(transferencia)}</p>
              <p className="rp-kpi-hint">{pctTransfer}% del total</p>
            </div>
          </div>

          <div className="rp-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                className={`rp-tab${tab === t.key ? " is-active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>

          {tab === "daily" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="rp-card">
                <div className="rp-card-head">
                  <h3 className="rp-card-title">Ventas Diarias</h3>
                </div>
                {dias.length === 0 ? (
                  <div className="rp-empty">Sin datos para el período seleccionado</div>
                ) : (
                  <>
                    <div className="rp-stack-chart">
                      {dias.map((d) => {
                        const h = Math.max(4, Math.round((d.total / maxDia) * 100));
                        const cashPct =
                          d.total > 0 ? (d.total_efectivo / d.total) * 100 : 0;
                        const transferPct =
                          d.total > 0 ? (d.total_transferencia / d.total) * 100 : 0;
                        return (
                          <div key={d.fecha} className="rp-stack-col" title={formatCOP(d.total)}>
                            <div className="rp-stack-bars" style={{ height: `${h}%`, flex: "none" }}>
                              <div
                                className="rp-stack-seg is-transfer"
                                style={{ height: `${transferPct}%` }}
                              />
                              <div
                                className="rp-stack-seg is-cash"
                                style={{ height: `${cashPct}%` }}
                              />
                            </div>
                            <span className="rp-stack-label">{formatDayLabel(d.fecha)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="rp-legend">
                      <span>
                        <i className="rp-dot is-cash" /> Efectivo
                      </span>
                      <span>
                        <i className="rp-dot is-transfer" /> Transferencia
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="rp-card" style={{ padding: 0 }}>
                <div className="rp-card-head" style={{ padding: "14px 18px 0" }}>
                  <h3 className="rp-card-title">Detalle por Día</h3>
                </div>
                <div className="rp-table-wrap">
                  <table className="rp-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th className="is-right">Pedidos</th>
                        <th className="is-right">Efectivo</th>
                        <th className="is-right">Transferencia</th>
                        <th className="is-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dias.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)" }}>
                            Sin datos
                          </td>
                        </tr>
                      ) : (
                        dias.map((d) => (
                          <tr key={d.fecha}>
                            <td>{formatDayLong(d.fecha)}</td>
                            <td className="is-right">{d.cantidad_ventas}</td>
                            <td className="is-right is-cash">{formatCOP(d.total_efectivo)}</td>
                            <td className="is-right is-transfer">
                              {formatCOP(d.total_transferencia)}
                            </td>
                            <td className="is-right is-strong">{formatCOP(d.total)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {dias.length > 0 && (
                      <tfoot>
                        <tr>
                          <td>Total</td>
                          <td className="is-right">{ventas?.cantidad ?? 0}</td>
                          <td className="is-right is-cash">{formatCOP(efectivo)}</td>
                          <td className="is-right is-transfer">{formatCOP(transferencia)}</td>
                          <td className="is-right">{formatCOP(total)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === "products" && (
            <div className="rp-grid-2">
              <div className="rp-card">
                <h3 className="rp-card-title" style={{ marginBottom: 14 }}>
                  Unidades Vendidas
                </h3>
                {productos.length === 0 ? (
                  <div className="rp-empty">Sin datos</div>
                ) : (
                  <div className="rp-hbar-list">
                    {productos.slice(0, 10).map((p) => (
                      <div key={p.producto_id} className="rp-hbar-row">
                        <div style={{ minWidth: 0 }}>
                          <div className="rp-hbar-meta">
                            <span className="rp-hbar-name">{p.producto}</span>
                            <span className="rp-hbar-qty">{p.cantidad_vendida} uds</span>
                          </div>
                          <div className="rp-hbar-track">
                            <div
                              className="rp-hbar-fill"
                              style={{
                                width: `${Math.round((p.cantidad_vendida / maxQty) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="rp-hbar-total">{formatCOP(p.total_vendido)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rp-card">
                <h3 className="rp-card-title" style={{ marginBottom: 8 }}>
                  Ranking de Productos
                </h3>
                {productos.length === 0 ? (
                  <div className="rp-empty">Sin datos</div>
                ) : (
                  <div className="rp-rank">
                    {productos.slice(0, 12).map((p, i) => (
                      <div key={p.producto_id} className="rp-rank-item">
                        <span
                          className={`rp-rank-badge${i < 3 ? ` is-${i + 1}` : ""}`}
                        >
                          {i + 1}
                        </span>
                        <span className="rp-rank-name">{p.producto}</span>
                        <div className="rp-rank-meta">
                          <span style={{ fontSize: 12, color: "var(--muted)" }}>
                            {p.cantidad_vendida} uds
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>
                            {formatCOP(p.total_vendido)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "categories" && (
            <div className="rp-grid-2">
              <div className="rp-card">
                <h3 className="rp-card-title" style={{ marginBottom: 14 }}>
                  Ingresos por Categoría
                </h3>
                {categorias.length === 0 ? (
                  <div className="rp-empty">Sin datos</div>
                ) : (
                  <div className="rp-cat-layout">
                    <div className="rp-donut" style={{ background: donutGradient }}>
                      <div className="rp-donut-hole">
                        Ingresos
                        <br />
                        por cat.
                      </div>
                    </div>
                    <div className="rp-cat-list">
                      {categorias.map((c) => (
                        <div key={c.categoria_id} className="rp-cat-row">
                          <i className="rp-dot" style={{ background: c.color }} />
                          <span style={{ flex: 1 }}>
                            {c.emoji} {c.categoria}
                          </span>
                          <span style={{ color: "var(--muted)", fontSize: 12 }}>
                            {c.cantidad_vendida} uds
                          </span>
                          <span style={{ fontWeight: 600 }}>{formatCOP(c.total_vendido)}</span>
                          <span style={{ color: "var(--muted)", fontSize: 12 }}>({c.pct}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rp-card">
                <h3 className="rp-card-title" style={{ marginBottom: 14 }}>
                  Total por Categoría
                </h3>
                {categorias.length === 0 ? (
                  <div className="rp-empty">Sin datos</div>
                ) : (
                  <div className="rp-hbar-list">
                    {categorias.map((c) => {
                      const maxCat = categorias[0]?.total_vendido || 1;
                      return (
                        <div key={c.categoria_id} className="rp-hbar-row">
                          <div style={{ minWidth: 0 }}>
                            <div className="rp-hbar-meta">
                              <span className="rp-hbar-name">
                                {c.emoji} {c.categoria}
                              </span>
                              <span className="rp-hbar-qty">{c.pct}%</span>
                            </div>
                            <div className="rp-hbar-track">
                              <div
                                className="rp-hbar-fill"
                                style={{
                                  width: `${Math.round((c.total_vendido / maxCat) * 100)}%`,
                                  background: c.color,
                                }}
                              />
                            </div>
                          </div>
                          <span className="rp-hbar-total">{formatCOP(c.total_vendido)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
