import { useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { MoreHorizontal, RotateCcw, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ComponentPermission } from "@/shared/components/component-permission";
import { useAuth } from "@/modules/auth";
import type { BotPauseState, Conversation, Situation } from "../types/crm.types";
import { CHANNEL_LABEL } from "../utils/channels";
import { AssignSubmenu } from "./AssignSubmenu";
import { BotPauseDateDialog, BotPauseSubmenu } from "./BotPauseSubmenu";
import { ConversationAvatar } from "./ConversationAvatar";
import { StageSubmenu } from "./StageSubmenu";

interface Props {
  conversation: Conversation;
  situations: Situation[];
  busy: boolean;
  onSituationChange: (situationId: number) => void;
  onAssign: (userId: string | null) => void;
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

const firstName = (name: string | null, fallback: string) => (name || fallback).split(/\s+/)[0];

/**
 * Encabezado del chat abierto. A la izquierda, quién es el cliente (nombre y
 * número) y una línea de estado: quién lo atiende, a quién está asignado y
 * cuánto le queda a la ventana. A la derecha, solo Pedido y el menú ⋯ con lo
 * que se usa de vez en cuando (etapa, asignar, pausar el bot, devolver).
 *
 * Tomar el control no está acá: vive en la caja de texto, donde se escribe.
 */
export const ConversationHeader = ({
  conversation,
  situations,
  busy,
  onSituationChange,
  onAssign,
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
  const { user, permissionCodes } = useAuth();
  // Mismo criterio que ComponentPermission: el admin también solo ve lo que su plan incluye.
  const can = (...codes: string[]) => codes.some((c) => permissionCodes.includes(c));
  const [dateDialogOpen, setDateDialogOpen] = useState(false);

  const takenByMe = !!conversation.takenBy && conversation.takenBy === user?.id;
  const assignedToMe = !!conversation.assignedTo && conversation.assignedTo === user?.id;
  // Soltar el control se lo devuelve al asignado. Si el asignado soy yo, eso
  // no haría nada: para devolver mi propio cliente al bot hay que quitar la
  // asignación, que ya suelta el control.
  const canRelease = takenByMe && !assignedToMe && can("crm_conversations.take");

  const windowTitle = conversation.windowOpen
    ? `La ventana de 24 h vence ${formatDistanceToNowStrict(new Date(conversation.windowExpiresAt ?? Date.now()), {
        locale: es,
        addSuffix: true,
      })}`
    : "Pasaron más de 24 h desde el último mensaje del cliente: solo se pueden enviar plantillas";

  // Quién atiende: lo primero que necesita saber el resto del equipo.
  const attendant = conversation.takenBy
    ? takenByMe
      ? "Atiendes tú"
      : `Atiende ${conversation.takenByName || "otro asesor"}`
    : botEnabled && botPause.paused
      ? "Bot en pausa"
      : botEnabled && conversation.botAnswers
        ? "Atiende el bot"
        : "Sin atender";
  // La asignación se nombra solo si dice algo que "Atiende…" no dijo ya.
  const assignment =
    conversation.assignedTo && conversation.assignedTo !== conversation.takenBy
      ? `Asignado a ${assignedToMe ? "ti" : firstName(conversation.assignedToName, "un asesor")}`
      : null;

  // Sin bot, soltar un chat sin asignado lo deja libre para que lo tome otro.
  const releaseLabel = conversation.assignedTo
    ? `Devolver a ${conversation.assignedToName || "su asesor"}`
    : botEnabled
      ? "Devolver al bot"
      : "Soltar el chat";
  const releaseHint = conversation.assignedTo
    ? "Le devuelves el chat a su asesor."
    : botEnabled
      ? "El bot vuelve a responder en este chat."
      : "Queda libre para que lo tome otro asesor.";

  const canStage = can("crm_conversations.stage");
  const canAssign = can("crm_conversations.assign", "crm_conversations.assign_any");
  const canPauseBot = botEnabled && can("crm_conversations.take");
  const hasMenu = canStage || canAssign || canPauseBot || canRelease;

  return (
    <header className="flex items-center gap-3 border-b bg-background px-4 py-2.5">
      <ConversationAvatar name={conversation.displayName} channel={conversation.channel} />

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold leading-tight" title={conversation.displayName}>
          {conversation.displayName}
        </h2>
        {/* Número (o @) · quién atiende · asignación · ventana. El número va
            siempre: con el nombre solo no siempre se reconoce al cliente. */}
        <p className="truncate text-[11px] leading-tight text-muted-foreground">
          <span className="tabular-nums">{conversation.subtitle || CHANNEL_LABEL[conversation.channel]}</span>
          <span aria-hidden="true"> · </span>
          <span className="font-medium text-foreground">{attendant}</span>
          {assignment && (
            <>
              <span aria-hidden="true"> · </span>
              {assignment}
            </>
          )}
          <span aria-hidden="true"> · </span>
          <span title={windowTitle} className={conversation.windowOpen ? undefined : "font-medium text-destructive"}>
            {conversation.windowOpen ? `vence en ${windowLeft(conversation.windowExpiresAt)}` : "Vencida"}
          </span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <ComponentPermission codeIn={["sales.create"]}>
          <Button
            variant={orderOpen ? "secondary" : takenByMe ? "default" : "outline"}
            size="sm"
            className="h-8 px-2.5 text-xs"
            onClick={onToggleOrder}
            aria-pressed={orderOpen}
          >
            <ShoppingBag className="mr-1 h-3.5 w-3.5" />
            Pedido{orderItems > 0 ? ` (${orderItems})` : ""}
          </Button>
        </ComponentPermission>

        {hasMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={busy}
                title="Más acciones"
                aria-label="Más acciones"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              {canStage && (
                <StageSubmenu
                  situation={conversation.situation}
                  situations={situations}
                  disabled={busy}
                  onChange={onSituationChange}
                />
              )}
              {canAssign && (
                <AssignSubmenu
                  assignedTo={conversation.assignedTo}
                  assignedToName={conversation.assignedToName}
                  disabled={busy}
                  onAssign={onAssign}
                />
              )}
              {canPauseBot && (
                <BotPauseSubmenu
                  state={botPause}
                  busy={busy || botPauseBusy}
                  onPause={onPauseBot}
                  onResume={onResumeBot}
                  onPickDate={() => setDateDialogOpen(true)}
                />
              )}
              {canRelease && (
                <>
                  {(canStage || canAssign || canPauseBot) && <DropdownMenuSeparator />}
                  <DropdownMenuItem className="items-start gap-2 text-xs" onSelect={onRelease}>
                    <RotateCcw className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0">
                      <span className="block font-medium">{releaseLabel}</span>
                      <span className="block text-[11px] text-muted-foreground">{releaseHint}</span>
                    </span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <BotPauseDateDialog
        open={dateDialogOpen}
        onOpenChange={setDateDialogOpen}
        busy={busy || botPauseBusy}
        onPause={onPauseBot}
      />
    </header>
  );
};
