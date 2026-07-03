import { useCallback, useEffect, useState } from "react";
import { LockIcon } from "../../components/icons/LockIcon";
import CajaEstado from "../../components/CajaEstado";
import CajaActiva from "../../components/CajaActiva";
import CajaHistorial from "../../components/CajaHistorial";
import AperturaCajaModal from "../../components/AperturaCajaModal";
import { usePosSession } from "../../context/PosSessionContext";
import { mapCajaHistorialItem } from "../../lib/mappers/cajaMapper";
import { abrirCaja, cerrarCaja, fetchCajas } from "../../services/cajaService";
import { fetchUsuarios } from "../../services/configService";
import { fetchVentas } from "../../services/ventasService";
import type { CierreCaja } from "./types/caja.types";
import "../../styles/Caja.css";

export default function Caja() {
  const {
    usuario,
    caja,
    cajaAbierta,
    loadingCaja,
    refreshCaja,
    setCajaFromResponse,
  } = usePosSession();

  const [showAperturaModal, setShowAperturaModal] = useState(false);
  const [historial, setHistorial] = useState<CierreCaja[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [closingCaja, setClosingCaja] = useState(false);
  const [actionError, setActionError] = useState("");

  const loadHistorial = useCallback(async () => {
    setLoadingHistorial(true);
    try {
      const [cajas, ventas, usuarios] = await Promise.all([
        fetchCajas(),
        fetchVentas(),
        fetchUsuarios().catch(() => []),
      ]);

      const usuariosPorId = new Map(
        usuarios.map((user) => [user.id, user.nombre])
      );

      const cerradas = cajas
        .filter((item) => item.estado === "cerrada")
        .sort((a, b) => {
          const dateA = new Date(a.cierre_at ?? a.apertura_at).getTime();
          const dateB = new Date(b.cierre_at ?? b.apertura_at).getTime();
          return dateB - dateA;
        });

      setHistorial(
        cerradas.map((item) => {
          const ventasCaja = ventas.filter((venta) => venta.caja_id === item.id);
          const nombre =
            usuariosPorId.get(item.usuario_id) ??
            (item.usuario_id === usuario?.id ? usuario.nombre_completo : "Usuario");

          return mapCajaHistorialItem(item, nombre, ventasCaja);
        })
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo cargar el historial");
    } finally {
      setLoadingHistorial(false);
    }
  }, [usuario?.id, usuario?.nombre_completo]);

  useEffect(() => {
    void loadHistorial();
  }, [loadHistorial]);

  const handleAbrirCaja = async (dineroBase: number) => {
    if (!usuario?.id) {
      throw new Error("No hay un usuario activo para abrir caja");
    }

    const abierta = await abrirCaja(usuario.id, dineroBase);
    setCajaFromResponse(abierta);
    await refreshCaja();
    setShowAperturaModal(false);
    setActionError("");
  };

  const handleCerrarCaja = async () => {
    if (!caja?.id) return;

    const confirmar = window.confirm(
      "¿Cerrar la caja? No podrás registrar ventas hasta abrirla de nuevo."
    );
    if (!confirmar) return;

    setClosingCaja(true);
    setActionError("");
    try {
      await cerrarCaja(caja.id);
      setCajaFromResponse(null);
      await refreshCaja();
      await loadHistorial();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo cerrar la caja");
    } finally {
      setClosingCaja(false);
    }
  };

  if (loadingCaja) {
    return <p className="caja-loading">Verificando estado de caja...</p>;
  }

  return (
    <div>
      <div className="caja-header">
        <div>
          <h1>Caja</h1>
          <p>Control de apertura, ventas y cierre de caja</p>
        </div>
        <button
          type="button"
          className="caja-btn-abrir"
          style={{ backgroundColor: cajaAbierta ? "#22C55E" : "#ef4444" }}
          onClick={cajaAbierta ? handleCerrarCaja : () => setShowAperturaModal(true)}
          disabled={closingCaja}
        >
          <LockIcon size={16} color="#fff" />
          {closingCaja ? "Cerrando..." : cajaAbierta ? "Caja Abierta" : "Caja Cerrada"}
        </button>
      </div>

      {actionError && <p className="caja-error">{actionError}</p>}

      {!cajaAbierta || !caja ? (
        <CajaEstado
          cajaAbierta={false}
          onAbrir={() => setShowAperturaModal(true)}
          onCerrar={handleCerrarCaja}
        />
      ) : (
        <CajaActiva caja={caja} usuarioId={usuario?.id ?? ""} />
      )}

      {loadingHistorial ? (
        <p className="caja-loading">Cargando historial...</p>
      ) : (
        <CajaHistorial historial={historial} />
      )}

      {showAperturaModal && (
        <AperturaCajaModal
          onClose={() => setShowAperturaModal(false)}
          onAbrir={handleAbrirCaja}
        />
      )}
    </div>
  );
}
