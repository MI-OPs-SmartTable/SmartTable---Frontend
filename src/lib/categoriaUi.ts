/** Presentación UI por nombre de categoría (fallback si no hay emoji en BD). */
const UI_BY_NOMBRE: Record<string, { color: string; emoji: string }> = {
  "Comidas Rápidas": { color: "#E8601C", emoji: "🔥" },
  "Platos del Día": { color: "#2d7a4f", emoji: "☀️" },
  "Platos fuertes": { color: "#2d7a4f", emoji: "💼" },
  Bebidas: { color: "#2D7A4F", emoji: "🧊" },
  Acompañantes: { color: "#D4A017", emoji: "✨" },
  Café: { color: "#6B4423", emoji: "🫖" },
  Postres: { color: "#C0392B", emoji: "🎁" },
};

const DEFAULT_UI = { color: "#6B7280", emoji: "🏷️" };

export function getCategoriaUi(nombre: string): { color: string; emoji: string } {
  return UI_BY_NOMBRE[nombre] ?? DEFAULT_UI;
}

export function enrichCategoria<T extends { nombre: string; emoji?: string | null }>(
  cat: T
): T & { color: string; emoji: string } {
  const ui = getCategoriaUi(cat.nombre);
  return {
    ...cat,
    color: ui.color,
    emoji: (cat.emoji && String(cat.emoji).trim()) || ui.emoji,
  };
}
