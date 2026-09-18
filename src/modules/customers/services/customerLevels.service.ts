import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { customerLevelAdapter } from "../adapters/customerLevels.adapter";
import type {
  CustomerLevel,
  CustomerLevelPayload,
  CustomerLevelRow,
} from "../types/customerLevels.types";

// customer_levels (tabla) y sp_customer_levels_upsert (RPC) son nuevos y aun no
// estan en los tipos generados de Supabase. Se usa el cliente sin el generico
// Database para no pelear con el tipado; mismo espiritu que el escape que ya
// hace customerPoints.service para customer_points_movements.
const db = supabase as unknown as SupabaseClient;

// Lectura directa de la tabla (config no sensible; la RLS permite SELECT a
// authenticated).
export const getCustomerLevels = async (): Promise<CustomerLevel[]> => {
  const { data, error } = await db
    .from("customer_levels")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as CustomerLevelRow[]).map(customerLevelAdapter);
};

// Alta/edicion via RPC SECURITY DEFINER. El RPC valida (decimales, rango,
// solape) y, cuando la accion no es valida, devuelve { success:false, error }
// con el motivo en espanol. Lo convertimos en throw para que toastError lo
// muestre tal cual al usuario.
export const saveCustomerLevel = async (payload: CustomerLevelPayload): Promise<void> => {
  const { data, error } = await db.rpc("sp_customer_levels_upsert", {
    p_id: payload.id ?? null,
    p_name: payload.name,
    p_min_points: payload.minPoints,
    p_max_points: payload.maxPoints,
    p_discount: payload.discountPct / 100,
    p_color: payload.color,
    p_image_url: payload.imageUrl,
    p_subtitle: payload.subtitle,
    p_active: payload.active,
    p_sort_order: payload.sortOrder ?? null,
  });

  if (error) throw error;

  const result = data as { success: boolean; error?: string } | null;
  if (result && result.success === false) {
    throw new Error(result.error ?? "No se pudo guardar el nivel.");
  }
};

// "Eliminar" = desactivar (active=false). No hay borrado fisico: el catalogo
// esta ligado al historico de clientes y un nivel inactivo se puede reactivar.
// Se reusa el RPC de upsert reenviando los datos actuales con active=false.
export const deactivateCustomerLevel = async (level: CustomerLevel): Promise<void> => {
  await saveCustomerLevel({
    id: level.id,
    name: level.name,
    minPoints: level.minPoints,
    maxPoints: level.maxPoints,
    discountPct: level.discountPct,
    color: level.color,
    imageUrl: level.imageUrl,
    subtitle: level.subtitle,
    sortOrder: level.sortOrder,
    active: false,
  });
};
