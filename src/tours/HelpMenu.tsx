import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTour } from "./TourProvider";
import { TOUR_META, TOUR_PATHS, type TourId } from "./tourSteps";

/** Tiempo para dejar montar la pantalla destino antes de arrancar el tour. */
const NAVIGATE_THEN_START_DELAY_MS = 400;

const HelpIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

type HelpMenuProps = {
  /** Rol del usuario actual; filtra los tours que puede volver a ver. */
  role: string | null;
};

export function HelpMenu({ role }: HelpMenuProps) {
  const { startTour } = useTour();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const availableTours = role ? TOUR_META.filter((t) => t.roles.includes(role)) : [];

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (availableTours.length === 0) return null;

  const handleSelect = (id: TourId) => {
    setOpen(false);
    const path = TOUR_PATHS[id];
    if (location.pathname !== path) {
      navigate(path);
      setTimeout(() => startTour(id), NAVIGATE_THEN_START_DELAY_MS);
    } else {
      startTour(id);
    }
  };

  return (
    <div className="help-menu-root" ref={rootRef}>
      {open && (
        <div className="help-menu-panel">
          <div className="help-menu-title">Guías de la pantalla</div>
          {availableTours.map((t) => (
            <button
              key={t.id}
              type="button"
              className="help-menu-item"
              onClick={() => handleSelect(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="help-menu-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label="Ayuda y tours guiados"
        title="Ayuda y tours guiados"
      >
        {HelpIcon}
      </button>
    </div>
  );
}
