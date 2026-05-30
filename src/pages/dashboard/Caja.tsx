import { useState } from "react";
import { LockIcon } from "../../components/icons/LockIcon";
import CajaEstado from "../../components/CajaEstado";
import CajaActiva from "../../components/CajaActiva";
import CajaHistorial from "../../components/CajaHistorial";
import AperturaCajaModal from "../../components/AperturaCajaModal";
import type { CierreCaja } from "./types/caja.types";
import "../../styles/Caja.css";

const HISTORIAL: CierreCaja[] = [
  { id: 1, fecha: "29 de mayo de 2026", diaSemana: "viernes", cerradoPor: "Lina Rivas", hora: "10:30 p. m.", total: 211000 },
  { id: 2, fecha: "28 de mayo de 2026", diaSemana: "jueves", cerradoPor: "Lina Rivas", hora: "10:00 p. m.", total: 234000 },
];

export default function Caja() {
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [showAperturaModal, setShowAperturaModal] = useState(false);
  const [baseInicial, setBaseInicial] = useState(0);

  const handleAbrirCaja = (dineroBase: number) => {
    setBaseInicial(dineroBase);
    setCajaAbierta(true);
    setShowAperturaModal(false);
  };

  return (
    <div>
      <div className="caja-header">
        <div>
          <h1>Caja</h1>
          <p>Control de apertura, ventas y cierre de caja</p>
        </div>
        {!cajaAbierta ? (
          <button className="caja-btn-abrir" style={{ backgroundColor: '#ef4444' }}>
            <LockIcon size={16} color="#fff" />
            Caja Cerrada
          </button>
        ) : (
          <button className="caja-btn-abrir" style={{ backgroundColor: '#ef4444' }} onClick={() => setCajaAbierta(false)}>
            <LockIcon size={16} color="#fff" />
            Cerrar Caja
          </button>
        )}
      </div>

      {!cajaAbierta ? (
        <CajaEstado
          cajaAbierta={cajaAbierta}
          onAbrir={() => setShowAperturaModal(true)}
          onCerrar={() => setCajaAbierta(false)}
        />
      ) : (
        <CajaActiva baseInicial={baseInicial} />
      )}

      <CajaHistorial historial={HISTORIAL} />

      {showAperturaModal && (
        <AperturaCajaModal
          onClose={() => setShowAperturaModal(false)}
          onAbrir={handleAbrirCaja}
        />
      )}
    </div>
  );
}
