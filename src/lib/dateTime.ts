/**
 * Fechas del POS se guardan en hora local del sistema: "YYYY-MM-DD HH:MM:SS"
 * (sin Z). Se interpretan siempre como hora local, no UTC.
 */
export function parseLocalDateTime(value: string | null | undefined): Date {
  if (!value) return new Date();

  const trimmed = String(value).trim();
  if (!trimmed) return new Date();

  // ISO con Z u offset explícito
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }

  const normalized = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export function formatLocalTime(
  value: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  return parseLocalDateTime(value).toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options,
  });
}

export function formatLocalDate(
  value: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  return parseLocalDateTime(value).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  });
}

export function formatLocalDateTime(
  value: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  return parseLocalDateTime(value).toLocaleString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options,
  });
}
