import { useEffect, useState } from "react";
import { fmt } from "../../lib/formatMoney";
import { getDashboardStats, type DashboardStats } from "../../services/dashboardService";
import { useAutoStartTour } from "../../tours/useAutoStartTour";

const Ic = {
  dollar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  trend: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  shop: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  warn: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  bar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  star: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  receipt: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2V8z"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
};

function StatCard({
  label,
  iconBg,
  icon,
  value,
  hint,
  delay = 0,
}: {
  label: string;
  iconBg: string;
  icon: React.ReactNode;
  value: string;
  hint: string;
  delay?: number;
}) {
  return (
    <div className="db-stat-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="db-stat-top">
        <div className="db-stat-label">{label}</div>
        <div className="db-stat-icon" style={{ background: iconBg }}>{icon}</div>
      </div>
      <div className="db-stat-value">{value}</div>
      <div className="db-stat-hint">{hint}</div>
    </div>
  );
}

export default function DashboardHome() {
  useAutoStartTour("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <p style={{ color: "var(--muted)" }}>Cargando estadísticas...</p>;
  }

  if (error) {
    return <p style={{ color: "var(--err)" }}>{error}</p>;
  }

  const s = stats!;

  return (
    <>
      <div className="db-stats">
        <StatCard label="Ventas Hoy" iconBg="rgba(232,96,28,0.1)" icon={<span style={{ color: "var(--orange)" }}>{Ic.dollar}</span>} value={fmt(s.ventasHoy)} hint={s.ventasHoy > 0 ? "Desde SQLite" : "Sin datos"} delay={0} />
        <StatCard label="Efectivo" iconBg="rgba(45,122,79,0.1)" icon={<span style={{ color: "var(--green)" }}>{Ic.trend}</span>} value={fmt(s.efectivoHoy)} hint="Hoy" delay={60} />
        <StatCard label="Transferencia" iconBg="rgba(59,95,192,0.1)" icon={<span style={{ color: "var(--blue)" }}>{Ic.shop}</span>} value={fmt(s.transferenciaHoy)} hint="Hoy" delay={120} />
        <StatCard label="Stock Bajo" iconBg="rgba(192,57,43,0.1)" icon={<span style={{ color: "var(--err)" }}>{Ic.warn}</span>} value={String(s.stockBajoCount)} hint={s.stockBajoCount === 0 ? "Sin alertas" : "Insumos"} delay={180} />
      </div>

      <div className="db-mid">
        <div className="db-card">
          <div className="db-card-title">
            Ventas Últimos 7 Días
            <span className="db-card-title-icon">{Ic.bar}</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <div className="db-chart-y" style={{ minWidth: 34 }}>
              {["$180k", "$135k", "$90k", "$45k", "$0k"].map((v) => (
                <span key={v}>{v}</span>
              ))}
            </div>
            <div style={{ flex: 1 }}>
              <div className="db-chart-skeleton">
                {s.barras7Dias.map((b, i) => (
                  <div
                    key={b.label}
                    className="db-bar-ghost"
                    style={{
                      height: `${b.heightPct}%`,
                      animationDelay: `${i * 0.08}s`,
                      background: b.total > 0 ? "var(--orange)" : undefined,
                    }}
                  />
                ))}
              </div>
              <div className="db-chart-x">
                {s.barras7Dias.map((b) => (
                  <span key={b.label}>{b.label}</span>
                ))}
              </div>
            </div>
          </div>
          {s.barras7Dias.every((b) => b.total === 0) && (
            <div className="db-empty" style={{ padding: "16px 0 4px" }}>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>Sin ventas registradas aún.</p>
            </div>
          )}
        </div>

        <div className="db-card">
          <div className="db-card-title">Por Categoría</div>
          {s.porCategoria.length === 0 ? (
            <div className="db-donut-skeleton">
              <div className="db-donut-hole"><span>Sin<br />datos</span></div>
            </div>
          ) : (
            s.porCategoria.map((cat) => (
              <div key={cat.nombre} className="db-legend-row">
                <div className="db-legend-left">
                  <span className="db-legend-dot" style={{ background: cat.color }} />
                  {cat.nombre}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt(cat.total)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="db-bottom">
        <div className="db-card">
          <div className="db-card-title">
            Productos Más Vendidos
            <span className="db-card-title-icon">{Ic.star}</span>
          </div>
          {s.topProductos.length === 0 ? (
            <div className="db-empty">
              <div className="db-empty-icon">{Ic.star}</div>
              <div className="db-empty-title">Sin ventas registradas</div>
              <div className="db-empty-desc">Los productos más vendidos aparecerán aquí.</div>
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {s.topProductos.map((p) => (
                <li key={p.nombre} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
                  <span>{p.nombre}</span>
                  <strong>{p.cantidad} uds</strong>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="db-card">
            <div className="db-card-title">Alertas de Stock</div>
            {s.stockBajo.length === 0 ? (
              <div className="db-empty">
                <div className="db-empty-icon" style={{ background: "rgba(192,57,43,0.1)", color: "var(--err)" }}>{Ic.warn}</div>
                <div className="db-empty-title">Sin alertas activas</div>
              </div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {s.stockBajo.map((i) => (
                  <li key={i.id} style={{ padding: "8px 0", fontSize: 14 }}>
                    <strong>{i.nombre}</strong> — {i.cantidad_actual} {i.unidad} (mín. {i.stock_minimo})
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="db-card">
            <div className="db-card-title">Últimas Ventas</div>
            {s.ultimasVentas.length === 0 ? (
              <div className="db-empty">
                <div className="db-empty-icon">{Ic.receipt}</div>
                <div className="db-empty-title">Sin ventas hoy</div>
              </div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {s.ultimasVentas.map((v) => (
                  <li key={v.id} style={{ padding: "8px 0", display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span>{v.hora} · {v.metodo}</span>
                    <strong>{fmt(v.total)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
