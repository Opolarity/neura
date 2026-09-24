import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import {
  AccountSearchResult,
  CreateSupplierData,
  Supplier,
  SupplierClass,
  SuppliersFilters,
  UpdateSupplierData,
} from "../types/suppliers.types";
import { PaginationState } from "@/shared/components/pagination/Pagination";

interface SuppliersListResponse {
  data: Supplier[];
  pagination: PaginationState;
}

export const suppliersListApi = async (
  filters: SuppliersFilters
): Promise<SuppliersListResponse> => {
  const { page = 1, size = 20, search } = filters;

  const endpoint = buildEndpoint("get-suppliers", { page, size, search });
  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;

  const raw = data?.suppliersdata ?? { data: [], page: { page, size, total: 0 } };

  const suppliers: Supplier[] = (raw.data ?? []).map((row: any) => {
    const nameParts = [row.name, row.middle_name, row.last_name, row.last_name2].filter(Boolean);
    // Se conservan los ids: `sp_get_suppliers` ya los manda y son lo que el
    // modal de edicion necesita para preseleccionar las clases.
    const classes = (row.classes ?? [])
      .filter((c: any) => c?.id != null)
      .map((c: any) => ({ id: c.id, name: c.name ?? "" }));

    return {
      id: row.id,
      fullName: nameParts.join(" "),
      documentType: row.document_type_name ?? "",
      documentNumber: row.document_number ?? "",
      phone: row.phone,
      email: row.email ?? "",
      address: row.address ?? "",
      classes,
    };
  });

  return {
    data: suppliers,
    pagination: {
      p_page: raw.page?.page ?? page,
      p_size: raw.page?.size ?? size,
      total: raw.page?.total ?? 0,
    },
  };
};

export const findAccountByDocumentApi = async (
  documentTypeId: number,
  documentNumber: string
): Promise<AccountSearchResult | null> => {
  const { data, error } = await (supabase as any)
    .from("accounts")
    .select("id, name, middle_name, last_name, last_name2, document_type_id, document_number")
    .eq("document_type_id", documentTypeId)
    .eq("document_number", documentNumber)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
};

/**
 * Alta de proveedor: cuenta, perfil y clases en UNA transaccion.
 *
 * Antes eran tres inserts sueltos desde aqui, y era una trampa: el de la cuenta
 * pasaba, el del perfil fallaba siempre --suppliers_profile.supplier_type_id es
 * NOT NULL y no se mandaba-- y la cuenta se quedaba creada. Al reintentar, el
 * formulario volvia a crearla y chocaba contra unique_document_type_number_clients
 * con un "duplicate key" que no explicaba nada.
 *
 * El SP ademas REUTILIZA la cuenta cuando el documento ya esta registrado, que
 * es lo que recupera las cuentas que dejaron aquellos intentos a medias.
 */
export const createSupplierApi = async (
  supplier: CreateSupplierData
): Promise<{ id: number; reusedAccount: boolean }> => {
  // `as any` como el resto del fichero: los tipos generados de Supabase se
  // regeneran contra la base desplegada y todavía no conocen este SP.
  const { data, error } = await (supabase as any).rpc("sp_create_supplier", {
    p_document_type_id: supplier.document_type_id,
    p_document_number: supplier.document_number,
    p_name: supplier.name,
    p_phone: supplier.phone,
    p_last_name: supplier.last_name ?? null,
    p_middle_name: supplier.middle_name ?? null,
    p_last_name2: supplier.last_name2 ?? null,
    p_email: supplier.email ?? null,
    p_address: supplier.address ?? null,
    p_supplier_type_id: supplier.supplier_type_id ?? null,
    p_class_ids: supplier.class_ids,
  });

  if (error) throw error;

  const result = data as { id: number; reused_account?: boolean } | null;
  if (!result?.id) throw new Error("El alta no devolvio el proveedor creado");

  return { id: result.id, reusedAccount: result.reused_account ?? false };
};

/**
 * Datos de contacto de un proveedor ya creado.
 *
 * Directo por PostgREST, igual que el alta: la politica `authenticated_tenant_all`
 * de `suppliers_profile` cubre ALL, asi que no hace falta edge function.
 */
export const updateSupplierProfileApi = async (
  supplierId: number,
  data: Pick<UpdateSupplierData, "phone" | "email" | "address">
): Promise<void> => {
  const { error } = await (supabase as any)
    .from("suppliers_profile")
    .update({
      phone: data.phone,
      email: data.email || null,
      address: data.address || null,
    })
    .eq("id", supplierId);

  if (error) throw error;
};

/**
 * Reemplaza el juego completo de clases de un proveedor.
 *
 * Va por SP y no por DELETE + INSERT sueltos: por PostgREST serian dos llamadas
 * y un fallo entre medias dejaria al proveedor SIN NINGUNA clase, lo que rompe
 * la deduccion de clase de `sp_create_supplier_service`.
 */
export const setSupplierClassesApi = async (
  supplierId: number,
  classIds: number[]
): Promise<void> => {
  const { error } = await (supabase as any).rpc("sp_set_supplier_classes", {
    p_supplier_id: supplierId,
    p_class_ids: classIds,
  });

  if (error) throw error;
};

export const supplierClassesApi = async (): Promise<SupplierClass[]> => {
  const { data: moduleData, error: moduleError } = await (supabase as any)
    .from("modules")
    .select("id")
    .eq("code", "SPL")
    .single();

  if (moduleError) throw moduleError;

  const { data, error } = await (supabase as any)
    .from("classes")
    .select("id, name, code")
    .eq("module_id", moduleData.id)
    .order("name");

  if (error) throw error;
  return data ?? [];
};

export const createSupplierClassOptionApi = async (name: string): Promise<SupplierClass> => {
  const { data: moduleData, error: moduleError } = await (supabase as any)
    .from("modules")
    .select("id")
    .eq("code", "SPL")
    .single();

  if (moduleError) throw moduleError;

  const { data, error } = await (supabase as any)
    .from("classes")
    .insert({ name, module_id: moduleData.id, code: "SPL" })
    .select("id, name, code")
    .single();

  if (error) throw error;
  return data;
};

export const documentTypesApi = async () => {
  const { data, error } = await (supabase as any)
    .from("document_types")
    .select("id, name, code")
    .neq("id", "0")
    .order("name");


  if (error) throw error;
  return data ?? [];
};
