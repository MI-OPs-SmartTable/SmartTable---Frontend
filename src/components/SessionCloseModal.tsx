import { formatCOP } from "../lib/formatMoney";

type ResumenCierre = {
  baseInicial: number;
  totalEfectivo: number;
  totalTransferencias: number;
  totalVentas: number;
  totalGastos: number;
  saldoNeto: number;
};

type GastoItem = {
  descripcion: string;
  monto: number;
};

type SessionCloseModalProps = {
  loadingCloseData: boolean;
  closingSession: boolean;
  closeError: string;
  gastosDia: GastoItem[];
  extraGastos: GastoItem[];
  extraDesc: string;
  extraMonto: string;
  extraError: string;
  resumenCierre: ResumenCierre;
  onExtraDescChange: (value: string) => void;
  onExtraMontoChange: (value: string) => void;
  onAddExtraGasto: () => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function SessionCloseModal({
  loadingCloseData,
  closingSession,
  closeError,
  gastosDia,
  extraGastos,
  extraDesc,
  extraMonto,
  extraError,
  resumenCierre,
  onExtraDescChange,
  onExtraMontoChange,
  onAddExtraGasto,
  onCancel,
  onConfirm,
}: SessionCloseModalProps) {
  return (
    <div className="db-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="db-close-title">
      <div className="db-close-modal">
        <div className="db-close-header">
          <h3 id="db-close-title">Cerrar Caja y Sesión</h3>
          <button
            type="button"
            className="db-close-x"
            onClick={onCancel}
            aria-label="Cerrar"
            disabled={closingSession}
          >
            ×
          </button>
        </div>

        <div className="db-close-warning">Debe cerrar la caja antes de cerrar sesión</div>

        {loadingCloseData ? (
          <p className="db-close-loading">Cargando información de caja...</p>
        ) : (
          <>
            <div className="db-close-summary">
              <div className="db-close-row"><span>Base inicial:</span><strong>{formatCOP(resumenCierre.baseInicial)}</strong></div>
              <div className="db-close-row"><span>Total en efectivo:</span><strong className="ok">{formatCOP(resumenCierre.totalEfectivo)}</strong></div>
              <div className="db-close-row"><span>Total transferencias:</span><strong className="info">{formatCOP(resumenCierre.totalTransferencias)}</strong></div>
              <div className="db-close-row"><span>Total ventas:</span><strong className="ok">{formatCOP(resumenCierre.totalVentas)}</strong></div>
              <div className="db-close-row"><span>Gastos:</span><strong className="bad">- {formatCOP(resumenCierre.totalGastos)}</strong></div>
              <div className="db-close-total"><span>Saldo neto:</span><strong>{formatCOP(resumenCierre.saldoNeto)}</strong></div>
            </div>

            <div className="db-close-section">
              <p className="db-close-label">Gastos del día</p>
              <div className="db-close-gastos-list">
                {gastosDia.length === 0 && extraGastos.length === 0 ? (
                  <p>Sin gastos registrados</p>
                ) : (
                  [...gastosDia, ...extraGastos].map((g, idx) => (
                    <div key={`${g.descripcion}-${idx}`} className="db-close-gasto-item">
                      <span>{g.descripcion}</span>
                      <strong>- {formatCOP(g.monto)}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="db-close-section">
              <p className="db-close-label">Agregar gasto adicional (opcional)</p>
              <div className="db-close-add-gasto">
                <input
                  type="text"
                  placeholder="Descripción"
                  value={extraDesc}
                  onChange={(e) => onExtraDescChange(e.target.value)}
                  disabled={closingSession}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="$0"
                  value={extraMonto}
                  onChange={(e) => onExtraMontoChange(e.target.value)}
                  disabled={closingSession}
                />
                <button
                  type="button"
                  onClick={onAddExtraGasto}
                  disabled={closingSession}
                  aria-label="Agregar gasto"
                >
                  +
                </button>
              </div>
              {extraError && <p className="db-close-error">{extraError}</p>}
            </div>

            <p className="db-close-help">¿Está seguro de cerrar la caja y salir? Esta acción no se puede deshacer.</p>

            {closeError && <p className="db-close-error">{closeError}</p>}

            <div className="db-close-actions">
              <button type="button" className="db-close-cancel" onClick={onCancel} disabled={closingSession}>
                Cancelar
              </button>
              <button type="button" className="db-close-confirm" onClick={onConfirm} disabled={closingSession}>
                {closingSession ? "Cerrando..." : "Cerrar y Salir"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
