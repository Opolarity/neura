import { supabase } from "@/integrations/supabase/client";
import { getParameters } from "@/modules/settings/services/Parameters.service";
import { CompanyInfo, DeliveryLabelData } from "./deliveryLabelTemplates/shared";
import { generateTemplate20607798002 } from "./deliveryLabelTemplates/template20607798002";
import { generateTemplate20611215895 } from "./deliveryLabelTemplates/template20611215895";

export type { DeliveryLabelData } from "./deliveryLabelTemplates/shared";

const DEFAULT_COMPANY = {
  name: "OVERTAKE UNLIMITED EIRL",
  ruc: "20611215895",
  phone: "977862202",
  address: "URB. EL PORVENIR CAL. SEBASTIAN BARRANCA - LA VICTORIA - LIMA.",
};

export const generateDeliveryLabel = async (data: DeliveryLabelData) => {
  const params = await getParameters([
    "CompanyName",
    "CompanyDocumentNumber",
    "CompanyPhoneNumber",
    "CompanyAddress",
    "CompanyShortName",
  ]);
  const { data: logoParam } = await supabase
    .from("parameters")
    .select("value")
    .eq("name", "InvoiceLogoUrl")
    .maybeSingle();

  const company: CompanyInfo = {
    name: params["CompanyName"] || DEFAULT_COMPANY.name,
    ruc: params["CompanyDocumentNumber"] || DEFAULT_COMPANY.ruc,
    phone: params["CompanyPhoneNumber"] || DEFAULT_COMPANY.phone,
    address: params["CompanyAddress"] || DEFAULT_COMPANY.address,
    logoUrl: logoParam?.value,
    shortName: params["CompanyShortName"],
  };

  if (company.ruc === "20611215895") {
    return generateTemplate20611215895(data, company);
  }

  return generateTemplate20607798002(data, company);
};
