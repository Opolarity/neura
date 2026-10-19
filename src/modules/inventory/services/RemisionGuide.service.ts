// =============================================
// T-4: guía de remisión electrónica (GRE remitente) de una solicitud de
// inventario. Usa el mismo circuito que ventas: create-invoice (con `gre`)
// crea el comprobante y emit-guia lo envía al PSE. La guía se vincula a la
// solicitud con stock_movement_request_invoices.
// =============================================
import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { getParameters } from "@/modules/settings/services/Parameters.service";
import type { GuiaRemisionData } from "@/modules/sales/components/GuiaRemisionModal";

/** Código SUNAT de la guía de remisión remitente en `types` (módulo INV). */
const GRE_TYPE_CODE = "7";
/** state_code SUNAT del RUC en `document_types`. */
const RUC_STATE_CODE = "6";

export interface RequestGuide {
  id: number;
  taxSerie: string | null;
  invoiceNumber: string | null;
  declared: boolean;
  pdfUrl: string | null;
  createdAt: string;
}

export interface RequestGuideItem {
  description: string;
  quantity: number;
}

type UntypedTable = {
  select: (columns: string) => {
    eq: (column: string, value: number) => {
      order: (column: string, opts: { ascending: boolean }) => Promise<{ data: unknown; error: Error | null }>;
    };
  };
};

interface GuideInvoiceRow {
  id: number;
  tax_serie: string | null;
  invoice_number: string | null;
  declared: boolean | null;
  pdf_url: string | null;
  created_at: string;
}

export const getRequestGuides = async (requestId: number): Promise<RequestGuide[]> => {
  // La tabla es nueva (T-4) y todavía no está en los tipos generados.
  const { data, error } = await (supabase.from as unknown as (table: string) => UntypedTable)(
    "stock_movement_request_invoices",
  )
    .select("invoices(id, tax_serie, invoice_number, declared, pdf_url, created_at)")
    .eq("stock_movement_request_id", requestId)
    .order("id", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as Array<{ invoices: GuideInvoiceRow | null }>)
    .map((r) => r.invoices)
    .filter((i): i is GuideInvoiceRow => i !== null)
    .map((i) => ({
      id: i.id,
      taxSerie: i.tax_serie,
      invoiceNumber: i.invoice_number,
      declared: !!i.declared,
      pdfUrl: i.pdf_url,
      createdAt: i.created_at,
    }));
};

/**
 * Tipo, serie y destinatario de la guía de un traslado. El tipo y la serie se
 * resuelven por código (los ids cambian entre develop y main). En un traslado
 * entre almacenes propios el destinatario es la propia empresa.
 */
const resolveGuideContext = async () => {
  const { data: module } = await supabase.from("modules").select("id").eq("code", "INV").single();
  if (!module) throw new Error("No se encontró el módulo de comprobantes");

  const { data: greType } = await supabase
    .from("types")
    .select("id")
    .eq("module_id", module.id)
    .eq("code", GRE_TYPE_CODE)
    .maybeSingle();
  if (!greType) throw new Error("No existe el tipo de comprobante Guía de remisión remitente");

  const { data: serie } = await supabase
    .from("invoice_series")
    .select("serie")
    .eq("invoice_type_id", greType.id)
    .eq("is_active", true)
    .order("id")
    .limit(1)
    .maybeSingle();
  if (!serie?.serie) throw new Error("No hay una serie activa de guía de remisión");

  const { data: rucType } = await supabase
    .from("document_types")
    .select("id")
    .eq("state_code", RUC_STATE_CODE)
    .limit(1)
    .maybeSingle();

  const params = await getParameters(["CompanyDocumentNumber", "CompanyName"]);
  return { greTypeId: greType.id, serie: serie.serie, rucTypeId: rucType?.id ?? null, params };
};

export const createRequestGuide = async (
  requestId: number,
  items: RequestGuideItem[],
  gre: GuiaRemisionData,
): Promise<void> => {
  if (items.length === 0) throw new Error("La solicitud no tiene productos para la guía");
  const { greTypeId, serie, rucTypeId, params } = await resolveGuideContext();

  await invokeFunction("create-invoice", {
    body: {
      invoice_type_id: greTypeId,
      tax_serie: serie,
      invoice_number: null,
      declared: false,
      customer_document_type_id: rucTypeId,
      customer_document_number: params.CompanyDocumentNumber ?? "",
      client_name: params.CompanyName ?? null,
      client_email: null,
      client_address: gre.llegada_direccion,
      total_amount: 0,
      total_taxes: 0,
      items: items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        measurement_unit: "NIU",
        unit_price: 0,
        discount: 0,
        igv: 0,
        total: 0,
      })),
      gre,
      stock_movement_request_id: requestId,
    },
  });
};

/** Envía la guía al PSE (SUNAT). El rechazo llega como mensaje de la function. */
export const emitRequestGuide = async (invoiceId: number): Promise<void> => {
  await invokeFunction("emit-guia", { body: { invoice_id: invoiceId } });
};
