import { useMemo, useState } from "react";
import { apiLogout } from "../auth/authService";
import { cerrarCaja, crearGastoCaja, fetchGastosPorCaja, type GastoCajaApi } from "../services/cajaService";
import { fetchVentas, type VentaApi } from "../services/ventasService";

type UsuarioLite = {
  id?: string;
  rol?: string;
};

type CajaLite = {
  id?: string;
  monto_apertura?: number;
};

type UseSessionCloseFlowParams = {
  usuario: UsuarioLite | null;
  caja: CajaLite | null;
  cajaId: string | null;
  cajaAbierta: boolean;
  setCajaFromResponse: (value: null) => void;
};

export function useSessionCloseFlow({
  usuario,
  caja,
  cajaId,
  cajaAbierta,
  setCajaFromResponse,
}: UseSessionCloseFlowParams) {
  const [showCloseSessionModal, setShowCloseSessionModal] = useState(false);
  const [loadingCloseData, setLoadingCloseData] = useState(false);
  const [closingSession, setClosingSession] = useState(false);
  const [closeError, setCloseError] = useState("");
  const [ventasCaja, setVentasCaja] = useState<VentaApi[]>([]);
  const [gastosDia, setGastosDia] = useState<GastoCajaApi[]>([]);
  const [extraDesc, setExtraDesc] = useState("");
  const [extraMonto, setExtraMonto] = useState("");
  const [extraError, setExtraError] = useState("");
  const [extraGastos, setExtraGastos] = useState<Array<{ descripcion: string; monto: number }>>([]);

  const canManageCaja = usuario?.rol === "admin" || usuario?.rol === "cajero";

  const resumenCierre = useMemo(() => {
    const baseInicial = Number(caja?.monto_apertura ?? 0);
    const totalEfectivo = ventasCaja.reduce((sum, venta) => sum + Number(venta.monto_efectivo), 0);
    const totalTransferencias = ventasCaja.reduce(
      (sum, venta) => sum + Number(venta.monto_transferencia),
      0
    );
    const totalVentas = ventasCaja.reduce((sum, venta) => sum + Number(venta.total), 0);
    const gastosRegistrados = gastosDia.reduce((sum, gasto) => sum + Number(gasto.monto), 0);
    const gastosExtras = extraGastos.reduce((sum, gasto) => sum + Number(gasto.monto), 0);
    const totalGastos = gastosRegistrados + gastosExtras;
    const saldoNeto = baseInicial + totalVentas - totalGastos;

    return {
      baseInicial,
      totalEfectivo,
      totalTransferencias,
      totalVentas,
      totalGastos,
      saldoNeto,
    };
  }, [caja?.monto_apertura, extraGastos, gastosDia, ventasCaja]);

  const resetCloseSessionModal = () => {
    setExtraDesc("");
    setExtraMonto("");
    setExtraError("");
    setExtraGastos([]);
    setCloseError("");
    setVentasCaja([]);
    setGastosDia([]);
  };

  const completeLogout = async () => {
    await apiLogout();
    window.location.href = "/login";
  };

  const loadCloseSessionData = async () => {
    if (!caja?.id) return;
    setLoadingCloseData(true);
    setCloseError("");
    try {
      const [ventas, gastos] = await Promise.all([
        fetchVentas(),
        fetchGastosPorCaja(caja.id),
      ]);
      setVentasCaja(ventas.filter((venta) => venta.caja_id === caja.id));
      setGastosDia(gastos);
    } catch (error) {
      setCloseError(error instanceof Error ? error.message : "No se pudo cargar el cierre de caja");
    } finally {
      setLoadingCloseData(false);
    }
  };

  const handleLogout = async () => {
    if (canManageCaja && cajaAbierta && cajaId) {
      setShowCloseSessionModal(true);
      await loadCloseSessionData();
      return;
    }

    await completeLogout();
  };

  const handleAddExtraGasto = () => {
    const monto = Number(extraMonto);
    if (!extraDesc.trim()) {
      setExtraError("Ingresa una descripción");
      return;
    }
    if (Number.isNaN(monto) || monto <= 0) {
      setExtraError("Ingresa un monto válido");
      return;
    }
    setExtraGastos((prev) => [...prev, { descripcion: extraDesc.trim(), monto }]);
    setExtraDesc("");
    setExtraMonto("");
    setExtraError("");
  };

  const handleCancelCloseSession = () => {
    if (closingSession) return;
    setShowCloseSessionModal(false);
    resetCloseSessionModal();
  };

  const handleConfirmCloseSession = async () => {
    if (!caja?.id || !usuario?.id) {
      setCloseError("No hay una caja activa para cerrar");
      return;
    }

    setClosingSession(true);
    try {
      await Promise.all(
        extraGastos.map((gasto) =>
          crearGastoCaja({
            caja_id: caja.id as string,
            usuario_id: usuario.id as string,
            descripcion: gasto.descripcion,
            monto: gasto.monto,
            categoria: "caja menor",
          })
        )
      );
      await cerrarCaja(caja.id as string);
      setCajaFromResponse(null);
      await completeLogout();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo cerrar caja y sesión";
      setCloseError(errorMessage);
    } finally {
      setClosingSession(false);
    }
  };

  return {
    showCloseSessionModal,
    loadingCloseData,
    closingSession,
    closeError,
    ventasCaja,
    gastosDia,
    extraDesc,
    extraMonto,
    extraError,
    extraGastos,
    resumenCierre,
    handleLogout,
    handleAddExtraGasto,
    handleCancelCloseSession,
    handleConfirmCloseSession,
    setExtraDesc,
    setExtraMonto,
  };
}
