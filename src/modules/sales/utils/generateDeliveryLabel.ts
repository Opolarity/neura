import { supabase } from "@/integrations/supabase/client";
import { getParameters } from "@/modules/settings/services/Parameters.service";
import type { PrintData } from "@/modules/print-templates/editor/lib/print-data";
import { printDocument } from "@/modules/print-templates/print/printDocument";
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

/** Nombre y apellidos del destinatario, en mayúsculas (como las dos plantillas). */
const recipientName = (data: DeliveryLabelData) =>
  [data.customerName, data.customerLastname, data.customerLastname2]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

/** Dirección, urbanización, distrito y provincia, juntos (el «DESTINO»). */
const destination = (data: DeliveryLabelData) =>
  [data.address, data.neighborhoodName, data.cityName, data.stateName]
    .filter(Boolean)
    .join(" ");

/**
 * Los datos de la etiqueta para su plantilla (fuente delivery_label de
 * print-templates), con el mismo formato que los PDF de antes. La empresa
 * (nombre, RUC, celular, logo) sale sola de la sesión. `fiscalAddress` es la
 * dirección del remitente cuando el local que vende no tiene una.
 */
export const deliveryLabelPrintData = (
  data: DeliveryLabelData,
  fiscalAddress = "",
): PrintData => {
  const name = recipientName(data);
  return {
    delivery_label: {
      values: {
        // La pequeña ponía «—» con el nombre vacío (o «- -»).
        recipientName: name && name !== "- -" ? name : null,
        recipientDocument: data.documentNumber || null,
        destination: destination(data) || null,
        // Sin el «+51»: lo pone el diseño.
        recipientPhone: data.receptionPhone || data.phone || null,
        addressReference: data.addressReference || null,
        receptionPerson: data.receptionPerson || null,
        senderAddress: data.senderAddress || fiscalAddress || null,
      },
    },
  };
};

/**
 * Imprime la etiqueta de envío con su plantilla (la personalizada en uso o la del
 * sistema). La medida (100 × 140 o la del rollo de 70 × 50) la da la Hoja de
 * la plantilla; antes se elegía por el RUC de la empresa.
 */
export const generateDeliveryLabel = async (data: DeliveryLabelData) => {
  // Sin la dirección del local, la del domicilio fiscal (como antes).
  const fiscalAddress = data.senderAddress
    ? ""
    : (await getParameters(["CompanyAddress"]))["CompanyAddress"];
  const name = recipientName(data);
  return printDocument(
    "delivery_label",
    deliveryLabelPrintData(data, fiscalAddress),
    { fileName: `Etiqueta de envío${name ? ` ${name}` : ""}` },
  );
};

/** Abre la etiqueta en una pestaña nueva (el PDF de antes de las plantillas). */
export const openDeliveryLabelPdf = async (data: DeliveryLabelData) => {
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
