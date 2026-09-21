import { supabase } from "@/integrations/supabase/client";
import { getParameters } from "@/modules/settings/services/Parameters.service";

/** La empresa tal como sale impresa en la cabecera de un documento. */
export interface CompanyDocumentHeader {
  name: string;
  documentNumber?: string;
  address?: string;
  phone?: string;
}

/**
 * Los datos de la empresa que van en la cabecera de todo documento imprimible
 * —orden de compra, de servicio y de producción—.
 *
 * Vive en `shared/` porque esos documentos salen de dos dominios distintos,
 * cotizaciones y producción, y la cabecera es la misma en los tres: duplicar la
 * consulta llevaría a que un papel imprima la dirección y otro no.
 *
 * La dirección no está en `parameters`: sale de la primera sucursal activa, que
 * es la sede de la empresa. Si no hay ninguna, el documento se imprime sin ella
 * en vez de fallar — un papel sin dirección sigue sirviendo.
 */
export const getCompanyDocumentHeader =
  async (): Promise<CompanyDocumentHeader> => {
    const [params, branch] = await Promise.all([
      getParameters([
        "CompanyName",
        "CompanyDocumentNumber",
        "CompanyPhoneNumber",
      ]),
      (supabase as any)
        .from("branches")
        .select("address")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),
    ]);

    return {
      name: params.CompanyName || "",
      documentNumber: params.CompanyDocumentNumber || undefined,
      address: branch?.data?.address || undefined,
      phone: params.CompanyPhoneNumber || undefined,
    };
  };
