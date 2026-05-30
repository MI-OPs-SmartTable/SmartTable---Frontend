// pages/dashboard/DashboardHome.tsx
const Ic = {
  dollar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  trend: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  shop: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  warn: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  bar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  star: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  clock: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  receipt: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2V8z"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
};

const BAR_HEIGHTS = [20, 30, 18, 25, 65, 85, 70];
const DAYS = ["sáb", "dom", "lun", "mar", "mié", "jue", "vie"];

function StatCard({ label, iconBg, icon, delay = 0 }: { label: string; iconBg: string; icon: React.ReactNode; delay?: number }) {
  return (
    <div className="db-stat-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="db-stat-top">
        <div className="db-stat-label">{label}</div>
        <div className="db-stat-icon" style={{ background: iconBg }}>{icon}</div>
      </div>
      <div className="db-stat-value">$0</div>
      <div className="db-stat-hint">Sin datos</div>
    </div>
  );
}

export default function DashboardHome() {
  return (
    <>
      {/* Stat cards */}
      <div className="db-stats">
        <StatCard label="Ventas Hoy" iconBg="rgba(232,96,28,0.1)" icon={<span style={{ color: "var(--orange)" }}>{Ic.dollar}</span>} delay={0} />
        <StatCard label="Efectivo" iconBg="rgba(45,122,79,0.1)" icon={<span style={{ color: "var(--green)" }}>{Ic.trend}</span>} delay={60} />
        <StatCard label="Transferencia" iconBg="rgba(59,95,192,0.1)" icon={<span style={{ color: "var(--blue)" }}>{Ic.shop}</span>} delay={120} />
        <StatCard label="Stock Bajo" iconBg="rgba(192,57,43,0.1)" icon={<span style={{ color: "var(--err)" }}>{Ic.warn}</span>} delay={180} />
      </div>

      {/* Mid row */}
      <div className="db-mid">
        {/* Ventas 7 días */}
        <div className="db-card">
          <div className="db-card-title">
            Ventas Últimos 7 Días
            <span className="db-card-title-icon">{Ic.bar}</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <div className="db-chart-y" style={{ minWidth: 34 }}>
              {["$180k", "$135k", "$90k", "$45k", "$0k"].map(v => <span key={v}>{v}</span>)}
            </div>
            <div style={{ flex: 1 }}>
              <div className="db-chart-skeleton">
                {BAR_HEIGHTS.map((h, i) => (
                  <div key={i} className="db-bar-ghost" style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }} />
                ))}
              </div>
              <div className="db-chart-x">
                {DAYS.map(d => <span key={d}>{d}</span>)}
              </div>
            </div>
          </div>
          <div className="db-empty" style={{ padding: "16px 0 4px" }}>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>Sin ventas registradas aún.</p>
          </div>
        </div>

        {/* Por Categoría */}
        <div className="db-card">
          <div className="db-card-title">Por Categoría</div>
          <div className="db-donut-skeleton">
            <div className="db-donut-hole"><span>Sin<br />datos</span></div>
          </div>
          {["Comidas Rápidas", "Platos del Día", "Bebidas", "Acompañantes"].map((cat, i) => (
            <div key={cat} className="db-legend-row">
              <div className="db-legend-left">
                <span className="db-legend-dot" style={{ background: ["var(--orange)", "var(--blue)", "var(--green)", "var(--amber)"][i] }} />
                {cat}
              </div>
              <div className="db-ghost-line" style={{ width: 50 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="db-bottom">
        <div className="db-card">
          <div className="db-card-title">
            Productos Más Vendidos
            <span className="db-card-title-icon">{Ic.star}</span>
          </div>
          <div className="db-empty">
            <div className="db-empty-icon">{Ic.star}</div>
            <div className="db-empty-title">Sin ventas registradas</div>
            <div className="db-empty-desc">Los productos más vendidos aparecerán aquí.</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="db-card">
            <div className="db-card-title">Alertas de Stock</div>
            <div className="db-empty">
              <div className="db-empty-icon" style={{ background: "rgba(192,57,43,0.1)", color: "var(--err)" }}>{Ic.warn}</div>
              <div className="db-empty-title">Sin alertas activas</div>
            </div>
          </div>

          <div className="db-card">
            <div className="db-card-title">Últimas Ventas</div>
            <div className="db-empty">
              <div className="db-empty-icon">{Ic.receipt}</div>
              <div className="db-empty-title">Sin ventas hoy</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}