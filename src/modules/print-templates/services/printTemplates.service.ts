import { supabase } from "@/integrations/supabase/client";
import {
  toPrintTemplateDetail,
  toPrintTemplateItem,
} from "../adapters/printTemplates.adapter";
import {
  CreatePrintTemplateData,
  PrintTemplateDetail,
  PrintTemplateFilters,
  PrintTemplateItem,
  PrintTemplatesListResponse,
  UpdatePrintTemplateData,
} from "../types/printTemplates.types";

// Los sp_print_template* aún no están en los tipos generados de Supabase.
const db = supabase as unknown as {
  rpc: (
    fn: string,
    params?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

/**
 * Los SP devuelven `{ success: false, error }` en vez de lanzar (sin permiso,
 * datos inválidos). Acá se normalizan a excepción para que el hook tenga un
 * solo camino de error.
 */
function unwrap<T extends { success: boolean; error?: string }>(
  data: T | null,
  error: { message: string } | null,
  fallbackMessage: string,
): T {
  if (error) throw new Error(error.message);
  if (!data) throw new Error(fallbackMessage);
  if (!data.success) throw new Error(data.error || fallbackMessage);
  return data;
}

interface RpcResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

/** Personalizadas del tenant, de la última modificada a la más antigua. */
export const printTemplatesListApi = async ({
  search,
  system_code,
  is_active,
  limit = 20,
  offset = 0,
}: PrintTemplateFilters): Promise<{
  data: PrintTemplateItem[];
  total: number;
}> => {
  const { data, error } = await db.rpc("sp_print_templates_list", {
    p_search: search || null,
    p_system_code: system_code || null,
    p_is_active: is_active ?? null,
    p_limit: limit,
    p_offset: offset,
  });

  const res = unwrap(
    data as PrintTemplatesListResponse | null,
    error,
    "No se pudieron cargar las plantillas de impresión.",
  );

  return {
    data: (res.data ?? []).map(toPrintTemplateItem),
    total: res.total ?? 0,
  };
};

/** Una personalizada con su diseño, para el editor. */
export const printTemplateGetApi = async (
  id: number,
): Promise<PrintTemplateDetail> => {
  const { data, error } = await db.rpc("sp_print_template_get", { p_id: id });
  const res = unwrap(
    data as RpcResult | null,
    error,
    "No se pudo cargar la plantilla.",
  );
  return toPrintTemplateDetail(res.data);
};

/** Crea una personalizada a partir de una plantilla del sistema y devuelve su id. */
export const printTemplateCreateApi = async (
  values: CreatePrintTemplateData,
): Promise<number> => {
  const { data, error } = await db.rpc("sp_print_template_create", {
    p_title: values.title,
    p_system_code: values.systemCode,
    p_content_json: values.contentJson ?? null,
  });
  const res = unwrap(
    data as RpcResult | null,
    error,
    "No se pudo crear la plantilla.",
  );
  return (res.data as { id: number }).id;
};

/** Edita una personalizada; lo que no se manda queda como está. */
export const printTemplateUpdateApi = async (
  id: number,
  values: UpdatePrintTemplateData,
): Promise<void> => {
  const { data, error } = await db.rpc("sp_print_template_update", {
    p_id: id,
    p_title: values.title ?? null,
    p_content_json: values.contentJson ?? null,
    p_is_active: values.isActive ?? null,
  });
  unwrap(data as RpcResult | null, error, "No se pudo guardar la plantilla.");
};

/**
 * Todas las personalizadas activas del tenant (el listado las agrupa por
 * documento): de 100 en 100, lo más que da sp_print_templates_list.
 */
export const printTemplatesAllApi = async (): Promise<PrintTemplateItem[]> => {
  const all: PrintTemplateItem[] = [];
  for (;;) {
    const page = await printTemplatesListApi({
      is_active: true,
      limit: 100,
      offset: all.length,
    });
    all.push(...page.data);
    if (!page.data.length || all.length >= page.total) return all;
  }
};

/**
 * La plantilla con que se imprime un documento: una personalizada (su id) o,
 * con null, la del sistema.
 */
export const printTemplateSetDefaultApi = async (
  systemCode: string,
  id: number | null,
): Promise<void> => {
  const { data, error } = await db.rpc("sp_print_template_set_default", {
    p_system_code: systemCode,
    p_id: id,
  });
  unwrap(
    data as RpcResult | null,
    error,
    "No se pudo cambiar la plantilla en uso.",
  );
};

/** Un filtro de la consulta de la plantilla de por defecto. */
interface DefaultTemplateQuery {
  eq: (column: string, value: unknown) => DefaultTemplateQuery;
  maybeSingle: () => Promise<{
    data: { content_json: Record<string, unknown> | null } | null;
    error: { message: string } | null;
  }>;
}

// La tabla print_templates aún no está en los tipos generados de Supabase.
const tables = supabase as unknown as {
  from: (name: string) => { select: (columns: string) => DefaultTemplateQuery };
};

/**
 * El diseño de la plantilla de por defecto del tenant para un documento (su
 * code del sistema), o null si no tiene una: entonces se imprime el diseño
 * de la plantilla del sistema.
 */
export const printTemplateDefaultContentApi = async (
  systemCode: string,
): Promise<Record<string, unknown> | null> => {
  const { data, error } = await tables
    .from("print_templates")
    .select("content_json")
    .eq("system_code", systemCode)
    .eq("is_default", true)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error("No se pudo cargar la plantilla de impresión.");
  return data?.content_json ?? null;
};
