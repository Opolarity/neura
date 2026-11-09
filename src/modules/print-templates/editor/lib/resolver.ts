import { PdfContainer } from "../components/pdf-container";
import { PdfText } from "../components/pdf-text";
import { PdfDataTable } from "../components/pdf-data-table";
import { PdfImage } from "../components/pdf-image";
import { PdfQr } from "../components/pdf-qr";
import { PdfBarcode } from "../components/pdf-barcode";

/**
 * Los componentes que puede tener una plantilla. Las claves se guardan en
 * content_json (`resolvedName`): renombrar una rompe las plantillas guardadas.
 */
export const printTemplateResolver = {
  PdfContainer,
  PdfText,
  // Su clave la busca lib/data-table (DATA_TABLE_NAME).
  PdfDataTable,
  PdfImage,
  PdfQr,
  PdfBarcode,
};
