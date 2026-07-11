import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getUser, saveUser, type PosUser } from "../auth/authService";
import { fetchCajaAbierta, type CajaApi } from "../services/cajaService";

type RefreshCajaOptions = { silent?: boolean };

type PosSessionContextValue = {
  usuario: PosUser | null;
  setUsuario: (user: PosUser) => void;
  caja: CajaApi | null;
  cajaId: string | null;
  cajaAbierta: boolean;
  loadingCaja: boolean;
  refreshCaja: (options?: RefreshCajaOptions) => Promise<void>;
  setCajaFromResponse: (caja: CajaApi | null) => void;
};

const PosSessionContext = createContext<PosSessionContextValue | null>(null);

/** Cada cuánto se revalida la caja abierta en segundo plano (p. ej. si un admin quita al usuario como colaborador). */
const CAJA_POLL_INTERVAL_MS = 20000;

export function PosSessionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuarioState] = useState<PosUser | null>(() => getUser());
  const [caja, setCaja] = useState<CajaApi | null>(null);
  const [loadingCaja, setLoadingCaja] = useState(true);

  const refreshCaja = useCallback(
    async (options?: RefreshCajaOptions) => {
      const silent = options?.silent ?? false;
      if (!usuario?.id) {
        setCaja(null);
        setLoadingCaja(false);
        return;
      }
      if (!silent) setLoadingCaja(true);
      try {
        const abierta = await fetchCajaAbierta(usuario.id);
        setCaja(abierta);
      } catch {
        if (!silent) setCaja(null);
      } finally {
        if (!silent) setLoadingCaja(false);
      }
    },
    [usuario?.id]
  );

  useEffect(() => {
    refreshCaja();
  }, [refreshCaja]);

  useEffect(() => {
    if (!usuario?.id) return;

    const revalidate = () => {
      if (document.visibilityState === "visible") {
        void refreshCaja({ silent: true });
      }
    };

    const interval = setInterval(revalidate, CAJA_POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", revalidate);
    window.addEventListener("focus", revalidate);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", revalidate);
      window.removeEventListener("focus", revalidate);
    };
  }, [usuario?.id, refreshCaja]);

  const setUsuario = useCallback((user: PosUser) => {
    saveUser(user);
    setUsuarioState(user);
  }, []);

  const setCajaFromResponse = useCallback((next: CajaApi | null) => {
    setCaja(next);
  }, []);

  const value = useMemo(
    () => ({
      usuario,
      setUsuario,
      caja,
      cajaId: caja?.id ?? null,
      cajaAbierta: caja?.estado === "abierta",
      loadingCaja,
      refreshCaja,
      setCajaFromResponse,
    }),
    [usuario, caja, loadingCaja, refreshCaja, setCajaFromResponse, setUsuario]
  );

  return (
    <PosSessionContext.Provider value={value}>{children}</PosSessionContext.Provider>
  );
}

export function usePosSession(): PosSessionContextValue {
  const ctx = useContext(PosSessionContext);
  if (!ctx) {
    throw new Error("usePosSession debe usarse dentro de PosSessionProvider");
  }
  return ctx;
}
