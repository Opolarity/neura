import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { Bot, Clock, Hand, RotateCcw, UserPlus } from "lucide-react";
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
    <header className="flex flex-col gap-3 border-b border-border bg-card px-5 py-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold leading-tight">
            {conversation.displayName}
          </h2>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {conversation.phoneNumber ? `+${conversation.phoneNumber}` : conversation.identity}
            {conversation.documentNumber ? ` · ${conversation.documentNumber}` : ""}
            {conversation.assignedToName ? ` · Responsable: ${conversation.assignedToName}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {/* El estado del bot es la consecuencia de tomar o asignar, y conviene
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
            {conversation.windowOpen ? `Vence ${windowLabel}` : "Ventana de 24 h vencida"}
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
            <SelectTrigger className="h-9 w-[200px]">
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

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* Autoasignarse: para cualquiera que atienda. Se oculta si ya es
              suya, que es cuando el botón no haría nada. */}
          <ComponentPermission codeIn={["crm_conversations.assign"]}>
            {!assignedToMe && (
              <Button variant="outline" size="sm" onClick={() => onAssign(user?.id ?? null)} disabled={busy}>
                <UserPlus className="mr-1.5 h-4 w-4" />
                Asignármela
              </Button>
            )}
          </ComponentPermission>

          {/* Repartir el trabajo del equipo: permiso aparte, hoy solo admins. */}
          <ComponentPermission codeIn={["crm_conversations.assign_any"]}>
            <AssignMenu
              assignedTo={conversation.assignedTo}
              disabled={busy}
              onAssign={onAssign}
            />
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
