import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Hand, RotateCcw, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComponentPermission } from "@/shared/components/component-permission";
import { useAuth } from "@/modules/auth";
import { cn } from "@/shared/utils/utils";
import type { BotPauseState, Conversation, Situation } from "../types/crm.types";
import { CHANNEL_LABEL } from "../utils/channels";
import { AssignMenu } from "./AssignMenu";
import { BotPauseControl } from "./BotPauseControl";
import { ConversationAvatar } from "./ConversationAvatar";
import { ConversationControlsHelp } from "./ConversationControlsHelp";
import { StageChip } from "./StageChip";

interface Props {
  conversation: Conversation;
  situations: Situation[];
  busy: boolean;
  onSituationChange: (situationId: number) => void;
  onAssign: (userId: string | null) => void;
  onTake: () => void;
  onRelease: () => void;
  /** false = bot apagado: Chats funciona como bandeja, no hay bot que pausar ni al que devolver. */
  botEnabled: boolean;
  botPause: BotPauseState;
  botPauseBusy: boolean;
  onPauseBot: (until: string | null) => void;
  onResumeBot: () => void;
  /** Panel de pedido abierto, y cuántas prendas lleva el carrito. */
  orderOpen: boolean;
  orderItems: number;
  onToggleOrder: () => void;
}

/** Horas que le quedan a la ventana de 24 h, en corto: "18 h", "< 1 h". */
const windowLeft = (iso: string | null): string => {
  if (!iso) return "";
  const hours = (new Date(iso).getTime() - Date.now()) / 3_600_000;
  return hours < 1 ? "< 1 h" : `${Math.floor(hours)} h`;
};

export const ConversationHeader = ({
  conversation,
  situations,
  busy,
  onSituationChange,
  onAssign,
  onTake,
  onRelease,
  botEnabled,
  botPause,
  botPauseBusy,
  onPauseBot,
  onResumeBot,
  orderOpen,
  orderItems,
  onToggleOrder,
}: Props) => {
  const { user } = useAuth();

  const takenByMe = !!conversation.takenBy && conversation.takenBy === user?.id;
  const takenBySomeoneElse = !!conversation.takenBy && !takenByMe;
  const assignedToMe = !!conversation.assignedTo && conversation.assignedTo === user?.id;
  // Soltar el control se lo devuelve al asignado. Si el asignado soy yo, eso
  // no haría nada: para devolver mi propio cliente al bot hay que quitar la
  // asignación, que ya suelta el control.
  const canRelease = takenByMe && !assignedToMe;
  // Un solo botón principal: mientras no tengas el control, tomarlo; después,
  // armar el pedido.
  const orderIsPrimary = takenByMe;

  const windowTitle = conversation.windowOpen
    ? `La ventana de 24 h vence ${formatDistanceToNowStrict(new Date(conversation.windowExpiresAt ?? Date.now()), {
        locale: es,
        addSuffix: true,
      })}`
    : "Pasaron más de 24 h desde el último mensaje del cliente: solo se pueden enviar plantillas";

  // Sin bot, soltar un chat sin asignado lo deja libre para que lo tome otro.
  const releaseLabel = conversation.assignedTo
    ? `Devolver a ${conversation.assignedToName || "su asesor"}`
    : botEnabled
      ? "Devolver al bot"
      : "Soltar el chat para que lo tome otro asesor";
  const releaseText = botEnabled || conversation.assignedTo ? "Devolver" : "Soltar";

  // Una sola fila, como los inbox del mercado: identidad a la izquierda y, a
  // la derecha, el estado en chips (etapa, asesor, ventana), los íconos (bot,
  // ayuda) y las dos acciones. Con el pedido abierto el nombre se trunca y el
  // bloque de chips se desliza de costado en vez de saltar de línea.
  return (
    <header className="flex items-center gap-3 border-b bg-background px-4 py-2.5">
      <ConversationAvatar name={conversation.displayName} channel={conversation.channel} />

      <div className="min-w-[80px] flex-1">
        <h2 className="truncate text-sm font-semibold leading-tight" title={conversation.displayName}>
          {conversation.displayName}
        </h2>
        <p className="truncate text-[11px] leading-tight text-muted-foreground">
          {conversation.subtitle || CHANNEL_LABEL[conversation.channel]}
        </p>
      </div>

      <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto [&>*]:shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ComponentPermission codeIn={["crm_conversations.stage"]}>
          <StageChip
            situation={conversation.situation}
            situations={situations}
            disabled={busy}
            onChange={onSituationChange}
          />
        </ComponentPermission>

        <ComponentPermission codeIn={["crm_conversations.assign", "crm_conversations.assign_any"]}>
          <AssignMenu
            assignedTo={conversation.assignedTo}
            assignedToName={conversation.assignedToName}
            disabled={busy}
            onAssign={onAssign}
          />
        </ComponentPermission>

        <span
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs",
            conversation.windowOpen
              ? "border text-muted-foreground"
              : "bg-destructive-soft text-destructive-soft-foreground"
          )}
          title={windowTitle}
        >
          <Clock className="h-3 w-3" />
          {conversation.windowOpen ? windowLeft(conversation.windowExpiresAt) : "Vencida"}
        </span>

        {botEnabled && (
          <BotPauseControl
            state={botPause}
            busy={busy || botPauseBusy}
            onPause={onPauseBot}
            onResume={onResumeBot}
          />
        )}

        <ConversationControlsHelp botEnabled={botEnabled} />
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <ComponentPermission codeIn={["crm_conversations.take"]}>
          {canRelease ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs"
              onClick={onRelease}
              disabled={busy}
              title={releaseLabel}
              aria-label={releaseLabel}
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              {releaseText}
            </Button>
          ) : takenByMe ? null : (
            <Button
              size="sm"
              className="h-8 px-2.5 text-xs"
              onClick={onTake}
              disabled={busy}
              title={
                takenBySomeoneElse
                  ? `Le vas a quitar el control a ${conversation.takenByName || "otro asesor"}`
                  : botEnabled
                    ? "Responder tú; el bot deja de contestar en este chat"
                    : "Responder tú; queda registrado que atiendes este chat"
              }
            >
              <Hand className="mr-1 h-3.5 w-3.5" />
              {takenBySomeoneElse ? "Quitarle el control" : "Tomar el control"}
            </Button>
          )}
        </ComponentPermission>

        <ComponentPermission codeIn={["sales.create"]}>
          <Button
            variant={orderIsPrimary && !orderOpen ? "default" : orderOpen ? "secondary" : "outline"}
            size="sm"
            className="h-8 px-2.5 text-xs"
            onClick={onToggleOrder}
            aria-pressed={orderOpen}
          >
            <ShoppingBag className="mr-1 h-3.5 w-3.5" />
            Pedido{orderItems > 0 ? ` (${orderItems})` : ""}
          </Button>
        </ComponentPermission>
      </div>
    </header>
  );
};
