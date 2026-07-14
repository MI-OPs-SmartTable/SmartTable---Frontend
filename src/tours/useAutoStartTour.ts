import { useEffect } from "react";
import { useTour } from "./TourProvider";
import type { TourId } from "./tourSteps";

const AUTO_START_DELAY_MS = 500;

/** Dispara el tour de la pantalla la primera vez que se visita (según localStorage). */
export function useAutoStartTour(id: TourId) {
  const { startTour, hasSeenTour } = useTour();

  useEffect(() => {
    if (hasSeenTour(id)) return;

    const timer = setTimeout(() => {
      startTour(id);
    }, AUTO_START_DELAY_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
}
