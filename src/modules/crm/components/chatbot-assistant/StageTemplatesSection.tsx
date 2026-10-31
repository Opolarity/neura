import { useState } from "react";
import { ChevronDown, MessageSquareText, SquarePen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/shared/utils/utils";
import { templateKind } from "../../adapters/chatbotAssistant.adapter";
import { toFriendlyText } from "../../adapters/chatbotTemplates.adapter";
import type { ChatbotTemplate } from "../../types/chatbotTemplates.types";

interface Props {
  templates: ChatbotTemplate[];
  canManage: boolean;
  onEdit: (template: ChatbotTemplate) => void;
}

/**
 * Los mensajes que el bot manda en esta etapa. Las respuestas que salen solas
 * y las de base se ven y se editan; las automáticas del pedido (bloqueadas) van
 * plegadas: las arma el sistema con los datos reales y casi nunca hace falta
 * tocarlas.
 */
export const StageTemplatesSection = ({ templates, canManage, onEdit }: Props) => {
  const [openAuto, setOpenAuto] = useState(false);
  const visibles = templates.filter((t) => templateKind(t) !== "automatica");
  const automaticas = templates.filter((t) => templateKind(t) === "automatica");

  return (
    <div className="flex flex-col gap-1.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <MessageSquareText className="h-3.5 w-3.5" />
        Lo que responde en esta etapa{visibles.length ? ` · ${visibles.length}` : ""}
      </p>

      {visibles.length === 0 && <p className="text-sm text-muted-foreground">En esta etapa el bot redacta con tus ajustes.</p>}

      {visibles.map((t) => (
        <TemplateRow key={t.id} template={t} canManage={canManage} onEdit={onEdit} />
      ))}

      {automaticas.length > 0 && (
        <Collapsible open={openAuto} onOpenChange={setOpenAuto}>
          <CollapsibleTrigger className="flex items-center gap-1 py-1 text-xs text-muted-foreground hover:text-foreground">
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", openAuto && "rotate-180")} />
            {automaticas.length === 1
              ? "1 mensaje automático del pedido"
              : `${automaticas.length} mensajes automáticos del pedido`}{" "}
            (no hace falta tocarlos)
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-1.5 pt-1">
            <p className="text-xs text-muted-foreground">
              Los arma el sistema con los datos reales del pedido: carrito, pago, comprobante, cupón.
            </p>
            {automaticas.map((t) => (
              <TemplateRow key={t.id} template={t} canManage={canManage} onEdit={onEdit} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

const TemplateRow = ({
  template: t,
  canManage,
  onEdit,
}: {
  template: ChatbotTemplate;
  canManage: boolean;
  onEdit: (template: ChatbotTemplate) => void;
}) => (
  <div className="flex items-start justify-between gap-2 rounded-md border border-border px-3 py-2">
    <div className="min-w-0">
      <p className="line-clamp-3 whitespace-pre-line text-sm">{toFriendlyText(t.content)}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{t.name.replace(/_/g, " ")}</span>
        {templateKind(t) === "responde_sola" && <Badge variant="secondary">Responde solo</Badge>}
      </div>
    </div>
    {canManage && (
      <Button size="sm" variant="outline" title="Editar mensaje" onClick={() => onEdit(t)}>
        <SquarePen className="h-4 w-4" />
      </Button>
    )}
  </div>
);
