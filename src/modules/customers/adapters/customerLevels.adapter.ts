import type { CustomerLevel, CustomerLevelRow } from "../types/customerLevels.types";

// Fila de DB -> tipo de UI.
export const customerLevelAdapter = (row: CustomerLevelRow): CustomerLevel => ({
  id: row.id,
  sortOrder: row.sort_order,
  name: row.name,
  minPoints: row.min_points,
  maxPoints: row.max_points,
  color: row.color,
  imageUrl: row.image_url,
  subtitle: row.subtitle,
  active: row.active,
});

// El rango se muestra inclusivo (0 – 149), aunque en la BD el tope se guarda
// exclusivo ([min, max)): de ahi el max_points - 1. Sin tope => infinito.
export const formatCustomerLevelRange = (level: CustomerLevel): string => {
  const to = level.maxPoints === null ? "∞" : String(level.maxPoints - 1);
  return `${level.minPoints} – ${to}`;
};
