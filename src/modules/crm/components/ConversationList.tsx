import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { Bot, Clock, MessageSquare, User } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import type { Conversation } from "../types/crm.types";

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

/**
 * Etiqueta chica de la fila. No usa el componente Badge: sobre la fila
 * seleccionada —que es morada— los colores de Badge no contrastan, así que
 * cada etiqueta necesita una versión "sobre morado".
 */
const Chip = ({
  children,
  selected,
  tone = "neutral",
}: {
  children: React.ReactNode;
  selected: boolean;
  tone?: "neutral" | "warn" | "info" | "stage";
}) => (
  <span
    className={cn(
      "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10.5px] font-medium leading-none",
      selected && "bg-primary-foreground/20 text-primary-foreground",
      !selected && tone === "neutral" && "bg-muted text-muted-foreground",
      !selected && tone === "info" && "bg-info/15 text-info",
      !selected && tone === "warn" && "bg-destructive-soft text-destructive-soft-foreground",
      !selected && tone === "stage" && "bg-secondary text-secondary-foreground"
    )}
  >
    {children}
  </span>
);

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
        <p className="text-[13px] font-medium">No hay conversaciones</p>
        <p className="text-xs text-muted-foreground">
          Aparecerán acá en cuanto un cliente escriba, o al ajustar los filtros.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <ul className="flex flex-col gap-1 p-2">
        {conversations.map((c) => {
          const selected = c.identity === selectedIdentity;

          return (
            <li key={c.identity}>
              <button
                type="button"
                onClick={() => onSelect(c)}
                aria-current={selected}
                // min-w-0 en el botón y en cada hijo que trunca: sin eso el
                // ancho se calcula contra el contenido y no contra la columna,
                // y el texto se corta a ras del borde en vez de elipsar.
                className={cn(
                  "flex w-full min-w-0 flex-col gap-2 rounded-lg px-3 py-2.5 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-primary/10"
                )}
              >
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                    {c.displayName}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-[11px] tabular-nums",
                      selected ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    {relative(c.lastMessageAt)}
                  </span>
                </div>

                {/* truncate y no line-clamp: una sola línea con puntos
                    suspensivos reales. pr-1 para que el texto no llegue a
                    tocar el borde de la tarjeta. */}
                <p
                  className={cn(
                    "min-w-0 truncate pr-1 text-[11.5px]",
                    selected ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  {authorPrefix(c.lastMessageFrom)}
                  {c.lastMessage || "—"}
                </p>

                <div className="flex min-w-0 flex-wrap items-center gap-1">
                  {c.situation && (
                    <Chip selected={selected} tone="stage">
                      {c.situation.name}
                    </Chip>
                  )}

                  {/* Quién la tiene ahora pesa más que de quién es. */}
                  {c.takenBy && (
                    <Chip selected={selected} tone="info">
                      <User className="h-3 w-3" />
                      <span className="max-w-[110px] truncate">
                        {c.takenByName || "Tomada"}
                      </span>
                    </Chip>
                  )}

                  {!c.takenBy && c.assignedTo && (
                    <Chip selected={selected}>
                      <User className="h-3 w-3" />
                      <span className="max-w-[110px] truncate">
                        {c.assignedToName || "Asignada"}
                      </span>
                    </Chip>
                  )}

                  {c.botAnswers && (
                    <Chip selected={selected}>
                      <Bot className="h-3 w-3" />
                      Bot
                    </Chip>
                  )}

                  {/* La ventana solo se avisa cuando está cerrada: es cuando
                      cambia lo que se puede hacer. */}
                  {!c.windowOpen && (
                    <Chip selected={selected} tone="warn">
                      <Clock className="h-3 w-3" />
                      Vencida
                    </Chip>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
