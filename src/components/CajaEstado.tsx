import { LockIcon } from "./icons/LockIcon";

interface Props {
  cajaAbierta: boolean;
  onAbrir: () => void;
  onCerrar: () => void;
}

export default function CajaEstado({ cajaAbierta, onAbrir, onCerrar }: Props) {
  return (
    <div className={`caja-estado ${cajaAbierta ? "abierta" : "cerrada"}`}>
      <div className="caja-estado-icon">
        <LockIcon size={36} color={cajaAbierta ? "#22C55E" : "#F59E0B"} />
      </div>

      <h2>{cajaAbierta ? "Caja Abierta" : "Caja Cerrada"}</h2>

      <p>
        {cajaAbierta
          ? "Hay una sesión de caja activa. Puedes registrar ventas."
          : "No hay una sesión de caja activa. Abre la caja para registrar ventas."}
      </p>

      {!cajaAbierta ? (
        <button className="caja-btn-accion abrir" onClick={onAbrir}>
          Abrir Caja Ahora
        </button>
      ) : (
        <button className="caja-btn-accion cerrar" onClick={onCerrar}>
          Cerrar Caja
        </button>
      )}
    </div>
  );
}
