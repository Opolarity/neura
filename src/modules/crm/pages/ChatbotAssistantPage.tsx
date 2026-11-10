import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/modules/auth";
import { PageLoader } from "@/shared/components/page-loader";
import { settingsByStage } from "../adapters/chatbotAssistant.adapter";
import { AssistantHeader } from "../components/chatbot-assistant/AssistantHeader";
import { FunnelStageTabs } from "../components/chatbot-assistant/FunnelStageTabs";
import { StagePanel } from "../components/chatbot-assistant/StagePanel";
import { useAssistantContent } from "../hooks/useAssistantContent";
import { useChatbotAssistant } from "../hooks/useChatbotAssistant";
import type { FunnelStage } from "../types/chatbotAssistant.types";

/**
 * Asistente de ventas: toda la configuración del bot en una página, etapa por
 * etapa de la venta. Lo fijo lo define Neura; la tienda elige entre opciones,
 * escribe pocos textos y agrega sus indicaciones. Los mensajes que el bot
 * manda se editan en Plantillas. Los ajustes quedan en borrador hasta publicar;
 * las indicaciones quedan vivas al guardar. En personalizado la etapa de cada
 * ajuste la decide utils/chatbotFunnel.ts. Solo
 * admin, como Plantillas y Consideraciones (lo exigen también los SP).
 */
export default function ChatbotAssistantPage() {
  const { isAdmin } = useAuth();
  const [stage, setStage] = useState<FunnelStage>("general");
  const a = useChatbotAssistant(isAdmin);
  const c = useAssistantContent(isAdmin);

  if (!isAdmin) {
    return (
      <div className="flex flex-col gap-4">
        <AssistantHeader pendingChanges={0} publishing={false} canManage={false} onPublish={() => {}} onDiscard={() => {}} />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Solo un administrador puede configurar el asistente de ventas.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (a.loading || c.loading) return <PageLoader message="Cargando asistente de ventas..." />;

  return (
    <div className="flex flex-col gap-4">
      <AssistantHeader
        pendingChanges={a.pendingChanges}
        publishing={a.publishing}
        canManage={isAdmin}
        onPublish={() => void a.publish()}
        onDiscard={() => void a.discard()}
      />

      <FunnelStageTabs current={stage} settings={a.settings} onSelect={setStage} />

      <Card>
        <CardContent className="!p-4">
          <StagePanel
            stage={stage}
            settings={settingsByStage(a.settings, stage)}
            notes={c.notesOf(stage)}
            savingCode={a.savingCode}
            savingContent={c.saving}
            canManage={isAdmin}
            onSaveSetting={a.saveDraft}
            onAddNote={(texto) => c.addNote(stage, texto)}
            onSaveNote={c.saveNote}
            onDeleteNote={c.deleteNote}
          />
        </CardContent>
      </Card>
    </div>
  );
}
