import type { ChatbotPromptSetting } from "../types/chatbotBehavior.types";
import type { ChatbotTemplate } from "../types/chatbotTemplates.types";
import type { AssistantTemplateKind, FunnelStage } from "../types/chatbotAssistant.types";
import { settingStage, templateStage } from "../utils/chatbotFunnel";

/** Tiene un borrador sin publicar (el SP deja null el borrador igual a lo publicado). */
export const isDirtySetting = (s: ChatbotPromptSetting): boolean => s.draft !== null && s.draft !== s.published;

export const settingsByStage = (settings: ChatbotPromptSetting[], stage: FunnelStage): ChatbotPromptSetting[] =>
  settings.filter((s) => settingStage(s.code) === stage);

export const templateKind = (t: ChatbotTemplate): AssistantTemplateKind =>
  t.locked ? "automatica" : t.saleSola ? "responde_sola" : "base";

export const templatesByStage = (templates: ChatbotTemplate[], stage: FunnelStage): ChatbotTemplate[] =>
  templates.filter((t) => templateStage(t.name, t.topic) === stage);
