import { useCallback, useEffect, useState } from "react";
import { LockIcon } from "../../components/icons/LockIcon";
import CajaEstado from "../../components/CajaEstado";
import CajaActiva from "../../components/CajaActiva";
import CajaHistorial from "../../components/CajaHistorial";
import AperturaCajaModal from "../../components/AperturaCajaModal";
import CierreCajaModal, {
  type ResumenCierreCaja,
} from "../../components/CierreCajaModal";
import { usePosSession } from "../../context/PosSessionContext";
import { mapCajaHistorialItem } from "../../lib/mappers/cajaMapper";
import { parseLocalDateTime } from "../../lib/dateTime";
import {
  abrirCaja,
  cerrarCaja,
  fetchCajaAbiertaActual,
  fetchCajas,
  fetchGastos,
  fetchGastosPorCaja,
} from "../../services/cajaService";
import { fetchUsuarios } from "../../services/configService";
import { fetchVentas } from "../../services/ventasService";
import type { CierreCaja } from "./types/caja.types";
import { useAutoStartTour } from "../../tours/useAutoStartTour";
import "../../styles/Caja.css";

const RESUMEN_VACIO: ResumenCierreCaja = {
  baseInicial: 0,
  totalEfectivo: 0,
  totalTransferencias: 0,
  totalVentas: 0,
  totalGastos: 0,
  saldoNeto: 0,
};

export default function Caja() {
  useAutoStartTour("caja");
  const {
    usuario,
    caja,
    cajaAbierta,
    loadingCaja,
    refreshCaja,
    setCajaFromResponse,
  } = usePosSession();

  const [showAperturaModal, setShowAperturaModal] = useState(false);
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [resumenCierre, setResumenCierre] = useState<ResumenCierreCaja>(RESUMEN_VACIO);
  const [historial, setHistorial] = useState<CierreCaja[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [closingCaja, setClosingCaja] = useState(false);
  const [actionError, setActionError] = useState("");
  const [bloqueoApertura, setBloqueoApertura] = useState<string | null>(null);

  const loadBloqueoApertura = useCallback(async () => {
    if (!usuario?.id || cajaAbierta) {
      setBloqueoApertura(null);
      return;
    }

    try {
      const [cajaActual, usuarios] = await Promise.all([
        fetchCajaAbiertaActual(),
        fetchUsuarios().catch(() => []),
      ]);

      if (!cajaActual || cajaActual.usuario_id === usuario.id) {
        setBloqueoApertura(null);
        return;
      }

      const titular =
        usuarios.find((user) => user.id === cajaActual.usuario_id)?.nombre ??
        "otro usuario";
      setBloqueoApertura(
        `Hay una caja abierta por ${titular}. Debe iniciar sesión y cerrar la caja antes de abrir una nueva.`
      );
    } catch {
      setBloqueoApertura(null);
    }
  }, [usuario?.id, cajaAbierta]);

  const loadHistorial = useCallback(async () => {
    setLoadingHistorial(true);
    try {
      const [cajas, ventas, usuarios, gastos] = await Promise.all([
        fetchCajas(),
        fetchVentas(),
        fetchUsuarios().catch(() => []),
        fetchGastos().catch(() => []),
      ]);

      const usuariosPorId = new Map(
        usuarios.map((user) => [user.id, user.nombre])
      );

      const cerradas = cajas
        .filter((item) => item.estado === "cerrada")
        .sort((a, b) => {
          const dateA = parseLocalDateTime(a.cierre_at ?? a.apertura_at).getTime();
          const dateB = parseLocalDateTime(b.cierre_at ?? b.apertura_at).getTime();
          return dateB - dateA;
        });

      setHistorial(
        cerradas.map((item) => {
          const ventasCaja = ventas.filter((venta) => venta.caja_id === item.id);
          const gastosCaja = gastos
            .filter((gasto) => gasto.caja_id === item.id)
            .map((gasto) => ({
              id: gasto.id,
              descripcion: gasto.descripcion,
              monto: Number(gasto.monto),
            }));
          const nombre =
            usuariosPorId.get(item.usuario_id) ??
            (item.usuario_id === usuario?.id ? usuario.nombre_completo : "Usuario");

          return mapCajaHistorialItem(item, nombre, ventasCaja, gastosCaja);
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

  useEffect(() => {
    void loadBloqueoApertura();
  }, [loadBloqueoApertura]);

  const tryOpenApertura = () => {
    if (bloqueoApertura) {
      setActionError(bloqueoApertura);
      setShowAperturaModal(false);
      return;
    }
    setActionError("");
    setShowAperturaModal(true);
  };

  const handleAbrirCaja = async (dineroBase: number) => {
    if (!usuario?.id) {
      throw new Error("No hay un usuario activo para abrir caja");
    }

    if (bloqueoApertura) {
      setActionError(bloqueoApertura);
      setShowAperturaModal(false);
      throw new Error(bloqueoApertura);
    }

    try {
      const abierta = await abrirCaja(usuario.id, dineroBase);
      setCajaFromResponse(abierta);
      await refreshCaja();
      setShowAperturaModal(false);
      setActionError("");
      setBloqueoApertura(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo abrir la caja";
      setActionError(message);
      setShowAperturaModal(false);
      await loadBloqueoApertura();
      throw err;
    }
  };

  const openCierreModal = async () => {
    if (!caja?.id) return;
    setActionError("");
    try {
      const [ventas, gastos] = await Promise.all([
        fetchVentas(),
        fetchGastosPorCaja(caja.id),
      ]);
      const ventasCaja = ventas.filter((venta) => venta.caja_id === caja.id);
      const baseInicial = Number(caja.monto_apertura ?? 0);
      const totalEfectivo = ventasCaja.reduce(
        (sum, venta) => sum + Number(venta.monto_efectivo),
        0
      );
      const totalTransferencias = ventasCaja.reduce(
        (sum, venta) => sum + Number(venta.monto_transferencia),
        0
      );
      const totalVentas = ventasCaja.reduce(
        (sum, venta) => sum + Number(venta.total),
        0
      );
      const totalGastos = gastos.reduce((sum, gasto) => sum + Number(gasto.monto), 0);

      setResumenCierre({
        baseInicial,
        totalEfectivo,
        totalTransferencias,
        totalVentas,
        totalGastos,
        saldoNeto: baseInicial + totalVentas - totalGastos,
      });
      setShowCierreModal(true);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "No se pudo preparar el cierre de caja"
      );
    }
  };

  const handleConfirmarCierre = async () => {
    if (!caja?.id) return;

    setClosingCaja(true);
    setActionError("");
    try {
      await cerrarCaja(caja.id);
      setCajaFromResponse(null);
      setShowCierreModal(false);
      await refreshCaja();
      await loadHistorial();
      await loadBloqueoApertura();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo cerrar la caja");
    } finally {
      setClosingCaja(false);
    }
  };

  if (loadingCaja) {
    return <p className="caja-loading">Verificando estado de caja...</p>;
  }

  const aperturaBloqueada = Boolean(bloqueoApertura) && !cajaAbierta;
  const esTitular = Boolean(caja && usuario?.id && caja.usuario_id === usuario.id);
  const puedeCerrar = cajaAbierta && esTitular;

  return (
    <div>
      <div className="caja-header">
        <div>
          <h1>Caja</h1>
          <p>Control de apertura, ventas y cierre de caja</p>
        </div>
        {cajaAbierta ? (
          puedeCerrar ? (
            <button
              type="button"
              className="caja-btn-abrir cerrar"
              onClick={() => void openCierreModal()}
              disabled={closingCaja}
            >
              <LockIcon size={16} color="#fff" />
              Cerrar caja
            </button>
          ) : (
            <span className="caja-colaborador-badge" title="Solo quien abrió la caja puede cerrarla">
              Colaborador · sin permiso de cierre
            </span>
          )
        ) : (
          <button
            type="button"
            className={`caja-btn-abrir ${aperturaBloqueada ? "bloqueada" : "abrir"}`}
            onClick={tryOpenApertura}
            disabled={closingCaja || aperturaBloqueada}
            title={aperturaBloqueada ? bloqueoApertura ?? undefined : undefined}
          >
            <LockIcon size={16} color="#fff" />
            Abrir caja
          </button>
        )}
      </div>

      {(actionError || bloqueoApertura) && (
        <p className="caja-error">{actionError || bloqueoApertura}</p>
      )}

      {!cajaAbierta || !caja ? (
        <CajaEstado
          cajaAbierta={false}
          onAbrir={tryOpenApertura}
          onCerrar={() => void openCierreModal()}
          bloqueada={aperturaBloqueada}
          bloqueoMensaje={bloqueoApertura ?? undefined}
        />
      ) : (
        <CajaActiva caja={caja} usuarioId={usuario?.id ?? ""} />
      )}

      {loadingHistorial ? (
        <p className="caja-loading">Cargando historial...</p>
      ) : (
        <CajaHistorial historial={historial} />
      )}

      {showAperturaModal && !aperturaBloqueada && (
        <AperturaCajaModal
          onClose={() => setShowAperturaModal(false)}
          onAbrir={handleAbrirCaja}
        />
      )}

      {showCierreModal && (
        <CierreCajaModal
          resumen={resumenCierre}
          loading={closingCaja}
          onClose={() => setShowCierreModal(false)}
          onConfirm={handleConfirmarCierre}
        />
      )}
    </div>
  );
}
