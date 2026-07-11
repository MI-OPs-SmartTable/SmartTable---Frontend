import { useEffect } from "react";

const OVERLAY_SELECTOR = [
  ".caja-modal-overlay",
  ".db-modal-overlay",
  ".pr-overlay",
  ".pr-confirm-overlay",
  ".cfg-overlay",
  ".cfg-confirm-overlay",
  ".pl-overlay",
  ".st-modal-overlay",
].join(", ");

function syncVisualViewportVars() {
  const vv = window.visualViewport;
  const height = vv?.height ?? window.innerHeight;
  const offsetTop = vv?.offsetTop ?? 0;
  document.documentElement.style.setProperty("--vv-height", `${Math.round(height)}px`);
  document.documentElement.style.setProperty("--vv-offset-top", `${Math.round(offsetTop)}px`);
}

function isEditable(el: EventTarget | null): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

/**
 * Mantiene los modales visibles cuando el teclado móvil reduce el visualViewport.
 * Montar una sola vez en App.
 */
export function useModalKeyboardSafe() {
  useEffect(() => {
    syncVisualViewportVars();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", syncVisualViewportVars);
    vv?.addEventListener("scroll", syncVisualViewportVars);
    window.addEventListener("resize", syncVisualViewportVars);
    window.addEventListener("orientationchange", syncVisualViewportVars);

    const onFocusIn = (event: FocusEvent) => {
      if (!isEditable(event.target)) return;
      const target = event.target;
      const overlay = target.closest(OVERLAY_SELECTOR);
      if (!overlay) return;

      // Esperar a que el teclado anime y re-sincronizar viewport.
      window.setTimeout(() => {
        syncVisualViewportVars();
        target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      }, 280);
    };

    document.addEventListener("focusin", onFocusIn);

    return () => {
      vv?.removeEventListener("resize", syncVisualViewportVars);
      vv?.removeEventListener("scroll", syncVisualViewportVars);
      window.removeEventListener("resize", syncVisualViewportVars);
      window.removeEventListener("orientationchange", syncVisualViewportVars);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, []);
}
