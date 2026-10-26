import { useState } from "react";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/modules/auth";
import { PageLoader } from "@/shared/components/page-loader";
import { formatDateTime } from "@/shared/utils/date";
import ChatbotBehaviorHeader from "../components/chatbot-behavior/ChatbotBehaviorHeader";
import PromptSettingField from "../components/chatbot-behavior/PromptSettingField";
import PromptSettingHistoryDialog from "../components/chatbot-behavior/PromptSettingHistoryDialog";
import { useChatbotBehavior } from "../hooks/useChatbotBehavior";
import type { ChatbotPromptSetting, ChatbotPromptSettingType } from "../types/chatbotBehavior.types";

const SECTIONS: Array<{ type: ChatbotPromptSettingType; title: string; description: string }> = [
  {
    type: "vocabulary",
    title: "Vocabulario de la marca",
    description: "Las palabras que usa el bot cuando escribe con las suyas. Las plantillas no cambian.",
  },
  {
    type: "flow_option",
    title: "Opciones de la compra",
    description: "Decisiones del flujo de venta. Cada opción ya está probada con el bot.",
  },
  {
    type: "business_instructions",
    title: "Indicaciones del negocio",
    description:
      "Tono, qué destacar, qué no ofrecer, avisos de temporada. Si una indicación choca con una regla del sistema, gana la regla.",
  },
];

/**
 * Comportamiento del chatbot: los ajustes del prompt que edita el cliente
 * (chatbot_prompt_settings). El prompt sigue siendo del equipo; acá se cambian
 * solo los huecos y las opciones que el prompt deja abiertos. Solo admin (lo
 * exigen también los SP).
 */
export default function ChatbotBehaviorPage() {
  const { isAdmin } = useAuth();
  const { loading, saving, settings, values, setValue, unsaved, pendingDrafts, saveDraft, publish, discard } =
    useChatbotBehavior(isAdmin);
  const [history, setHistory] = useState<ChatbotPromptSetting | null>(null);

  if (!isAdmin) {
    return (
      <div className="h-full min-h-0 flex flex-col gap-4">
        <ChatbotBehaviorHeader />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Solo un administrador puede editar el comportamiento del chatbot.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) return <PageLoader message="Cargando el comportamiento del chatbot..." />;

  const lastPublished = settings
    .filter((s) => s.publishedAt)
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))[0];
  const pendingCount = new Set([...unsaved, ...pendingDrafts].map((s) => s.code)).size;

  return (
    <div className="h-full min-h-0 flex flex-col gap-4 overflow-y-auto pb-6">
      <ChatbotBehaviorHeader
        actions={{
          canSave: unsaved.length > 0,
          canPublish: pendingCount > 0,
          canDiscard: pendingCount > 0,
          saving,
          onSave: saveDraft,
          onPublish: publish,
          onDiscard: discard,
        }}
      />

      {pendingCount > 0 ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {pendingCount === 1 ? "Hay 1 cambio sin publicar." : `Hay ${pendingCount} cambios sin publicar.`} El bot sigue
            usando lo publicado hasta que publiques.
          </AlertDescription>
        </Alert>
      ) : (
        lastPublished && (
          <p className="text-xs text-muted-foreground">
            Última publicación: {formatDateTime(lastPublished.publishedAt!)}
            {lastPublished.publishedByName ? ` · ${lastPublished.publishedByName}` : ""}
          </p>
        )
      )}

      {SECTIONS.map((section) => {
        const rows = settings.filter((s) => s.type === section.type);
        if (!rows.length) return null;
        return (
          <Card key={section.type}>
            <CardHeader className="!p-4 !pb-2">
              <CardTitle className="text-base">{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="!p-4 !pt-2 grid gap-6 md:grid-cols-2">
              {rows.map((s) => (
                <div key={s.code} className={s.type === "business_instructions" ? "md:col-span-2" : undefined}>
                  <PromptSettingField
                    setting={s}
                    value={values[s.code] ?? ""}
                    disabled={saving}
                    onChange={(v) => setValue(s.code, v)}
                    onHistory={() => setHistory(s)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <PromptSettingHistoryDialog setting={history} onClose={() => setHistory(null)} onUse={setValue} />
    </div>
  );
}
