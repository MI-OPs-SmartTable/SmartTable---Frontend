export default function Caja() {
  return (
    <div className="db-card">
      <div className="db-card-title">Cierre de Caja</div>
      <div className="db-empty">
        <div className="db-empty-icon">💰</div>
        <div className="db-empty-title">Caja cerrada</div>
        <button className="pl-submit" style={{ marginTop: 16, width: "auto", padding: "10px 24px" }}>
          Abrir Caja
        </button>
      </div>
    </div>
  );
}