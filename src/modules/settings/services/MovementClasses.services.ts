import { supabase } from "@/integrations/supabase/client";
import {
  MovementClassApiResponse,
  MovementClassFilters,
  MovementClassPayload,
} from "../types/MovementClasses.types";

const getMovModuleId = async (): Promise<number> => {
  const { data, error } = await (supabase as any)
    .from("modules")
    .select("id")
    .eq("code", "MOV")
    .single();

  if (error) throw error;
  return data.id;
};

export const getMovementClassesApi = async (
  filters: MovementClassFilters = {}
): Promise<MovementClassApiResponse> => {
  const { page = 1, size = 20 } = filters;
  const moduleId = await getMovModuleId();

  const from = (page - 1) * size;
  const to = from + size - 1;

  const { data, error, count } = await (supabase as any)
    .from("classes")
    .select("id, name, code", { count: "exact" })
    .eq("module_id", moduleId)
    .eq("is_active", true)
    .order("name")
    .range(from, to);

  if (error) throw error;

  return {
    data: data ?? [],
    page: { page, size, total: count ?? 0 },
  };
};

export const createMovementClassApi = async (
  payload: MovementClassPayload
): Promise<void> => {
  const moduleId = await getMovModuleId();

  const { error } = await (supabase as any)
    .from("classes")
    .insert({ name: payload.name, code: payload.code, module_id: moduleId });

  if (error) throw error;
};

export const updateMovementClassApi = async (
  payload: MovementClassPayload
): Promise<void> => {
  const { error } = await (supabase as any)
    .from("classes")
    .update({ name: payload.name, code: payload.code })
    .eq("id", payload.id);

  if (error) throw error;
};

export const deactivateMovementClassApi = async (id: number): Promise<void> => {
  const { error } = await (supabase as any)
    .from("classes")
    .update({ is_active: false })
    .eq("id", id);

  if (error) throw error;
};
