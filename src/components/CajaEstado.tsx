import { LockIcon } from "./icons/LockIcon";

interface Props {
  cajaAbierta: boolean;
  onAbrir: () => void;
  onCerrar: () => void;
  bloqueada?: boolean;
  bloqueoMensaje?: string;
}

export default function CajaEstado({
  cajaAbierta,
  onAbrir,
  onCerrar,
  bloqueada = false,
  bloqueoMensaje,
}: Props) {
  return (
    <div className={`caja-estado ${cajaAbierta ? "abierta" : "cerrada"}`}>
      <div className="caja-estado-icon">
        <LockIcon size={36} color={cajaAbierta ? "#22C55E" : bloqueada ? "#DC2626" : "#F59E0B"} />
      </div>

      <h2>
        {cajaAbierta
          ? "Caja Abierta"
          : bloqueada
            ? "Caja ocupada"
            : "Caja Cerrada"}
      </h2>

      <p>
        {cajaAbierta
          ? "Hay una sesión de caja activa. Puedes registrar ventas."
          : bloqueada
            ? bloqueoMensaje ||
              "Otro usuario tiene la caja abierta. Debe cerrarla antes de abrir una nueva."
            : "No hay una sesión de caja activa. Abre la caja para registrar ventas."}
      </p>

      {!cajaAbierta ? (
        <button
          type="button"
          className="caja-btn-accion abrir"
          onClick={onAbrir}
          disabled={bloqueada}
          title={bloqueada ? bloqueoMensaje : undefined}
        >
          Abrir Caja Ahora
        </button>
      ) : (
        <button type="button" className="caja-btn-accion cerrar" onClick={onCerrar}>
          Cerrar Caja
        </button>
      )}
    </div>
  );
}
