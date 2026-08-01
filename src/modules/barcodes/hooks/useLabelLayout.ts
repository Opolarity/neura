import { useCallback, useState } from "react";
import { BarcodeLabelLayout } from "../types/Barcodes.types";
import {
  DEFAULT_LABEL_LAYOUT,
  LABEL_LAYOUT_STORAGE_KEY,
  normalizeLabelLayout,
} from "../constants/labelLayouts";

const readStoredLayout = (): BarcodeLabelLayout => {
  try {
    const raw = localStorage.getItem(LABEL_LAYOUT_STORAGE_KEY);
    return raw ? normalizeLabelLayout(JSON.parse(raw)) : DEFAULT_LABEL_LAYOUT;
  } catch {
    return DEFAULT_LABEL_LAYOUT;
  }
};

/**
 * Formato del papel de etiquetas. Se recuerda por equipo (localStorage) porque
 * depende de la ticketera física que tenga cada tienda.
 */
export const useLabelLayout = () => {
  const [labelLayout, setStoredLayout] = useState<BarcodeLabelLayout>(readStoredLayout);

  const setLabelLayout = useCallback((next: BarcodeLabelLayout) => {
    const normalized = normalizeLabelLayout(next);
    setStoredLayout(normalized);
    try {
      localStorage.setItem(LABEL_LAYOUT_STORAGE_KEY, JSON.stringify(normalized));
    } catch (error) {
      console.error("No se pudo guardar el formato de etiqueta:", error);
    }
  }, []);

  return { labelLayout, setLabelLayout };
};
