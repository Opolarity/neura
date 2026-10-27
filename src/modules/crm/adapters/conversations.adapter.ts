import type { PaginationState } from "@/shared/components/pagination/Pagination";
import type {
  BoardApiResponse,
  BoardCard,
  BoardCardApi,
  BoardColumn,
  Conversation,
  ConversationApiRow,
  ConversationChannel,
  ConversationCounts,
  ConversationCustomer,
  ConversationCustomerApi,
  ConversationMessage,
  ConversationsApiResponse,
  MessageApiRow,
  NetworkCounts,
  Situation,
  SituationApi,
  ThreadApiResponse,
} from "../types/crm.types";

const situationAdapter = (s: SituationApi | null): Situation | null =>
  s
    ? { id: s.id, name: s.name, code: s.code, statusCode: s.status_code, order: s.order }
    : null;

const customerAdapter = (c: ConversationCustomerApi | null): ConversationCustomer | null =>
  c
    ? {
        firstName: c.name,
        lastName: c.last_name,
        documentTypeId: c.document_type_id,
        documentNumber: c.document_number,
        accountId: c.account_id,
        email: c.email,
        orderId: c.order_id,
      }
    : null;

/** "MANUEL joaquin" → "Manuel Joaquin". */
const titleCase = (value: string): string =>
  value
    .toLocaleLowerCase("es-PE")
    .replace(/(^|\s)(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase("es-PE"));

/**
 * Título de la conversación. El orden lo define qué tan identificable es el
 * dato para quien atiende:
 *
 *   1. El nombre, si el bot llegó a pedirle los datos para un pedido.
 *   2. El celular, si no dio sus datos pero su número es visible.
 *   3. El username de WhatsApp, para los clientes que ocultan su número.
 *   4. La identidad cruda (el BSUID), solo si no hay nada de lo anterior.
 *
 * El celular va ANTES que el username a propósito: un número sirve para buscar
 * al cliente en el ERP o llamarlo, un handle de WhatsApp no.
 */
const displayName = (row: ConversationApiRow): string => {
  const full = [row.customer?.name, row.customer?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  // Los nombres los escribe el cliente por WhatsApp, en cualquier combinación
  // de mayúsculas y minúsculas: se normalizan a mayúscula inicial para que la
  // lista no las mezcle y no "grite" en mayúsculas.
  if (full) return titleCase(full);
  if (row.phone_number) return `+${row.phone_number}`;
  // Messenger trae el nombre del perfil, no un handle: va sin @.
  if (row.whatsapp_username) {
    return row.network === "facebook" ? titleCase(row.whatsapp_username) : `@${row.whatsapp_username}`;
  }
  // La identidad de Messenger e Instagram es un id opaco (fb:<PSID>): no se muestra.
  if (row.network === "facebook") return "Cliente de Facebook";
  if (row.network === "instagram") return "Cliente de Instagram";
  return row.identity;
};

/**
 * Lo que va debajo del título: los identificadores que el título NO usó.
 * Repetir el celular abajo cuando el título YA es el celular no aporta nada.
 */
const subtitle = (row: ConversationApiRow): string => {
  const hasName = !!(row.customer?.name || row.customer?.last_name);
  const parts: string[] = [];

  if (hasName && row.phone_number) parts.push(`+${row.phone_number}`);
  if (row.customer?.document_number) parts.push(row.customer.document_number);
  if (!hasName && row.phone_number && row.whatsapp_username)
    parts.push(`@${row.whatsapp_username}`);
  // En Instagram el @ es lo que identifica al cliente: si el título ya es su
  // nombre, el @ va abajo.
  if (hasName && row.network === "instagram" && row.whatsapp_username)
    parts.push(`@${row.whatsapp_username}`);

  return parts.join(" · ");
};

const CHANNELS: ConversationChannel[] = ["whatsapp", "instagram", "facebook", "tiktok"];

/**
 * Red de la conversación: la deduce el backend del prefijo de la identidad
 * (fb:<PSID>, ig:<IGSID>; sin prefijo, WhatsApp).
 */
const channelOf = (row: ConversationApiRow): ConversationChannel =>
  CHANNELS.includes(row.network) ? row.network : "whatsapp";

const conversationAdapter = (row: ConversationApiRow): Conversation => ({
  identity: row.identity,
  channel: channelOf(row),
  phoneNumber: row.phone_number,
  whatsappUserId: row.whatsapp_user_id,
  displayName: displayName(row),
  subtitle: subtitle(row),
  // Un mensaje de imagen llega como texto con la URL adentro; se compacta para
  // que la lista no muestre saltos de línea.
  lastMessage: (row.last_message ?? "").replace(/\s+/g, " ").trim(),
  lastMessageAt: row.last_message_at,
  lastMessageFrom: row.last_message_from,
  lastMessageMediaType: row.last_message_media_type ?? null,
  lastMessageFileName: row.last_message_file_name ?? null,
  windowOpen: row.window_open,
  windowExpiresAt: row.window_expires_at,
  situation: situationAdapter(row.situation),
  assignedTo: row.assigned_to,
  assignedToName: row.assigned_to_name,
  takenBy: row.taken_by,
  takenByName: row.taken_by_name,
  documentNumber: row.customer?.document_number ?? null,
  customer: customerAdapter(row.customer),
  botAnswers: row.bot_answers,
});

const EMPTY_NETWORK_COUNTS: NetworkCounts = {
  all: 0,
  whatsapp: 0,
  instagram: 0,
  facebook: 0,
  tiktok: 0,
};

const EMPTY_COUNTS: ConversationCounts = {
  all: 0,
  mine: 0,
  unassigned: 0,
  taken: 0,
  window_closed: 0,
};

export const conversationsAdapter = (
  response: ConversationsApiResponse
): {
  data: Conversation[];
  pagination: PaginationState;
  counts: ConversationCounts;
  networkCounts: NetworkCounts;
  channelId: number | null;
} => ({
  networkCounts: { ...EMPTY_NETWORK_COUNTS, ...(response.network_counts ?? {}) },
  data: (response.data ?? []).map(conversationAdapter),
  pagination: {
    p_page: response.page?.page ?? 1,
    p_size: response.page?.size ?? 20,
    total: response.page?.total ?? 0,
  },
  counts: { ...EMPTY_COUNTS, ...(response.counts ?? {}) },
  channelId: response.channel_id ?? null,
});

const messageAdapter = (row: MessageApiRow): ConversationMessage => ({
  id: row.id,
  author: row.user,
  message: row.message ?? "",
  media: row.media
    ? {
        type: row.media.type,
        url: row.media.url,
        mimeType: row.media.mime_type,
        fileName: row.media.file_name,
        sizeBytes: row.media.size_bytes,
      }
    : null,
  createdAt: row.created_at,
  deliveryStatus: row.delivery?.status ?? null,
  deliveryErrorCode: row.delivery?.error_code ?? null,
});

export const threadAdapter = (response: ThreadApiResponse): ConversationMessage[] =>
  (response.messages ?? []).map(messageAdapter);

// ---------------------------------------------------------------------------
// Tablero
// ---------------------------------------------------------------------------

/**
 * La tarjeta reusa las MISMAS reglas de título y subtítulo que la bandeja.
 * Si se duplicaran, un chat podría llamarse distinto en cada pantalla — que es
 * exactamente lo que confunde a quien lo está buscando.
 */
const boardCardAdapter = (row: BoardCardApi): BoardCard => {
  const asRow = row as unknown as ConversationApiRow;

  return {
    identity: row.identity,
    phoneNumber: row.phone_number,
    whatsappUserId: row.whatsapp_user_id,
    displayName: displayName(asRow),
    subtitle: subtitle(asRow),
    lastMessage: (row.last_message ?? "").replace(/\s+/g, " ").trim(),
    lastMessageAt: row.last_message_at,
    assignedToName: row.assigned_to_name,
    taken: !!row.taken_by,
  };
};

export const boardAdapter = (response: BoardApiResponse): BoardColumn[] =>
  (response.columns ?? []).map((col) => ({
    situationId: col.situation_id,
    name: col.name,
    statusCode: col.status_code,
    total: col.total,
    cards: (col.cards ?? []).map(boardCardAdapter),
  }));
