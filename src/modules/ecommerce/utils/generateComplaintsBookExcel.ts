import * as XLSX from "xlsx";
import { formatDateDisplay, formatDateTime, getTodayDate } from "@/shared/utils/date";
import {
  COMPLAINT_STATUS_LABEL,
  type ComplaintExportRow,
} from "../types/reclamaciones.types";

/**
 * Export del libro de reclamaciones.
 *
 * Indecopi puede pedir constancia de los reclamos recibidos, así que la hoja
 * lleva el libro completo — reclamante, apoderado, ubicación y el reclamo — y
 * no solo lo que se ve en la tabla de la pantalla.
 */

const HEADERS = [
  "N° Reclamo",
  "N° Orden",
  "Fecha de registro",
  "Estado",
  "Fecha de respuesta",
  "Tipo",
  "Nombres",
  "Apellido paterno",
  "Apellido materno",
  "Tipo de documento",
  "N° de documento",
  "Teléfono",
  "Correo",
  "Mayor de edad",
  "Dirección",
  "País",
  "Departamento",
  "Ciudad",
  "Distrito",
  "Apoderado",
  "Tipo doc. apoderado",
  "N° doc. apoderado",
  "Teléfono apoderado",
  "Correo apoderado",
  "Bien contratado",
  "Fecha del incidente",
  "Monto reclamado (S/)",
  "Descripción del reclamo",
  "Detalle",
  "Pedido del reclamante",
  "Aceptó términos",
];

const yesNo = (value: boolean | null) => (value === true ? "Sí" : value === false ? "No" : "-");

const claimTypeLabel = (claimType: string | null) =>
  (claimType ?? "").trim().toLowerCase() === "queja" ? "Queja" : "Reclamo";

const dateOrDash = (value: string | null) => (value ? formatDateDisplay(value) : "-");

const dateTimeOrDash = (value: string | null) => (value ? formatDateTime(value) : "-");

export function generateComplaintsBookExcel(rows: ComplaintExportRow[]): void {
  const body = rows.map((row) => [
    row.id,
    row.orden_id ?? "-",
    dateTimeOrDash(row.created_at),
    COMPLAINT_STATUS_LABEL[row.status] ?? row.status,
    dateTimeOrDash(row.answered_at),
    claimTypeLabel(row.claim_type),
    row.name ?? "",
    row.last_name ?? "",
    row.last_name2 ?? "",
    row.document_type_name ?? "",
    row.document_number ?? "",
    row.phone ?? "",
    row.email ?? "",
    yesNo(row.age),
    row.address ?? "",
    row.country_name ?? "",
    row.state_name ?? "",
    row.city_name ?? "",
    row.neighborhood_name ?? "",
    row.name_apoderado ?? "-",
    row.apoderado_document_type_name ?? "-",
    row.apoderado_document_number ?? "-",
    row.apoderado_phone ?? "-",
    row.apoderado_email ?? "-",
    row.good ?? "",
    dateOrDash(row.incident_date),
    Number(row.amount_claim) || 0,
    row.claim_description ?? "",
    row.detail ?? "",
    row.complaining_request ?? "",
    yesNo(row.terms),
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([HEADERS, ...body]);

  // Anchos pensados para que los textos largos del reclamo no queden en una
  // columna de 8 caracteres; el resto se queda en un ancho de lectura normal.
  sheet["!cols"] = HEADERS.map((header) => {
    if (["Descripción del reclamo", "Detalle", "Pedido del reclamante", "Dirección"].includes(header)) {
      return { wch: 45 };
    }
    if (["Correo", "Correo apoderado", "Bien contratado", "Apoderado"].includes(header)) {
      return { wch: 28 };
    }
    return { wch: 18 };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Reclamaciones");
  XLSX.writeFile(workbook, `libro-reclamaciones-${getTodayDate()}.xlsx`);
}
