import {
  CutFabric,
  CutFabricInput,
  CutFabricOption,
  CutFabricUsage,
  CutWasteEntry,
} from "../types/cutFabric.types";

type Raw = Record<string, unknown>;

const num = (value: unknown): number => Number(value ?? 0);
const numOrNull = (value: unknown): number | null =>
  value === undefined || value === null || value === "" ? null : Number(value);
const textOrNull = (value: unknown): string | null =>
  value === undefined || value === null || value === "" ? null : String(value);
const list = (value: unknown): Raw[] => (Array.isArray(value) ? (value as Raw[]) : []);
const usageOrNull = (value: unknown): CutFabricUsage | null =>
  value === "MAIN" || value === "SECONDARY" || value === "LINING" || value === "COMPLEMENT" || value === "FUSIBLE"
    ? value
    : null;

/** Una merma de sp_get_cut_order_fabric → modelo de UI. */
export const toCutWasteEntry = (w: Raw): CutWasteEntry => ({
  id: num(w.id),
  materialVariationId: num(w.material_variation_id),
  label: String(w.label ?? ""),
  warehouseId: numOrNull(w.warehouse_id),
  warehouseName: textOrNull(w.warehouse_name),
  quantity: num(w.quantity),
  unit: w.unit === "KG" ? "KG" : "MTR",
});

/** Respuesta de sp_get_cut_order_fabric → modelo de UI. */
export const toCutFabric = (raw: unknown): CutFabric => {
  const data = (raw ?? {}) as Raw;
  return {
    // Sin la clave (backend anterior) vale lo de siempre: se registra.
    fabricByCut: data.fabric_by_cut !== false,
    materials: list(data.materials).map((m) => ({
      materialVariationId: num(m.material_variation_id),
      label: String(m.label ?? ""),
      unit: textOrNull(m.unit),
      unitName: textOrNull(m.unit_name),
      issued: num(m.issued),
      used: num(m.used),
    })),
    cutOrders: list(data.cut_orders).map((c) => ({
      cutOrderId: num(c.cut_order_id),
      code: String(c.code ?? ""),
      garments: numOrNull(c.garments),
      net: numOrNull(c.net),
      realConsumption: numOrNull(c.real_consumption),
      fabrics: list(c.fabrics).map((f) => ({
        materialVariationId: num(f.material_variation_id),
        label: String(f.label ?? ""),
        unit: textOrNull(f.unit),
        warehouseId: numOrNull(f.warehouse_id),
        warehouseName: textOrNull(f.warehouse_name),
        used: num(f.used),
        leftover: num(f.leftover),
        usage: usageOrNull(f.usage),
        consumption: numOrNull(f.consumption),
        available: numOrNull(f.available),
      })),
      waste: list(c.waste).map(toCutWasteEntry),
    })),
    warehouses: list(data.warehouses).map((w) => ({
      warehouseId: num(w.warehouse_id),
      name: String(w.name ?? ""),
    })),
  };
};

const toCutFabricOption = (o: Raw): CutFabricOption => ({
  materialVariationId: num(o.material_variation_id),
  code: String(o.code ?? ""),
  label: String(o.label ?? ""),
  unit: textOrNull(o.unit),
  totalStock: num(o.total_stock),
  stock: list(o.stock).map((s) => ({
    warehouseId: num(s.warehouse_id),
    warehouseName: String(s.warehouse_name ?? ""),
    stock: num(s.stock),
  })),
});

/** Respuesta de sp_search_cut_fabric_options → opciones del buscador de tela. */
export const toCutFabricOptions = (raw: unknown): CutFabricOption[] => list(raw).map(toCutFabricOption);

/** La tela del corte → `p_fabrics` de sp_register_cut_full (2026-10-30). */
export const toCutFabricRpcItems = (items: CutFabricInput[]) =>
  items.map((item) => ({
    material_variation_id: item.materialVariationId,
    warehouse_id: item.warehouseId,
    usage: item.usage,
    used: item.used,
    leftover: item.leftover,
  }));
