import { useCallback, useEffect, useMemo, useState } from "react";
import { LockIcon } from "../../components/icons/LockIcon";
import CajaEstado from "../../components/CajaEstado";
import CajaActiva from "../../components/CajaActiva";
import CajaHistorial from "../../components/CajaHistorial";
import AperturaCajaModal from "../../components/AperturaCajaModal";
import GastoCajaModal from "../../components/GastoCajaModal";
import { usePosSession } from "../../context/PosSessionContext";
import {
  abrirCaja,
  cerrarCaja,
  crearGastoCaja,
  fetchCajas,
  fetchGastosPorCaja,
  type GastoCajaApi,
} from "../../services/cajaService";
import { fetchVentas, type VentaApi } from "../../services/ventasService";
import { mapCajaHistorialItem } from "../../lib/mappers/cajaMapper";
import type { CierreCaja } from "./types/caja.types";
import "../../styles/Caja.css";

export default function Caja() {
  const { usuario, caja, cajaAbierta, refreshCaja, setCajaFromResponse } = usePosSession();
  const [showAperturaModal, setShowAperturaModal] = useState(false);
  const [showGastoModal, setShowGastoModal] = useState(false);
  const [ventasCaja, setVentasCaja] = useState<VentaApi[]>([]);
  const [gastos, setGastos] = useState<GastoCajaApi[]>([]);
  const [historial, setHistorial] = useState<CierreCaja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadCajaData = useCallback(async () => {
    if (!caja?.id) {
      setVentasCaja([]);
      setGastos([]);
      return;
    }
    const [ventas, gastosCaja] = await Promise.all([
      fetchVentas(),
      fetchGastosPorCaja(caja.id),
    ]);
    setVentasCaja(ventas.filter((v) => v.caja_id === caja.id));
    setGastos(gastosCaja);
  }, [caja?.id]);

  const loadHistorial = useCallback(async () => {
    const cajas = await fetchCajas();
    const cerradas = cajas.filter((c) => c.estado === "cerrada");
    const ventas = await fetchVentas();

    const items = cerradas.map((cajaCerrada) => {
      const ventasCierre = ventas.filter((v) => v.caja_id === cajaCerrada.id);
      const totalVendido = ventasCierre.reduce((s, v) => s + Number(v.total), 0);
      const efectivo = ventasCierre.reduce((s, v) => s + Number(v.monto_efectivo), 0);
      const transferencia = ventasCierre.reduce((s, v) => s + Number(v.monto_transferencia), 0);
      const item = mapCajaHistorialItem(
        cajaCerrada,
        usuario?.nombre_completo ?? "Usuario",
        totalVendido
      );
      return { ...item, montoEfectivo: efectivo, montoTransferencia: transferencia };
    });
    setHistorial(items);
  }, [usuario?.nombre_completo]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        await Promise.all([loadCajaData(), loadHistorial()]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar caja");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [loadCajaData, loadHistorial]);

  const metricas = useMemo(() => {
    const totalVendido = ventasCaja.reduce((s, v) => s + Number(v.total), 0);
    const efectivo = ventasCaja.reduce((s, v) => s + Number(v.monto_efectivo), 0);
    const transferencia = ventasCaja.reduce((s, v) => s + Number(v.monto_transferencia), 0);
    const totalGastos = gastos.reduce((s, g) => s + Number(g.monto), 0);
    return { totalVendido, efectivo, transferencia, totalGastos };
  }, [ventasCaja, gastos]);

  const handleAbrirCaja = async (dineroBase: number) => {
    if (!usuario?.id) return;
    setActionLoading(true);
    setError("");
    try {
      const nueva = await abrirCaja(usuario.id, dineroBase);
      setCajaFromResponse(nueva);
      setShowAperturaModal(false);
      await refreshCaja();
      await loadCajaData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo abrir la caja");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCerrarCaja = async () => {
    if (!caja?.id) return;
    setActionLoading(true);
    setError("");
    try {
      await cerrarCaja(caja.id);
      setCajaFromResponse(null);
      await refreshCaja();
      await loadHistorial();
      setVentasCaja([]);
      setGastos([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cerrar la caja");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGasto = async (payload: {
    monto: number;
    descripcion: string;
    categoria: string;
  }) => {
    if (!caja?.id || !usuario?.id) throw new Error("Caja no abierta");
    await crearGastoCaja({
      caja_id: caja.id,
      usuario_id: usuario.id,
      ...payload,
    });
    await loadCajaData();
  };

  const aperturaLabel = caja?.apertura_at
    ? caja.apertura_at.split(" ")[0] ?? caja.apertura_at
    : new Date().toISOString().split("T")[0];

  return (
    <div>
      <div className="caja-header">
        <div>
          <h1>Caja</h1>
          <p>Control de apertura, ventas y cierre de caja</p>
        </div>
        {!cajaAbierta ? (
          <button
            type="button"
            className="caja-btn-abrir"
            style={{ backgroundColor: "#ef4444" }}
            onClick={() => setShowAperturaModal(true)}
            disabled={actionLoading}
          >
            <LockIcon size={16} color="#fff" />
            Caja Cerrada
          </button>
        ) : (
          <button
            type="button"
            className="caja-btn-abrir"
            style={{ backgroundColor: "#ef4444" }}
            onClick={handleCerrarCaja}
            disabled={actionLoading}
          >
            <LockIcon size={16} color="#fff" />
            {actionLoading ? "Cerrando..." : "Cerrar Caja"}
          </button>
        )}
      </div>

      {error && (
        <p style={{ color: "var(--err)", marginBottom: 12, fontSize: 14 }}>{error}</p>
      )}

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Cargando caja...</p>
      ) : !cajaAbierta ? (
        <CajaEstado
          cajaAbierta={false}
          onAbrir={() => setShowAperturaModal(true)}
          onCerrar={() => undefined}
        />
      ) : (
        <CajaActiva
          baseInicial={Number(caja?.monto_apertura ?? 0)}
          aperturaAt={aperturaLabel}
          totalVendido={metricas.totalVendido}
          gastos={metricas.totalGastos}
          efectivo={metricas.efectivo}
          transferencia={metricas.transferencia}
          ventasCount={ventasCaja.length}
          gastosList={gastos}
          onAgregarGasto={() => setShowGastoModal(true)}
        />
      )}

      <CajaHistorial historial={historial} />

      {showAperturaModal && (
        <AperturaCajaModal
          onClose={() => setShowAperturaModal(false)}
          onAbrir={handleAbrirCaja}
        />
      )}

      {showGastoModal && (
        <GastoCajaModal onClose={() => setShowGastoModal(false)} onGuardar={handleGasto} />
      )}
    </div>
  );
}
