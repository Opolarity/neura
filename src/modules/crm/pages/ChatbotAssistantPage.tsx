import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/modules/auth";
import { PageLoader } from "@/shared/components/page-loader";
import { settingsByStage, templatesByStage } from "../adapters/chatbotAssistant.adapter";
import { AssistantHeader } from "../components/chatbot-assistant/AssistantHeader";
import { FunnelStageRail } from "../components/chatbot-assistant/FunnelStageRail";
import { StagePanel } from "../components/chatbot-assistant/StagePanel";
import ChatbotTemplateFormDialog from "../components/chatbot-templates/ChatbotTemplateFormDialog";
import { useAssistantContent } from "../hooks/useAssistantContent";
import { useChatbotAssistant } from "../hooks/useChatbotAssistant";
import type { FunnelStage } from "../types/chatbotAssistant.types";
import type { ChatbotTemplate } from "../types/chatbotTemplates.types";

/**
 * Asistente de ventas: toda la configuración del bot en una página, etapa por
 * etapa de la venta. Lo fijo lo define Neura; la tienda elige entre opciones,
 * escribe pocos textos, agrega sus indicaciones y revisa los mensajes que el
 * bot manda en cada etapa. Los ajustes quedan en borrador hasta publicar; las
 * indicaciones y los mensajes quedan vivos al guardar. En personalizado la
 * etapa de cada ajuste y plantilla la decide utils/chatbotFunnel.ts. Solo
 * admin, como Plantillas y Consideraciones (lo exigen también los SP).
 */
export default function ChatbotAssistantPage() {
  const { isAdmin } = useAuth();
  const [stage, setStage] = useState<FunnelStage>("general");
  const [editing, setEditing] = useState<ChatbotTemplate | null>(null);
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

      <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
        <FunnelStageRail current={stage} settings={a.settings} onSelect={setStage} />

        <Card>
          <CardContent className="!p-4">
            <StagePanel
              stage={stage}
              settings={settingsByStage(a.settings, stage)}
              templates={templatesByStage(c.templates, stage)}
              notes={c.notesOf(stage)}
              savingCode={a.savingCode}
              savingContent={c.saving}
              canManage={isAdmin}
              onSaveSetting={a.saveDraft}
              onEditTemplate={setEditing}
              onAddNote={(texto) => c.addNote(stage, texto)}
              onSaveNote={c.saveNote}
              onDeleteNote={c.deleteNote}
            />
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        ¿Buscas un mensaje en particular?{" "}
        <Link to="/crm/chatbot/templates" className="font-semibold underline-offset-4 hover:underline">
          Ver todos los mensajes
        </Link>
      </p>

      <ChatbotTemplateFormDialog
        template={editing}
        creating={false}
        saving={c.saving}
        tagOptions={c.tagOptions}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSave={c.saveTemplate}
        onCreate={async () => false}
      />
    </div>
  );
}
