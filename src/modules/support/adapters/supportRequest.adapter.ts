import type {
  SupportAttachmentApiFile,
  SupportAttachmentFile,
  SupportMessage,
  SupportMessageApi,
  SupportMessageOrigin,
  SupportRequestDetail,
  SupportRequestDetailApi,
  SupportTaskApiTracking,
  SupportTaskTracking,
} from "../types/Support.types";
import { originHostFromUrl, originLabelFromHost } from "../utils/originLabel";

/** null cuando no es un número: distinto de 0, que sí es un valor válido. */
const toNumberOrNull = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Mismo formato para los adjuntos de la solicitud y los de cada mensaje. */
const adaptAttachments = (
  files: SupportAttachmentApiFile[] | null | undefined,
): SupportAttachmentFile[] =>
  (files ?? [])
    // file_url es el enlace de descarga: sin él no hay nada que mostrar
    .filter((file) => typeof file?.file_url === "string" && file.file_url !== "")
    .map((file) => ({
      id: file.id,
      fileName: file.file_name?.trim() || "Archivo adjunto",
      mimeType: file.mime_type ?? null,
      sizeBytes: toNumberOrNull(file.size_bytes),
      fileUrl: file.file_url,
    }));

/**
 * `origin` es un conjunto abierto en la API. Un valor desconocido se pinta como
 * mensaje del equipo: es el default seguro (nunca se atribuye al propio usuario).
 */
const adaptOrigin = (origin: string | null | undefined): SupportMessageOrigin => {
  if (origin === "external" || origin === "system") return origin;
  return "internal";
};

const adaptMessages = (
  messages: SupportMessageApi[] | null | undefined,
): SupportMessage[] =>
  (messages ?? [])
    .map((message) => ({
      id: message.id,
      origin: adaptOrigin(message.origin),
      authorName: message.author_name?.trim() || null,
      event: message.event ?? null,
      content: message.content?.trim() || "",
      createdAt: message.created_at,
      attachments: adaptAttachments(message.attachments),
    }))
    // Un mensaje sin texto ni adjuntos no tiene nada que pintar
    .filter((message) => message.content !== "" || message.attachments.length > 0)
    // Ya vienen del más antiguo al más reciente, pero no se da por sentado
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

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
  const attachments: SupportAttachmentFile[] = adaptAttachments(item?.attachments);
  // Mismo criterio que el listado: el host lo normaliza la API y, si no viene,
  // se deriva de la URL.
  const originHost =
    item.origin_host?.trim().toLowerCase() || originHostFromUrl(item.origin_url);

  return {
    id: item.id,
    // Mismo criterio que el listado: el detalle hereda `code` de la misma
    // proyección de la API, así que el S-n del sheet y el de la tabla coinciden
    code: item.code ?? null,
    title: item.title?.trim() || "(Sin título)",
    status: item.status?.trim() || "Sin estado",
    statusSource: item.status_source ?? "solicitud",
    statusCategory: item.status_category ?? null,
    requestType: item.request_type === "ticket" ? "ticket" : "suggestion",
    taskCode: item.task_code ?? null,
    reporterName: item.reporter_name ?? null,
    originHost,
    originLabel: originLabelFromHost(originHost),
    // El conteo del listado puede no venir en el detalle: se cae a los adjuntos reales
    attachmentsCount: item.attachments_count ?? attachments.length,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    descriptionHtml: item.description?.trim() || null,
    attachments,
    reviewedAt: item.reviewed_at ?? null,
    task: adaptTask(item.task ?? null),
    messages: adaptMessages(item.messages),
    // Independiente de `status`: habla del hilo, no de la tarea
    conversationStatus: item.conversation_status ?? null,
    lastMessageAt: item.last_message_at ?? null,
  };
};
