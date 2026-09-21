import { supabase } from "@/integrations/supabase/client";
// Viven aparte y no aquí: este archivo arrastra los tipos generados de
// Supabase, y con ellos dentro el compilador se rinde al inferir los joins
// («type instantiation is excessively deep»). Se re-exportan para no obligar
// a nadie a cambiar de dónde las importa.
import type {
  ServiceSituationItemPayload,
  UpdateServiceSituationParams,
} from "@/modules/suppliers/types/serviceSituation.types";

export type { ServiceSituationItemPayload, UpdateServiceSituationParams };
import { getCompanyDocumentHeader } from "@/shared/services/companyHeader";
import { buildEndpoint } from "@/shared/utils/query";
import { QuotationsFilters, QuotationsApiResponse, QuotationDetailApi, ServiceSituationHistoryItem, BulkStockEntryResponse, QuotationServicesFilters, QuotationServicesApiResponse, CreateSupplierQuotationData, CreateSupplierQuotationResult, AddQuotationServiceData, QuotationServiceApi, ServiceTab } from "../types/Quotations.types";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export interface SituationOption {
  id: number;
  name: string;
  status_id: number;
  code: string | null;
  /** Posición en el recorrido. Es lo que impide retroceder. */
  order: number | null;
}

/**
 * Las situaciones a las que se puede pasar desde la actual: las de orden
 * MAYOR O IGUAL. Retroceder no es una corrección, es un movimiento de stock y
 * de costo en sentido contrario — el trigger de situaciones reacciona al
 * delta, así que volver de «Recibido por empresa» a «En cotización» desharía
 * un ingreso real.
 *
 * La actual se incluye a propósito: corregir la merma o la cantidad sin
 * cambiar de situación es una operación legítima, y excluirla la haría
 * imposible.
 *
 * Falla en abierto. Si la situación actual no está en el catálogo, o su orden
 * es NULL, se devuelven todas: un dato incompleto no debe dejar a nadie sin
 * poder avanzar.
 */
export const forwardSituations = (
  situations: SituationOption[],
  currentSituationId: number | null
): SituationOption[] => {
  const current = situations.find((s) => s.id === currentSituationId);
  if (!current || current.order === null || current.order === undefined) {
    return situations;
  }
  return situations.filter(
    (s) => s.order !== null && s.order !== undefined && s.order >= current.order!
  );
};

export const fetchQuotationsList = async (
  filters: QuotationsFilters
): Promise<QuotationsApiResponse> => {
  const params: Record<string, string> = {
    page: String(filters.page),
    size: String(filters.size),
    order: filters.order,
  };

  if (filters.search) params.search = filters.search;

  const endpoint = buildEndpoint("get-quotations-list", params);

  const data = await invokeFunction(endpoint, {
    method: "GET",
  });

  return data;
};

export const fetchQuotationById = async (id: number): Promise<QuotationDetailApi> => {
  const endpoint = buildEndpoint("get-quotation-by-id", { id: String(id) });

  const data = await invokeFunction(endpoint, {
    method: "GET",
  });

  return data;
};

export const fetchQuotationByIdServices = async (
  filters: QuotationServicesFilters
): Promise<QuotationServicesApiResponse> => {
  const data = await invokeFunction("get-quotation-by-id-services", {
    method: "POST",
    body: {
      id: filters.id,
      search: filters.search,
      page: filters.page,
      size: filters.size,
      // Va al backend y no se filtra aquí: esta lectura pagina en servidor,
      // así que repartir en el cliente daría totales y páginas incoherentes.
      kind: filters.kind ?? null,
    },
  });

  return data;
};

/** Tamaño de página al recorrer las líneas para un documento. */
const DOCUMENT_PAGE_SIZE = 100;

/**
 * TODAS las líneas de una cotización de un tipo, sin buscador ni paginación.
 *
 * Es lo que necesitan los documentos imprimibles, y NO lo que hay en pantalla:
 * la lista del detalle pagina de 20 en 20 y se filtra con el buscador, así que
 * imprimir lo que se ve daría una Orden de Compra de 20 líneas para una
 * cotización de 25 -- sin que nada en el papel avise de que faltan cinco.
 *
 * Recorre las páginas hasta juntar el total que declara el backend, en vez de
 * pedir un `size` enorme de una vez: el tope de página lo decide el servidor y
 * un número inventado aquí se rompería en silencio el día que lo baje.
 */
export const allQuotationServicesApi = async (
  id: number,
  kind: ServiceTab
): Promise<QuotationServiceApi[]> => {
  const all: QuotationServiceApi[] = [];
  let page = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response = await fetchQuotationByIdServices({
      id,
      search: null,
      page,
      size: DOCUMENT_PAGE_SIZE,
      kind,
    });

    all.push(...response.data);

    // Se corta por lo que devolvió la página y no solo por el total: si el
    // backend acota el size, seguir contra el total giraría para siempre.
    if (response.data.length === 0 || all.length >= response.page.total) break;
    page += 1;
  }

  return all;
};

export const createSupplierQuotationApi = async (
  data: CreateSupplierQuotationData
): Promise<CreateSupplierQuotationResult> => {
  const response = await invokeFunction("create-supplier-quotation", {
    method: "POST",
    body: data,
  });

  return response.data;
};

/**
 * Cambia las notas de una cotización ya creada. Es lo único de la cabecera
 * que se edita después del alta; el asunto y el proveedor se fijan al crearla.
 */
/**
 * Cambia lo editable de la cabecera: notas, moneda y condición de pago.
 *
 * `currency` y `paymentTerms` omitidos = no se tocan, que es lo que quiere
 * quien solo corrige las notas. La condición se vacía mandando cadena vacía,
 * que el backend sí distingue de no haberla mandado.
 */
export const updateSupplierQuotationNotesApi = async (
  id: number,
  notes: string | null,
  currency?: string | null,
  paymentTerms?: string | null
): Promise<void> => {
  await invokeFunction("update-supplier-quotation-notes", {
    method: "POST",
    body: {
      id,
      request_description: notes,
      currency: currency ?? null,
      payment_terms: paymentTerms ?? null,
    },
  });
};

export const addSupplierQuotationServiceApi = async (
  data: AddQuotationServiceData
): Promise<void> => {
  await invokeFunction("add-supplier-quotation-service", {
    method: "POST",
    body: data,
  });
};

export const fetchSituationsByModuleId = async (moduleId: number): Promise<SituationOption[]> => {
  const { data, error } = await supabase
    .from("situations")
    .select("id, name, status_id, code, order")
    .eq("module_id", moduleId)
    .order("order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as SituationOption[];
};


export const updateServiceSituation = async (params: UpdateServiceSituationParams): Promise<void> => {
  await invokeFunction("update-service-situation", {
    body: params,
  });
};

export interface CreateServiceStockEntryParams {
  variationId: number;
  quantity: number;
  stockTypeId: number;
  supplierServiceId: number;
  quotationCode: string;
  productionOrderId: number | null;
  price: number;
  warehouseId: number;
}

export const fetchServiceSituationHistory = async (
  supplierServiceId: number
): Promise<ServiceSituationHistoryItem[]> => {
  const { data, error } = await supabase
    .from("supplier_service_situations")
    .select(`
      id,
      created_at,
      quantity,
      bad_quantity,
      price,
      message,
      measurement_unit,
      situations ( name ),
      statuses ( name ),
      profiles!supplier_service_situations_created_by_fkey (
        account_id,
        accounts ( name, last_name )
      )
    `)
    .eq("supplier_service_id", supplierServiceId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const profile = row.profiles;
    const acc = profile?.accounts;
    const createdByName = acc
      ? [acc.name, acc.last_name].filter(Boolean).join(" ")
      : "—";
    return {
      id: row.id,
      situation_name: row.situations?.name ?? "—",
      status_name: row.statuses?.name ?? "—",
      quantity: row.quantity,
      bad_quantity: row.bad_quantity,
      price: row.price,
      message: row.message,
      measurement_unit: row.measurement_unit,
      created_at: row.created_at,
      created_by_name: createdByName,
    };
  });
};


export interface PaymentItem {
  id: number;
  services_count: number;
  total_price: number | null;
  date: string;
  supplier_name: string;
  document: string;
  code: string | null;
  description: string | null;
  /** El comprobante del desembolso, si se adjuntó al pagar. */
  voucher_url: string | null;
}

const fetchSupplierInfo = async (supplierId: number) => {
  const { data } = await supabase
    .from("accounts")
    .select("name, middle_name, last_name, last_name2, document_number, document_types(name)")
    .eq("id", supplierId)
    .maybeSingle();
  const supplierName = data
    ? [data.name, data.middle_name, data.last_name, data.last_name2].filter(Boolean).join(" ")
    : "—";
  const document = data
    ? `${(data.document_types as { name: string } | null)?.name ?? ""} ${data.document_number}`.trim()
    : "—";
  return { supplierName, document };
};

export const fetchQuotationPayments = async (
  quotationId: number,
  supplierId: number,
  servicesCount: number
): Promise<PaymentItem[]> => {
  const { data, error } = await supabase
    .from("supplier_quotations_payments")
    .select("id, date, voucher_url, movements(amount, description, code)")
    .eq("supplier_quotation_id", quotationId);
  if (error) throw error;
  const { supplierName, document } = await fetchSupplierInfo(supplierId);
  return (data ?? []).map((p: any) => ({
    id: p.id,
    services_count: servicesCount,
    total_price: p.movements?.amount ?? null,
    date: p.date,
    supplier_name: supplierName,
    document,
    code: p.movements?.code ?? null,
    description: p.movements?.description ?? null,
    voucher_url: p.voucher_url ?? null,
  }));
};

export const fetchServicePayments = async (
  serviceId: number,
  supplierId: number,
  servicesCount: number
): Promise<PaymentItem[]> => {
  const { data, error } = await supabase
    .from("supplier_quotations_payments")
    .select("id, date, voucher_url, movements(amount, description, code)")
    .eq("supplier_service_id", serviceId);
  if (error) throw error;
  const { supplierName, document } = await fetchSupplierInfo(supplierId);
  return (data ?? []).map((p: any) => ({
    id: p.id,
    services_count: servicesCount,
    total_price: p.movements?.amount ?? null,
    date: p.date,
    supplier_name: supplierName,
    document,
    code: p.movements?.code ?? null,
    description: p.movements?.description ?? null,
    voucher_url: p.voucher_url ?? null,
  }));
};

export const createServiceStockEntry = async (params: CreateServiceStockEntryParams): Promise<void> => {
  await invokeFunction("create-service-stock-entry", {
    body: {
      variation_id: params.variationId,
      quantity: params.quantity,
      stock_type_id: params.stockTypeId,
      supplier_service_id: params.supplierServiceId,
      quotation_code: params.quotationCode,
      production_order_id: params.productionOrderId,
      price: params.price,
      warehouse_id: params.warehouseId,
    },
  });
};

export interface BulkServiceItem {
  supplier_service_id: number;
  code: string | null;
  production_order_id: number | null;
}

export const bulkServiceStockEntry = async (
  params: {
    services: BulkServiceItem[];
    stockTypeId: number;
    warehouseId: number;
    quotationCode?: string;
  },
  dryRun: boolean
): Promise<BulkStockEntryResponse> => {
  const data = await invokeFunction("bulk-create-service-stock-entry", {
    body: {
      services: params.services,
      stock_type_id: params.stockTypeId,
      warehouse_id: params.warehouseId,
      quotation_code: params.quotationCode,
      dry_run: dryRun,
    },
  });
  return data;
};

/**
 * Los datos de cabecera que la Orden de Compra necesita y el detalle de la
 * cotización no trae: los de la empresa y el contacto del proveedor.
 *
 * La dirección de la empresa sale de la sucursal —`branches.address`—, que es
 * el único sitio del esquema donde hay una. La del proveedor **no existe**: no
 * hay tabla de direcciones y ni `accounts` ni `suppliers_profile` guardan una.
 */
export const purchaseOrderHeaderApi = async (
  supplierId: number
): Promise<{
  company: { name: string; documentNumber?: string; address?: string; phone?: string };
  supplierDocument: string | null;
  supplierPhone: string | null;
}> => {
  // La cabecera de la empresa es la misma en los tres documentos y vive en
  // shared: aqui solo se le suman los datos del proveedor, que si son de este.
  const [company, profile, account] = await Promise.all([
    getCompanyDocumentHeader(),
    (supabase as any)
      .from("suppliers_profile")
      .select("phone")
      .eq("id", supplierId)
      .maybeSingle(),
    (supabase as any)
      .from("accounts")
      .select("document_number")
      .eq("id", supplierId)
      .maybeSingle(),
  ]);

  return {
    company,
    supplierDocument: account?.data?.document_number ?? null,
    supplierPhone: profile?.data?.phone ? String(profile.data.phone) : null,
  };
};
