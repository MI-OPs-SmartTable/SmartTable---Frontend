/** Íconos de productos (comida / ítems del menú). */
export const PRODUCT_ICONS = [
  "🍔", "🌭", "🍟", "🍕", "🍣", "🍜", "🍛", "🍲", "🥗", "🥙",
  "🥪", "🌮", "🥤", "🍺", "☕", "🧃", "💧", "🍰", "🍦", "🎂",
  "🍽️", "🥩", "🍗", "🥞",
] as const;

/**
 * Íconos de categorías (secciones del menú).
 * Más abstractos / de agrupación, para no repetir los de producto.
 */
export const CATEGORY_ICONS = [
  "🏷️", // etiqueta / sección
  "📂", // carpeta
  "🗂️", // clasificador
  "📌", // destacado
  "⭐", // favoritos / especiales
  "🔥", // populares / del día
  "🆕", // novedades
  "☀️", // desayuno / día
  "🌙", // cena / noche
  "🍃", // frescos / light
  "🌶️", // picante / especialidad
  "🧀", // lácteos / extras
  "🥖", // panadería
  "🦐", // mariscos
  "🍇", // frutas
  "🧊", // fríos
  "🫖", // calientes / té
  "🥂", // celebraciones
  "🧒", // infantil
  "💼", // ejecutivo / almuerzo
  "🎁", // combos / promociones
  "🧾", // menú / carta
  "🛒", // para llevar
  "✨", // premium
] as const;

export const DEFAULT_PRODUCT_ICON = "🍔";
export const DEFAULT_CATEGORY_ICON = "🏷️";

type IconPickerProps = {
  value: string;
  onChange: (emoji: string) => void;
  label?: string;
  icons?: readonly string[];
};

export default function IconPicker({
  value,
  onChange,
  label = "Ícono",
  icons = PRODUCT_ICONS,
}: IconPickerProps) {
  const selected = value || icons[0] || DEFAULT_PRODUCT_ICON;

  return (
    <div className="pr-field">
      <label className="pr-label">{label}</label>
      <div className="pr-icon-grid" role="listbox" aria-label={label}>
        {icons.map((emoji) => {
          const isActive = selected === emoji;
          return (
            <button
              key={emoji}
              type="button"
              role="option"
              aria-selected={isActive}
              className={`pr-icon-option${isActive ? " active" : ""}`}
              onClick={() => onChange(emoji)}
              title={emoji}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}
