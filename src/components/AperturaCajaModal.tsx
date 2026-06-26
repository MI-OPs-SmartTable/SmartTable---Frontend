import { useState } from "react";
import { LockIcon } from "./icons/LockIcon";

interface Props {
  onClose: () => void;
  onAbrir: (dineroBase: number) => void;
}

export default function AperturaCajaModal({ onClose, onAbrir }: Props) {
  const [dineroBase, setDineroBase] = useState("");

  const handleDineroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir solo números
    const value = e.target.value.replace(/\D/g, "");
    setDineroBase(value);
  };

  const dineroNumerico = parseInt(dineroBase, 10);
  const formatter = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const inputValue = dineroBase ? formatter.format(dineroNumerico).replace(/COP\s?/, "$ ") : "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNaN(dineroNumerico)) {
      onAbrir(dineroNumerico);
    }
  };

  return (
    <div className="caja-modal-overlay">
      <div className="caja-modal">
        <div className="caja-modal-header">
          <div className="caja-modal-title">Apertura de Caja</div>
          <button className="caja-modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="caja-modal-body">
            <p className="caja-modal-desc">
              Ingresa el dinero base con el que inicias el día (efectivo en caja).
            </p>

            <div className="caja-modal-field">
              <label>Dinero base (COP)</label>
              <input
                type="text"
                placeholder="$ 100.000"
                value={inputValue}
                onChange={handleDineroChange}
                autoFocus
              />
            </div>
          </div>

          <div className="caja-modal-acts">
            <button type="button" className="caja-btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="caja-btn-submit"
              disabled={!dineroBase}
            >
              <LockIcon size={16} color="currentColor" />
              Abrir Caja
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
