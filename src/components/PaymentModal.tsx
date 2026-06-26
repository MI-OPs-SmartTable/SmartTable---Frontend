import { useMemo } from "react";
import { fmt } from "../lib/formatMoney";
import type { MedioPagoApi } from "../services/mediosPagoService";

export type MetodoPago = "efectivo" | "transferencia" | "mixto";

type PaymentModalProps = {
  total: number;
  medios: MedioPagoApi[];
  metodo: MetodoPago;
  onMetodoChange: (metodo: MetodoPago) => void;
  bancoId: string;
  onBancoChange: (id: string) => void;
  referencia: string;
  onReferenciaChange: (value: string) => void;
  montoEfectivo: string;
  onMontoEfectivoChange: (value: string) => void;
  montoTransferencia: string;
  onMontoTransferenciaChange: (value: string) => void;
  processing: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function PaymentModal({
  total,
  medios,
  metodo,
  onMetodoChange,
  bancoId,
  onBancoChange,
  referencia,
  onReferenciaChange,
  montoEfectivo,
  onMontoEfectivoChange,
  montoTransferencia,
  onMontoTransferenciaChange,
  processing,
  error,
  onClose,
  onConfirm,
}: PaymentModalProps) {
  const sumaMixta = useMemo(
    () => (Number(montoEfectivo) || 0) + (Number(montoTransferencia) || 0),
    [montoEfectivo, montoTransferencia]
  );

  const pagoValido = useMemo(() => {
    if (metodo === "efectivo") return true;
    if (metodo === "transferencia") return !!bancoId;
    if (metodo === "mixto") return !!bancoId && sumaMixta === total;
    return false;
  }, [metodo, bancoId, sumaMixta, total]);

  const handleMetodo = (next: MetodoPago) => {
    onMetodoChange(next);
    if (next === "efectivo") {
      onMontoEfectivoChange(String(total));
      onMontoTransferenciaChange("0");
    } else if (next === "transferencia") {
      onMontoEfectivoChange("0");
      onMontoTransferenciaChange(String(total));
    } else {
      onMontoEfectivoChange("");
      onMontoTransferenciaChange("");
    }
  };

  return (
    <div className="caja-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="caja-modal ventas-pago-modal">
        <div className="caja-modal-header">
          <div className="caja-modal-title">Cobrar pedido</div>
          <button type="button" className="caja-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="caja-modal-body">
          <div className="ventas-pago-resumen">
            <div className="ventas-pago-resumen-row total">
              <span>Total a pagar</span>
              <span>{fmt(total)}</span>
            </div>
          </div>

          <div className="ventas-pago-metodos">
            <label className="ventas-label">Forma de pago</label>
            <div className="ventas-pago-metodos-grid">
              {(["efectivo", "transferencia", "mixto"] as MetodoPago[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`ventas-pago-metodo${metodo === option ? " active" : ""}`}
                  onClick={() => handleMetodo(option)}
                >
                  {option === "efectivo" ? "Efectivo" : option === "transferencia" ? "Transferencia" : "Mixto"}
                </button>
              ))}
            </div>
          </div>

          {(metodo === "transferencia" || metodo === "mixto") && (
            <>
              <div className="caja-modal-field">
                <label>Entidad bancaria</label>
                <select className="ventas-select" value={bancoId} onChange={(e) => onBancoChange(e.target.value)}>
                  <option value="">— Seleccionar banco —</option>
                  {medios.map((m) => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="caja-modal-field">
                <label>Descripción o referencia</label>
                <input
                  value={referencia}
                  onChange={(e) => onReferenciaChange(e.target.value)}
                  placeholder="Ej: Número de aprobación"
                />
              </div>
            </>
          )}

          {metodo === "mixto" && (
            <div className="ventas-pago-mixto">
              <div className="caja-modal-field">
                <label>Efectivo</label>
                <input
                  value={montoEfectivo}
                  onChange={(e) => onMontoEfectivoChange(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                />
              </div>
              <div className="caja-modal-field">
                <label>Transferencia</label>
                <input
                  value={montoTransferencia}
                  onChange={(e) => onMontoTransferenciaChange(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                />
              </div>
              {sumaMixta !== total && (montoEfectivo || montoTransferencia) && (
                <p className="ventas-pago-error-inline">
                  La suma ({fmt(sumaMixta)}) debe ser igual al total ({fmt(total)})
                </p>
              )}
            </div>
          )}

          {error && <div className="ventas-banner-error">{error}</div>}
        </div>

        <div className="caja-modal-acts">
          <button type="button" className="caja-btn-cancel" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="caja-btn-submit"
            disabled={processing || !pagoValido}
            onClick={onConfirm}
          >
            {processing ? "Procesando..." : "Confirmar venta"}
          </button>
        </div>
      </div>
    </div>
  );
}
