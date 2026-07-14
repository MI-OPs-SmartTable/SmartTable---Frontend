import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Joyride, STATUS, type EventData } from "react-joyride";
import { TOUR_STEPS, type TourId } from "./tourSteps";

const STORAGE_KEY = "smarttable_tour_progress";

type TourProgress = Partial<Record<TourId, boolean>>;

function loadProgress(): TourProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TourProgress) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: TourProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* localStorage no disponible: el tour simplemente podría repetirse */
  }
}

type TourContextValue = {
  startTour: (id: TourId) => void;
  hasSeenTour: (id: TourId) => boolean;
  resetTour: (id: TourId) => void;
};

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<TourProgress>(() => loadProgress());
  const [activeTour, setActiveTour] = useState<TourId | null>(null);

  const markSeen = useCallback((id: TourId) => {
    setProgress((prev) => {
      const next = { ...prev, [id]: true };
      saveProgress(next);
      return next;
    });
  }, []);

  const startTour = useCallback((id: TourId) => {
    setActiveTour(id);
  }, []);

  const hasSeenTour = useCallback((id: TourId) => Boolean(progress[id]), [progress]);

  const resetTour = useCallback((id: TourId) => {
    setProgress((prev) => {
      const next = { ...prev };
      delete next[id];
      saveProgress(next);
      return next;
    });
  }, []);

  const handleEvent = useCallback(
    (data: EventData) => {
      const finished = data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED;
      if (finished && activeTour) {
        markSeen(activeTour);
        setActiveTour(null);
      }
    },
    [activeTour, markSeen]
  );

  const contextValue = useMemo(
    () => ({ startTour, hasSeenTour, resetTour }),
    [startTour, hasSeenTour, resetTour]
  );

  return (
    <TourContext.Provider value={contextValue}>
      {children}
      <Joyride
        run={activeTour !== null}
        steps={activeTour ? TOUR_STEPS[activeTour] : []}
        continuous
        onEvent={handleEvent}
        options={{
          buttons: ["back", "close", "skip", "primary"],
          primaryColor: "#e8601c",
          showProgress: true,
          zIndex: 10000,
        }}
        locale={{
          back: "Anterior",
          close: "Cerrar",
          last: "Finalizar",
          next: "Siguiente",
          nextWithProgress: "Siguiente ({current} de {total})",
          skip: "Saltar",
        }}
      />
    </TourContext.Provider>
  );
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTour debe usarse dentro de un TourProvider");
  }
  return ctx;
}
