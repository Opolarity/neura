import { Lock, SlidersHorizontal } from "lucide-react";
import type { ChatbotPromptSetting } from "../../types/chatbotBehavior.types";
import type { ChatbotTemplate } from "../../types/chatbotTemplates.types";
import type { PromptBlock } from "../../types/chatbotConsiderations.types";
import type { FunnelStage } from "../../types/chatbotAssistant.types";
import { FUNNEL_STAGES } from "../../utils/chatbotFunnel";
import { AssistantSettingField } from "./AssistantSettingField";
import { StageTemplatesSection } from "./StageTemplatesSection";
import { StoreNotesSection } from "./StoreNotesSection";

interface Props {
  stage: FunnelStage;
  settings: ChatbotPromptSetting[];
  templates: ChatbotTemplate[];
  notes: PromptBlock[];
  savingCode: string | null;
  savingContent: boolean;
  canManage: boolean;
  onSaveSetting: (setting: ChatbotPromptSetting, value: string) => Promise<boolean>;
  onEditTemplate: (template: ChatbotTemplate) => void;
  onAddNote: (texto: string) => Promise<boolean>;
  onSaveNote: (note: PromptBlock, texto: string) => Promise<boolean>;
  onDeleteNote: (note: PromptBlock) => Promise<boolean>;
}

/** Primero lo que se elige, después lo que se escribe y al final las sedes. */
const fieldOrder = (s: ChatbotPromptSetting): number =>
  s.type === "flow_option" ? 0 : s.type === "store_list" ? 2 : 1;

/**
 * Una etapa de la venta, de lo fijo a lo propio de la tienda: lo que el bot
 * siempre hace (Neura), cómo lo hace la tienda (opciones y textos), sus
 * indicaciones y los mensajes que manda en esta etapa.
 */
export const StagePanel = ({
  stage,
  settings,
  templates,
  notes,
  savingCode,
  savingContent,
  canManage,
  onSaveSetting,
  onEditTemplate,
  onAddNote,
  onSaveNote,
  onDeleteNote,
}: Props) => {
  const info = FUNNEL_STAGES.find((s) => s.stage === stage);
  const fields = [...settings].sort((a, b) => fieldOrder(a) - fieldOrder(b));

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">{info?.label}</h2>

      {info && info.rules.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Lo que el bot siempre hace
          </p>
          <ul className="flex flex-col gap-1">
            {info.rules.map((r) => (
              <li key={r} className="rounded-md bg-muted px-3 py-2 text-sm">
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {fields.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Cómo lo hace tu tienda
          </p>
          {fields.map((s) => (
            <AssistantSettingField
              key={s.code}
              setting={s}
              saving={savingCode === s.code}
              disabled={!canManage}
              onSave={(value) => onSaveSetting(s, value)}
            />
          ))}
        </div>
      )}

      <StoreNotesSection
        notes={notes}
        disabled={!canManage}
        saving={savingContent}
        onAdd={onAddNote}
        onSave={onSaveNote}
        onDelete={onDeleteNote}
      />

      <StageTemplatesSection templates={templates} canManage={canManage} onEdit={onEditTemplate} />
    </div>
  );
};
