/**
 * CRM > Chatbot > Consideraciones: el prompt del bot partido en párrafos
 * (tabla `chatbot_prompt_blocks`). system = lo publica el equipo; store = lo
 * agrega la tienda.
 */
export type PromptBlockOrigin = "system" | "store";
export type PromptBlockKind = "heading" | "separator" | "paragraph";

/** Fila tal como la devuelve `sp_crm_chatbot_prompt_blocks_list`. */
export interface PromptBlockApi {
  id: number;
  origin: PromptBlockOrigin;
  kind: PromptBlockKind;
  heading_key: string;
  heading_level: number | null;
  title: string;
  content: string;
  original_content: string | null;
  locked: boolean;
  tags: string[] | null;
  active: boolean;
  updated_at: string;
  updated_by_name: string | null;
}

export interface PromptBlock {
  id: number;
  origin: PromptBlockOrigin;
  kind: PromptBlockKind;
  headingKey: string;
  headingLevel: number | null;
  title: string;
  content: string;
  originalContent: string | null;
  locked: boolean;
  tags: string[];
  active: boolean;
  updatedAt: string;
  updatedByName: string | null;
}

export interface PromptBlockHistoryItem {
  content: string | null;
  previous: string | null;
  at: string;
  by_name: string | null;
  source: string | null;
}

export interface PromptBlocksListResponse {
  success: boolean;
  error?: string;
  data: PromptBlockApi[];
}

export interface PromptBlockMutationResponse {
  success: boolean;
  error?: string;
  id?: number;
  changed?: boolean;
  updated_at?: string;
}

export interface PromptBlockHistoryResponse {
  success: boolean;
  error?: string;
  data: PromptBlockHistoryItem[];
}

export interface PromptBlockCreateInput {
  headingKey: string;
  title: string;
  content: string;
  tags: string[];
}
