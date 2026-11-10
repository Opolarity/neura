import type { ChatbotPromptSetting } from "../types/chatbotBehavior.types";
import type { FunnelStage } from "../types/chatbotAssistant.types";
import { settingStage } from "../utils/chatbotFunnel";

/** Tiene un borrador sin publicar (el SP deja null el borrador igual a lo publicado). */
export const isDirtySetting = (s: ChatbotPromptSetting): boolean => s.draft !== null && s.draft !== s.published;

export const settingsByStage = (settings: ChatbotPromptSetting[], stage: FunnelStage): ChatbotPromptSetting[] =>
  settings.filter((s) => settingStage(s.code) === stage);
