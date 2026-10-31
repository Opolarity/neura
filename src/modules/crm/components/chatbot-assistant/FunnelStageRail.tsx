import { cn } from "@/shared/utils/utils";
import { isDirtySetting } from "../../adapters/chatbotAssistant.adapter";
import type { ChatbotPromptSetting } from "../../types/chatbotBehavior.types";
import type { FunnelStage } from "../../types/chatbotAssistant.types";
import { FUNNEL_STAGES, settingStage } from "../../utils/chatbotFunnel";

interface Props {
  current: FunnelStage;
  settings: ChatbotPromptSetting[];
  onSelect: (stage: FunnelStage) => void;
}

/** Las etapas del embudo; marca las que tienen cambios sin publicar. */
export const FunnelStageRail = ({ current, settings, onSelect }: Props) => (
  <nav aria-label="Etapas de la venta" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
    {FUNNEL_STAGES.map((s, i) => {
      const active = s.stage === current;
      const dirty = settings.some((x) => settingStage(x.code) === s.stage && isDirtySetting(x));
      return (
        <button
          key={s.stage}
          type="button"
          onClick={() => onSelect(s.stage)}
          aria-current={active ? "step" : undefined}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
            "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            // La etapa elegida va en el morado de marca, como el item activo del sidebar.
            active ? "bg-primary font-semibold text-primary-foreground" : "hover:bg-muted"
          )}
        >
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs",
              active ? "border-primary-foreground/50" : "border-border"
            )}
          >
            {i + 1}
          </span>
          <span className="flex-1">{s.label}</span>
          {dirty && <span className="h-2 w-2 rounded-full bg-warning" aria-label="Cambios sin publicar" />}
        </button>
      );
    })}
  </nav>
);
