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

type PosSessionContextValue = {
  usuario: PosUser | null;
  setUsuario: (user: PosUser) => void;
  caja: CajaApi | null;
  cajaId: string | null;
  cajaAbierta: boolean;
  loadingCaja: boolean;
  refreshCaja: () => Promise<void>;
  setCajaFromResponse: (caja: CajaApi | null) => void;
};

const PosSessionContext = createContext<PosSessionContextValue | null>(null);

export function PosSessionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuarioState] = useState<PosUser | null>(() => getUser());
  const [caja, setCaja] = useState<CajaApi | null>(null);
  const [loadingCaja, setLoadingCaja] = useState(true);

  const refreshCaja = useCallback(async () => {
    if (!usuario?.id) {
      setCaja(null);
      setLoadingCaja(false);
      return;
    }
    setLoadingCaja(true);
    try {
      const abierta = await fetchCajaAbierta(usuario.id);
      setCaja(abierta);
    } catch {
      setCaja(null);
    } finally {
      setLoadingCaja(false);
    }
  }, [usuario?.id]);

  useEffect(() => {
    refreshCaja();
  }, [refreshCaja]);

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
