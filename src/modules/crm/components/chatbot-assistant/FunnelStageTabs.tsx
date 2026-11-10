import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isDirtySetting } from "../../adapters/chatbotAssistant.adapter";
import type { ChatbotPromptSetting } from "../../types/chatbotBehavior.types";
import type { FunnelStage } from "../../types/chatbotAssistant.types";
import { FUNNEL_STAGES, settingStage } from "../../utils/chatbotFunnel";

interface Props {
  current: FunnelStage;
  settings: ChatbotPromptSetting[];
  onSelect: (stage: FunnelStage) => void;
}

/**
 * Las etapas de la venta como tabs arriba del contenido (no otro sidebar al
 * lado del menú del ERP). Marca las que tienen cambios sin publicar. En
 * pantallas angostas la fila se desliza en horizontal.
 */
export const FunnelStageTabs = ({ current, settings, onSelect }: Props) => (
  <Tabs value={current} onValueChange={(v) => onSelect(v as FunnelStage)}>
    <TabsList aria-label="Etapas de la venta" className="h-auto w-full justify-start overflow-x-auto">
      {FUNNEL_STAGES.map((s) => {
        const dirty = settings.some((x) => settingStage(x.code) === s.stage && isDirtySetting(x));
        return (
          <TabsTrigger key={s.stage} value={s.stage} className="shrink-0 gap-1.5">
            {s.label}
            {dirty && <span className="h-2 w-2 rounded-full bg-warning" aria-label="Cambios sin publicar" />}
          </TabsTrigger>
        );
      })}
    </TabsList>
  </Tabs>
);
