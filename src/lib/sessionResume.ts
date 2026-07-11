const LAST_PATH_KEY = "pos_last_path";

const PATH_ROLES: Record<string, string[]> = {
  "/dashboard": ["admin", "cajero", "mesero"],
  "/dashboard/ventas": ["admin", "cajero", "mesero"],
  "/dashboard/productos": ["admin"],
  "/dashboard/caja": ["admin", "cajero"],
  "/dashboard/configuracion": ["admin"],
};

export function saveLastDashboardPath(pathname: string) {
  if (!pathname.startsWith("/dashboard")) return;
  localStorage.setItem(LAST_PATH_KEY, pathname);
}

export function getResumePath(rol?: string | null): string {
  const raw = localStorage.getItem(LAST_PATH_KEY) || "/dashboard";
  const path = PATH_ROLES[raw] ? raw : "/dashboard";
  if (!rol) return path;
  const allowed = PATH_ROLES[path] ?? ["admin", "cajero", "mesero"];
  if (!allowed.includes(rol)) {
    return "/dashboard";
  }
  return path;
}

export function clearLastDashboardPath() {
  localStorage.removeItem(LAST_PATH_KEY);
}
