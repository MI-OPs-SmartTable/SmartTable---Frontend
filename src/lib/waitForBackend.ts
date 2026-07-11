import { fetchUsuariosParaLogin } from "../services/authUsuariosService";

/**
 * Espera a que el backend responda (útil tras restore/reinicio en Electron).
 */
export async function waitForBackendReady(options?: {
  timeoutMs?: number;
  intervalMs?: number;
  signal?: AbortSignal;
}): Promise<boolean> {
  const timeoutMs = options?.timeoutMs ?? 45000;
  const intervalMs = options?.intervalMs ?? 800;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (options?.signal?.aborted) {
      return false;
    }
    try {
      await fetchUsuariosParaLogin();
      return true;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  return false;
}
