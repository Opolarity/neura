import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { Bot, Clock, Hand, Lock, RotateCcw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ComponentPermission } from "@/shared/components/component-permission";
import { useAuth } from "@/modules/auth";
import { cn } from "@/shared/utils/utils";
import type { Conversation, Situation } from "../types/crm.types";
import { AssignMenu } from "./AssignMenu";

interface Props {
  conversation: Conversation;
  situations: Situation[];
  busy: boolean;
  onSituationChange: (situationId: number) => void;
  onAssign: (userId: string | null) => void;
  onTake: () => void;
  onRelease: () => void;
}

/** Etiqueta de estado, más chica que Badge: acá el protagonista es el chat. */
const Pill = ({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "warn";
}) => (
  <span
    className={cn(
      "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium leading-none",
      tone === "neutral" && "bg-muted text-muted-foreground",
      tone === "warn" && "bg-destructive-soft text-destructive-soft-foreground"
    )}
  >
    {children}
  </span>
);

export const ConversationHeader = ({
  conversation,
  situations,
  busy,
  onSituationChange,
  onAssign,
  onTake,
  onRelease,
}: Props) => {
  const { user } = useAuth();

  const takenByMe = !!conversation.takenBy && conversation.takenBy === user?.id;
  const takenBySomeoneElse = !!conversation.takenBy && !takenByMe;
  const assignedToMe = conversation.assignedTo === user?.id;

  const windowLabel = conversation.windowExpiresAt
    ? formatDistanceToNowStrict(new Date(conversation.windowExpiresAt), {
        locale: es,
        addSuffix: true,
      })
    : null;

  return (
    <header className="flex flex-col gap-2 border-b px-4 py-2">
      <div className="flex min-w-0 items-center gap-2">
        {/* Dos renglones y no uno: en una sola línea el nombre y los datos
            competían por el mismo ancho contra las pastillas, y el documento
            terminaba cortado. Con leading-tight ocupa casi lo mismo. */}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[13px] font-semibold leading-tight">
            {conversation.displayName}
          </h2>
          <p className="truncate text-[10.5px] leading-tight text-muted-foreground">
            {[conversation.subtitle, conversation.assignedToName]
              .filter(Boolean)
              .join(" · ") || " "}
          </p>
        </div>

        <Pill>
          <Bot className="h-3 w-3" />
          {conversation.botAnswers ? "Bot activo" : "Bot en silencio"}
        </Pill>

        <Pill tone={conversation.windowOpen ? "neutral" : "warn"}>
          <Clock className="h-3 w-3" />
          {conversation.windowOpen ? `Vence ${windowLabel}` : "Ventana vencida"}
        </Pill>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <ComponentPermission codeIn={["crm_conversations.stage"]}>
          <Select
            value={conversation.situation ? String(conversation.situation.id) : undefined}
            onValueChange={(value) => onSituationChange(Number(value))}
            disabled={busy}
          >
            <SelectTrigger className="h-7 w-[170px] text-xs">
              <SelectValue placeholder="Sin etapa" />
            </SelectTrigger>
            <SelectContent>
              {situations.map((s) => (
                <SelectItem key={s.id} value={String(s.id)} className="text-xs">
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ComponentPermission>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <ComponentPermission codeIn={["crm_conversations.assign"]}>
            {!assignedToMe && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onAssign(user?.id ?? null)}
                disabled={busy}
              >
                <UserPlus className="mr-1 h-3.5 w-3.5" />
                Asignármela
              </Button>
            )}
          </ComponentPermission>

          <ComponentPermission codeIn={["crm_conversations.assign_any"]}>
            <AssignMenu
              assignedTo={conversation.assignedTo}
              disabled={busy}
              onAssign={onAssign}
            />
          </ComponentPermission>

          <ComponentPermission codeIn={["crm_conversations.take"]}>
            {takenByMe ? (
              <Button
                variant="secondary"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={onRelease}
                disabled={busy}
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Devolver al bot
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={onTake}
                disabled={busy}
                title={
                  takenBySomeoneElse
                    ? `Le vas a quitar el control a ${conversation.takenByName || "otro asesor"}`
                    : undefined
                }
              >
                <Hand className="mr-1 h-3.5 w-3.5" />
                {takenBySomeoneElse ? "Quitarle el control" : "Tomar el control"}
              </Button>
            )}
          </ComponentPermission>
        </div>
      </div>

      {takenBySomeoneElse && (
        <p className="flex items-center gap-1 text-[11px] text-destructive-soft-foreground">
          <Lock className="h-3 w-3" />
          <strong className="font-medium">
            {conversation.takenByName || "Otro asesor"}
          </strong>
          tomó el control de esta conversación. No podés escribir hasta que lo
          tomes vos.
        </p>
      )}
    </header>
  );
};
