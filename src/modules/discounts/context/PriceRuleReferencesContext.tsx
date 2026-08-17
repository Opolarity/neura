import { createContext, useContext } from "react";
import {
  EMPTY_REFERENCES,
  type PriceRuleReferences,
} from "../types/priceRule.types";

/**
 * Nombres de los productos/variaciones/categorías que la regla en edición
 * referencia por id (vienen de get-price-rule-details). Va por contexto para
 * que los campos del formulario pinten los chips con el nombre real en el
 * primer render, sin pasar la prop por todo el árbol del builder.
 */
const PriceRuleReferencesContext =
  createContext<PriceRuleReferences>(EMPTY_REFERENCES);

export const PriceRuleReferencesProvider = PriceRuleReferencesContext.Provider;

export const usePriceRuleReferences = () =>
  useContext(PriceRuleReferencesContext);
