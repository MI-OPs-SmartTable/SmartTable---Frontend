import { clearSession, getToken } from "../auth/authService";

const baseUrl = import.meta.env.VITE_API_URL as string | undefined;

function resolveBaseUrl(): string {
  if (!baseUrl || !baseUrl.trim()) {
    // Fallback seguro para evitar romper toda la app cuando falta .env local.
    if (typeof window !== "undefined") {
      console.warn("VITE_API_URL no está definida; usando fallback '/api'.");
    }
    return "/api";
  }
  return baseUrl.replace(/\/$/, "");
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = {
  auth?: boolean;
  body?: unknown;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    const message =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as { error: string }).error)
        : `Error HTTP ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { auth = true, body } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (!token) {
      throw new ApiError("Sesión no iniciada", 401);
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${resolveBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  return parseResponse<T>(response);
}

export const apiClient = {
  get: <T>(path: string, auth = true) => request<T>("GET", path, { auth }),
  post: <T>(path: string, body?: unknown, auth = true) =>
    request<T>("POST", path, { auth, body }),
  put: <T>(path: string, body?: unknown, auth = true) =>
    request<T>("PUT", path, { auth, body }),
  patch: <T>(path: string, body?: unknown, auth = true) =>
    request<T>("PATCH", path, { auth, body }),
  delete: <T>(path: string, auth = true) => request<T>("DELETE", path, { auth }),
  /** Sube un cuerpo binario (p. ej. respaldo .db.gz) sin JSON. */
  postBinary: async <T>(
    path: string,
    body: ArrayBuffer | Blob,
    options: { auth?: boolean; contentType?: string; fileName?: string } = {}
  ): Promise<T> => {
    const { auth = true, contentType = "application/octet-stream", fileName } = options;
    const headers: Record<string, string> = {
      "Content-Type": contentType,
    };
    if (fileName) {
      headers["X-Backup-Filename"] = encodeURIComponent(fileName);
    }
    if (auth) {
      const token = getToken();
      if (!token) {
        throw new ApiError("Sesión no iniciada", 401);
      }
      headers.Authorization = `Bearer ${token}`;
    }
    const url = `${resolveBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
    const response = await fetch(url, { method: "POST", headers, body });
    if (response.status === 204) {
      return undefined as T;
    }
    return parseResponse<T>(response);
  },
};
