import type { ReactElement } from "react";
import type { PdfContainerProps } from "../components/pdf-container";
import { invoiceTicketDesign } from "./invoice-ticket";
import { invoiceA4Design } from "./invoice-a4";
import {
  INVOICE_KIND_IDS,
  invoiceTemplateCode,
} from "../../constants/invoiceKinds";
import { deliveryLabelDesign } from "./delivery-label";
import { deliveryLabelSmallDesign } from "./delivery-label-small";
import { barcodeLabelDesign } from "./barcode-label";
import { bundleTicketDesign } from "./bundle-ticket";
import { operatorBadgeDesign } from "./operator-badge";
import {
  bundleSheetDesign,
  workLogBatchDesign,
  customerServiceOrderDesign,
  materialRequirementDesign,
  productionOrderDesign,
  purchaseOrderDesign,
  recipeDesign,
  styleOperationsDesign,
  serviceOrderDesign,
} from "./sheet-document";
import {
  intakeGuideDesign,
  materialGuideDesign,
  productionGuideDesign,
  remisionGuideDesign,
  transferGuideDesign,
} from "./remision-guide";

/**
 * Los diseños de hoy de las plantillas del sistema, armados con los
 * componentes del editor, por code. Cada uno recibe las props de su Hoja
 * (lib/page-props). Tener uno aquí va junto con `hasDesign` en
 * constants/systemPrintTemplates.
 */
export const SYSTEM_DESIGNS: Partial<
  Record<string, (page: Partial<PdfContainerProps>) => ReactElement>
> = {
  // Los comprobantes: uno por tipo, en ticket y en A4.
  ...Object.fromEntries(
    INVOICE_KIND_IDS.flatMap((kind) => [
      [
        invoiceTemplateCode(kind, "ticket"),
        (page: Partial<PdfContainerProps>) => invoiceTicketDesign(page, kind),
      ],
      [
        invoiceTemplateCode(kind, "a4"),
        (page: Partial<PdfContainerProps>) => invoiceA4Design(page, kind),
      ],
    ]),
  ),
  // Con medidas elegibles: el de su medida (la pequeña, la del rollo).
  delivery_label: (page) =>
    Number(page.paperHeightMm ?? 140) < 100
      ? deliveryLabelSmallDesign(page)
      : deliveryLabelDesign(page),
  barcode_label: barcodeLabelDesign,
  bundle_tickets: bundleTicketDesign,
  operator_badge: operatorBadgeDesign,
  sale_remision_guide: remisionGuideDesign,
  transfer_remision_guide: transferGuideDesign,
  production_remision_guide: productionGuideDesign,
  production_intake_guide: intakeGuideDesign,
  material_remision_guide: materialGuideDesign,
  purchase_order: purchaseOrderDesign,
  service_order: serviceOrderDesign,
  customer_service_order: customerServiceOrderDesign,
  production_order: productionOrderDesign,
  material_requirement: materialRequirementDesign,
  recipe: recipeDesign,
  style_operations: styleOperationsDesign,
  bundle_sheet: bundleSheetDesign,
  work_log_batch: workLogBatchDesign,
};
