import "../styles/Caja.css";

interface CajaActivaProps {
  baseInicial: number;
}

export default function CajaActiva({ baseInicial }: CajaActivaProps) {
  const formatter = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const formatCurrency = (val: number) => formatter.format(val).replace(/COP\s?/, "$ ");

  const totalVendido = 0;
  const gastos = 0;
  const saldoNeto = baseInicial + totalVendido - gastos;

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD format
  };

  return (
    <div className="caja-activa">
      <div className="caja-activa-status">
        <span className="caja-activa-dot"></span>
        <p>Caja Abierta desde {getTodayDate()}</p>
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
          <p className="caja-method-value">{formatCurrency(0)}</p>
          <p className="caja-method-transactions">0 transacciones</p>
        </div>
        <div className="caja-method-card">
          <p className="caja-method-title"><span className="caja-method-icon">💳</span> Transferencias</p>
          <p className="caja-method-value">{formatCurrency(0)}</p>
          <p className="caja-method-transactions">0 transacciones</p>
        </div>
      </div>

      <div className="caja-activa-sections">
        <div className="caja-section-card">
          <div className="caja-section-header">
            <h3>Ventas de esta sesión (0)</h3>
            <button className="caja-eye-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
          <div className="caja-section-body empty">
            <p>Sin ventas</p>
          </div>
        </div>

        <div className="caja-section-card">
          <div className="caja-section-header">
            <h3>Gastos / Caja menor</h3>
            <button className="caja-add-btn">+ Agregar</button>
          </div>
          <div className="caja-section-body empty">
            <p>Sin gastos registrados</p>
          </div>
        </div>
      </div>
    </div>
  );
}