import type { CustomerLevel, CustomerLevelRow } from "../types/customerLevels.types";

// Fila de DB -> tipo de UI. El descuento pasa de fraccion (0.05) a % (5).
export const customerLevelAdapter = (row: CustomerLevelRow): CustomerLevel => ({
  id: row.id,
  sortOrder: row.sort_order,
  name: row.name,
  minPoints: row.min_points,
  maxPoints: row.max_points,
  discountPct: Number(((row.discount ?? 0) * 100).toFixed(2)),
  color: row.color,
  imageUrl: row.image_url,
  subtitle: row.subtitle,
  active: row.active,
});
