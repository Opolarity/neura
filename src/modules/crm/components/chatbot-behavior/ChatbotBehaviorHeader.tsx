import { Loader2, Save, Send, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatbotBehaviorHeaderProps {
  /** Sin acciones (usuario sin permiso) solo se muestra el título. */
  actions?: {
    canSave: boolean;
    canPublish: boolean;
    canDiscard: boolean;
    saving: boolean;
    onSave: () => void;
    onPublish: () => void;
    onDiscard: () => void;
  };
}

export default function ChatbotBehaviorHeader({ actions }: ChatbotBehaviorHeaderProps) {
  return (
    <div className="flex flex-wrap justify-between items-start gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Comportamiento del chatbot</h1>
        <p className="text-sm text-muted-foreground">
          Cómo habla el bot y qué decide en la compra. Los cambios se guardan como borrador y el bot los usa recién al publicar.
        </p>
      </div>
      {actions && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={actions.onDiscard} disabled={!actions.canDiscard || actions.saving}>
            <Undo2 className="w-4 h-4 mr-2" />
            Descartar cambios
          </Button>
          <Button variant="outline" onClick={actions.onSave} disabled={!actions.canSave || actions.saving}>
            <Save className="w-4 h-4 mr-2" />
            Guardar borrador
          </Button>
          <Button onClick={actions.onPublish} disabled={!actions.canPublish || actions.saving}>
            {actions.saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Publicar
          </Button>
        </div>
      )}
    </div>
  );
}
