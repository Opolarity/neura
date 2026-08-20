import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { Bot, Clock, Hand, RotateCcw, UserMinus, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import type { Conversation, Situation } from "../types/crm.types";
import { stageBadgeVariant } from "./stageBadge";

interface Props {
  conversation: Conversation;
  situations: Situation[];
  busy: boolean;
  onSituationChange: (situationId: number) => void;
  onAssignToMe: () => void;
  onUnassign: () => void;
  onTake: () => void;
  onRelease: () => void;
}

export const ConversationHeader = ({
  conversation,
  situations,
  busy,
  onSituationChange,
  onAssignToMe,
  onUnassign,
  onTake,
  onRelease,
}: Props) => {
  const { user } = useAuth();

  const takenByMe = !!conversation.takenBy && conversation.takenBy === user?.id;
  const takenBySomeoneElse = !!conversation.takenBy && !takenByMe;

  const windowLabel = conversation.windowExpiresAt
    ? formatDistanceToNowStrict(new Date(conversation.windowExpiresAt), {
        locale: es,
        addSuffix: true,
      })
    : null;

  return (
    <header className="flex flex-col gap-3 border-b border-border px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{conversation.displayName}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {conversation.phoneNumber ? `+${conversation.phoneNumber}` : conversation.identity}
            {conversation.documentNumber ? ` · ${conversation.documentNumber}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Estado del bot: es la consecuencia de tomar o asignar, y conviene
              que se vea sin tener que deducirla. */}
          <Badge variant={conversation.botAnswers ? "outline" : "secondary"} className="gap-1">
            <Bot className="h-3 w-3" />
            {conversation.botAnswers ? "El bot responde" : "Bot en silencio"}
          </Badge>

          <Badge
            variant={conversation.windowOpen ? "outline" : "destructive-soft"}
            className="gap-1"
          >
            <Clock className="h-3 w-3" />
            {conversation.windowOpen
              ? `Ventana abierta · vence ${windowLabel}`
              : "Ventana de 24 h vencida"}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ComponentPermission codeIn={["crm_conversations.stage"]}>
          <Select
            value={conversation.situation ? String(conversation.situation.id) : undefined}
            onValueChange={(value) => onSituationChange(Number(value))}
            disabled={busy}
          >
            <SelectTrigger className="h-9 w-[210px]">
              <SelectValue placeholder="Sin etapa" />
            </SelectTrigger>
            <SelectContent>
              {situations.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ComponentPermission>

        {conversation.situation && (
          <Badge variant={stageBadgeVariant(conversation.situation.statusCode)}>
            {conversation.situation.name}
          </Badge>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <ComponentPermission codeIn={["crm_conversations.assign"]}>
            {conversation.assignedTo ? (
              <Button variant="outline" size="sm" onClick={onUnassign} disabled={busy}>
                <UserMinus className="mr-1.5 h-4 w-4" />
                Quitar asignación
                <span className="ml-1 text-muted-foreground">
                  ({conversation.assignedToName || "asignada"})
                </span>
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={onAssignToMe} disabled={busy}>
                <UserPlus className="mr-1.5 h-4 w-4" />
                Asignármela
              </Button>
            )}
          </ComponentPermission>

          <ComponentPermission codeIn={["crm_conversations.take"]}>
            {takenByMe ? (
              <Button variant="secondary" size="sm" onClick={onRelease} disabled={busy}>
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Devolver al bot
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onTake}
                // Tomar un chat que otro asesor ya tiene lo rechaza el backend;
                // se desactiva acá para no ofrecer una acción que va a fallar.
                disabled={busy || takenBySomeoneElse}
                title={
                  takenBySomeoneElse
                    ? `${conversation.takenByName || "Otro asesor"} tiene el control`
                    : undefined
                }
              >
                <Hand className="mr-1.5 h-4 w-4" />
                Tomar el control
              </Button>
            )}
          </ComponentPermission>
        </div>
      </div>

      {takenBySomeoneElse && (
        <p className="text-xs text-muted-foreground">
          {conversation.takenByName || "Otro asesor"} tiene el control de esta conversación.
        </p>
      )}
    </header>
  );
};
