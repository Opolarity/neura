import type {
  SupportAttachmentFile,
  SupportRequestDetail,
  SupportRequestDetailApi,
  SupportTaskApiTracking,
  SupportTaskTracking,
} from "../types/Support.types";

/** null cuando no es un número: distinto de 0, que sí es un valor válido. */
const toNumberOrNull = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const adaptTask = (task: SupportTaskApiTracking | null): SupportTaskTracking | null => {
  if (!task) return null;

  return {
    code: toNumberOrNull(task.code),
    // Texto crudo: nunca se traduce ni se mapea a una lista fija
    status: task.status?.trim() || "Sin estado",
    statusCategory: task.status_category ?? null,
    // Las tareas internas llegan recortadas: todo lo de abajo puede faltar
    priority: task.priority ?? null,
    environments: Array.isArray(task.environments) ? task.environments : [],
    startDate: task.start_date ?? null,
    dueDate: task.due_date ?? null,
    subtasksTotal: toNumberOrNull(task.subtasks_total),
    subtasksDone: toNumberOrNull(task.subtasks_done),
    // Se conserva null (tarea sin subtareas): la UI no pinta una barra en cero
    progress: toNumberOrNull(task.progress),
  };
};

/**
 * Adapta la respuesta de get-support-request a la forma que consume el modal.
 * Defensivo igual que el adapter del listado: los estados de OPOLARITY son
 * configurables y el payload podría ganar campos, así que nada se valida contra
 * listas cerradas.
 */
export const adaptSupportRequestDetail = (
  item: SupportRequestDetailApi,
): SupportRequestDetail => {
  const attachments: SupportAttachmentFile[] = (item?.attachments ?? [])
    // file_url es el enlace de descarga: sin él no hay nada que mostrar
    .filter((file) => typeof file?.file_url === "string" && file.file_url !== "")
    .map((file) => ({
      id: file.id,
      fileName: file.file_name?.trim() || "Archivo adjunto",
      mimeType: file.mime_type ?? null,
      sizeBytes: toNumberOrNull(file.size_bytes),
      fileUrl: file.file_url,
    }));

  return {
    id: item.id,
    title: item.title?.trim() || "(Sin título)",
    status: item.status?.trim() || "Sin estado",
    statusSource: item.status_source ?? "solicitud",
    statusCategory: item.status_category ?? null,
    requestType: item.request_type === "ticket" ? "ticket" : "suggestion",
    taskCode: item.task_code ?? null,
    reporterName: item.reporter_name ?? null,
    // El conteo del listado puede no venir en el detalle: se cae a los adjuntos reales
    attachmentsCount: item.attachments_count ?? attachments.length,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    descriptionHtml: item.description?.trim() || null,
    attachments,
    reviewedAt: item.reviewed_at ?? null,
    task: adaptTask(item.task ?? null),
  };
};
