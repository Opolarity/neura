// Lo único de `components/providers/modal-provider.tsx` del ecommerce que usa el
// editor: dónde se ancla cada presentación del popup (la vista previa del
// lienzo, en editor-layout). Mantener igual que en la tienda.
import type { PopupPresentation, PopupSide } from "@/modules/ecommerce/editor/lib/editor-store";

// El modal se centra con inset-0 + margin auto y no con translate(-50%): las
// animaciones también usan transform y pisarían el centrado.
const SLIDE_IN_CORNERS: Record<string, string> = {
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
};

export function positionClass(presentation: PopupPresentation, side: PopupSide | undefined) {
  switch (presentation) {
    case "bottomSheet":
      return "inset-x-0 bottom-0";
    case "sheet":
      return side === "left" ? "inset-y-0 left-0" : "inset-y-0 right-0";
    case "bar":
      return side === "bottom" ? "inset-x-0 bottom-0" : "inset-x-0 top-0";
    case "slideIn":
      return SLIDE_IN_CORNERS[side ?? "bottom-right"];
    case "fullscreen":
      return "inset-0";
    default:
      return "inset-0 m-auto";
  }
}
