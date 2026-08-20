import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { Bot, Clock, MessageSquare, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/shared/utils/utils";
import type { Conversation } from "../types/crm.types";
import { stageBadgeVariant } from "./stageBadge";

interface Props {
  conversations: Conversation[];
  selectedIdentity: string | null;
  loading: boolean;
  onSelect: (conversation: Conversation) => void;
}

const relative = (iso: string) => {
  try {
    return formatDistanceToNowStrict(new Date(iso), { locale: es, addSuffix: false });
  } catch {
    return "";
  }
};

/** Prefijo de quién habló último: sin esto no se distingue una respuesta del bot. */
const authorPrefix = (from: Conversation["lastMessageFrom"]) => {
  if (from === "bot") return "Bot: ";
  if (from === "business") return "Tú: ";
  return "";
};

export const ConversationList = ({
  conversations,
  selectedIdentity,
  loading,
  onSelect,
}: Props) => {
  if (!loading && conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <MessageSquare className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">No hay conversaciones</p>
        <p className="text-xs text-muted-foreground">
          Aparecerán acá en cuanto un cliente escriba, o al ajustar los filtros.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <ul className="divide-y divide-border">
        {conversations.map((c) => {
          const selected = c.identity === selectedIdentity;

          return (
            <li key={c.identity}>
              <button
                type="button"
                onClick={() => onSelect(c)}
                aria-current={selected}
                className={cn(
                  "flex w-full flex-col gap-1.5 px-4 py-3 text-left transition-colors",
                  "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  selected && "bg-muted"
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">{c.displayName}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {relative(c.lastMessageAt)}
                  </span>
                </div>

                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {authorPrefix(c.lastMessageFrom)}
                  {c.lastMessage || "—"}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {c.situation && (
                    <Badge variant={stageBadgeVariant(c.situation.statusCode)}>
                      {c.situation.name}
                    </Badge>
                  )}

                  {/* Quién la tiene ahora pesa más que de quién es, así que va primero. */}
                  {c.takenBy && (
                    <Badge variant="info" className="gap-1">
                      <User className="h-3 w-3" />
                      {c.takenByName || "Tomada"}
                    </Badge>
                  )}

                  {!c.takenBy && c.assignedTo && (
                    <Badge variant="secondary" className="gap-1">
                      <User className="h-3 w-3" />
                      {c.assignedToName || "Asignada"}
                    </Badge>
                  )}

                  {c.botAnswers && (
                    <Badge variant="outline" className="gap-1">
                      <Bot className="h-3 w-3" />
                      Bot
                    </Badge>
                  )}

                  {/* La ventana de Meta solo se avisa cuando está cerrada: es
                      cuando cambia lo que se puede hacer. */}
                  {!c.windowOpen && (
                    <Badge variant="destructive-soft" className="gap-1">
                      <Clock className="h-3 w-3" />
                      Ventana vencida
                    </Badge>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
};
