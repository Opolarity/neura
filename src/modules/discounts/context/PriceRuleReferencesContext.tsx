import { createContext, useContext } from "react";
import {
  EMPTY_REFERENCES,
  type PriceRuleReferences,
} from "../types/priceRule.types";

/**
 * Nombres de productos/variaciones/categorías referenciados por id en la regla
 * que se está editando (vienen de get-price-rule-details). Se expone por
 * contexto para que los campos del formulario pinten los chips con nombre en el
 * primer render, sin pasar la prop por todo el árbol del builder.
 */
const PriceRuleReferencesContext =
  createContext<PriceRuleReferences>(EMPTY_REFERENCES);

export const PriceRuleReferencesProvider = PriceRuleReferencesContext.Provider;

export const usePriceRuleReferences = () =>
  useContext(PriceRuleReferencesContext);
