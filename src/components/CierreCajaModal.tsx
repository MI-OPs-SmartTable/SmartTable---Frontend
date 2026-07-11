import { LockIcon } from "./icons/LockIcon";
import { formatCOP } from "../lib/formatMoney";

export type ResumenCierreCaja = {
  baseInicial: number;
  totalEfectivo: number;
  totalTransferencias: number;
  totalVentas: number;
  totalGastos: number;
  saldoNeto: number;
};

interface Props {
  resumen: ResumenCierreCaja;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export default function CierreCajaModal({
  resumen,
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  return (
    <div className="caja-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="cierre-caja-title">
      <div className="caja-modal caja-cierre-modal">
        <div className="caja-modal-header">
          <div className="caja-modal-title" id="cierre-caja-title">
            Cierre de Caja
          </div>
          <button
            type="button"
            className="caja-modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="caja-modal-body">
          <div className="caja-cierre-resumen">
            <div className="caja-cierre-row">
              <span>Base inicial:</span>
              <strong>{formatCOP(resumen.baseInicial)}</strong>
            </div>
            <div className="caja-cierre-row">
              <span>Total en efectivo:</span>
              <strong className="ok">{formatCOP(resumen.totalEfectivo)}</strong>
            </div>
            <div className="caja-cierre-row">
              <span>Total transferencias:</span>
              <strong className="info">{formatCOP(resumen.totalTransferencias)}</strong>
            </div>
            <div className="caja-cierre-row">
              <span>Total ventas:</span>
              <strong className="ok">{formatCOP(resumen.totalVentas)}</strong>
            </div>
            <div className="caja-cierre-row">
              <span>Gastos:</span>
              <strong className="err">- {formatCOP(resumen.totalGastos)}</strong>
            </div>
            <div className="caja-cierre-row neto">
              <span>Saldo neto:</span>
              <strong>{formatCOP(resumen.saldoNeto)}</strong>
            </div>
          </div>

          <p className="caja-cierre-aviso">
            ¿Estás seguro de cerrar la caja? Esta acción no se puede deshacer.
          </p>
        </div>

        <div className="caja-modal-acts">
          <button type="button" className="caja-btn-cancel" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            type="button"
            className="caja-btn-cerrar-confirm"
            onClick={() => void onConfirm()}
            disabled={loading}
          >
            <LockIcon size={16} color="#fff" />
            {loading ? "Cerrando..." : "Cerrar Caja"}
          </button>
        </div>
      </div>
    </div>
  );
}
