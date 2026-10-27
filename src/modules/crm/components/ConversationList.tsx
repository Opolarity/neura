import { useEffect, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquare, PanelLeftOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/shared/utils/utils";
import type {
  Conversation,
  ConversationChannel,
  ConversationCounts,
  ConversationFilters,
  ConversationView,
  NetworkCounts,
  Situation,
} from "../types/crm.types";
import { isMediaMarker, MEDIA_ICON, mediaPreview } from "../utils/attachments";
import { CHANNEL_LABEL, CHANNELS } from "../utils/channels";
import { ChannelIcon } from "./ChannelIcon";
import { ConversationAvatar } from "./ConversationAvatar";

interface Props {
  conversations: Conversation[];
  counts: ConversationCounts;
  /** Totales de cada pestaña de red. */
  networkCounts: NetworkCounts;
  /** Redes con una cuenta conectada: las demás muestran "todavía no está conectado". */
  connectedNetworks: ConversationChannel[];
  situations: Situation[];
  filters: ConversationFilters;
  selectedIdentity: string | null;
  loading: boolean;
  /** Recarga por filtro: la lista actual queda visible hasta que llega la nueva. */
  refreshing: boolean;
  /** Con el POS abierto la lista se reduce a una columna de avatares. */
  compact: boolean;
  onFiltersChange: (partial: Partial<ConversationFilters>) => void;
  onSelect: (conversation: Conversation) => void;
  onExpand: () => void;
}

// Valor centinela del Select: Radix no admite un SelectItem con value="".
const ALL = "__all__";

const VIEWS: { key: ConversationView; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "mine", label: "Mías" },
  { key: "unassigned", label: "Sin asignar" },
  { key: "taken", label: "Tomadas" },
  { key: "window_closed", label: "Vencidas" },
];

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
 * Vista previa del último mensaje. Si fue un archivo se nombra ("Foto",
 * "Nota de voz", el nombre del documento) con su ícono, en vez del marcador
 * "[imagen]" o de la URL; si llevaba texto, va a continuación.
 */
const LastMessage = ({ conversation: c }: { conversation: Conversation }) => {
  const type = c.lastMessageMediaType;
  if (!type) {
    return (
      <p className="min-w-0 truncate text-[11.5px] text-muted-foreground">
        {authorPrefix(c.lastMessageFrom)}
        {c.lastMessage || "—"}
      </p>
    );
  }

  const Icon = MEDIA_ICON[type];
  const caption = isMediaMarker(c.lastMessage) || /URL:\s*https?:\/\//i.test(c.lastMessage) ? "" : c.lastMessage;
  return (
    <p className="flex min-w-0 items-center gap-1 text-[11.5px] text-muted-foreground">
      {authorPrefix(c.lastMessageFrom) && <span className="shrink-0">{authorPrefix(c.lastMessageFrom)}</span>}
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="min-w-0 truncate">
        {caption || mediaPreview(type, c.lastMessageFileName)}
      </span>
    </p>
  );
};

/** Etiqueta chica de la fila: solo se pinta lo que cambia lo que se puede hacer. */
const Chip = ({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "warn";
}) => (
  <span
    className={cn(
      "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10.5px] font-medium leading-none",
      tone === "neutral" && "bg-muted text-muted-foreground",
      tone === "warn" && "bg-destructive-soft text-destructive-soft-foreground"
    )}
  >
    {children}
  </span>
);

export const ConversationList = ({
  conversations,
  counts,
  networkCounts,
  connectedNetworks,
  situations,
  filters,
  selectedIdentity,
  loading,
  refreshing,
  compact,
  onFiltersChange,
  onSelect,
  onExpand,
}: Props) => {
  const [searchDraft, setSearchDraft] = useState(filters.search);

  // Si los filtros se limpian desde afuera, el borrador del buscador acompaña.
  useEffect(() => {
    setSearchDraft(filters.search);
  }, [filters.search]);

  // La red filtra en el servidor: la lista y los contadores de las vistas ya
  // son los de la pestaña elegida, y los totales de cada pestaña vienen aparte.
  const visible = conversations;
  const channelTotal = (channel: ConversationChannel | "all") => networkCounts[channel];
  const viewCount = (key: ConversationView) => counts[key];

  if (compact) {
    return (
      <div className="flex h-full flex-col items-center gap-2 overflow-y-auto py-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onExpand}
          title="Mostrar la lista de chats"
          aria-label="Mostrar la lista de chats"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
        {visible.map((c) => (
          <button
            key={c.identity}
            type="button"
            onClick={() => onSelect(c)}
            title={`${c.displayName} · ${CHANNEL_LABEL[c.channel]}`}
            aria-current={c.identity === selectedIdentity}
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ConversationAvatar name={c.displayName} channel={c.channel} selected={c.identity === selectedIdentity} />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-center gap-2">
          <h1 className="flex-1 text-2xl font-bold text-foreground">Chats</h1>
          <Select
            value={filters.situationId ? String(filters.situationId) : ALL}
            onValueChange={(v) => onFiltersChange({ situationId: v === ALL ? null : Number(v) })}
          >
            <SelectTrigger className="h-8 w-[118px] text-xs" aria-label="Etapa">
              <SelectValue placeholder="Toda etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Toda etapa</SelectItem>
              {situations.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Pestañas de red: cada conversación vive en su canal de mensajería. */}
        <div className="-mx-3 flex border-b px-1" role="tablist" aria-label="Redes">
          {(["all", ...CHANNELS] as const).map((ch) => {
            const active = filters.channel === ch;
            return (
              <button
                key={ch}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onFiltersChange({ channel: ch })}
                title={ch === "all" ? "Todas las redes" : CHANNEL_LABEL[ch]}
                className={cn(
                  "-mb-px flex flex-1 items-center justify-center gap-1 border-b-2 px-1 py-1.5 text-[11px] transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  active
                    ? "border-primary font-semibold text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {ch === "all" ? "Todos" : <ChannelIcon channel={ch} className="h-3.5 w-3.5" />}
                <span className="tabular-nums">{channelTotal(ch)}</span>
                {ch !== "all" && <span className="sr-only">{CHANNEL_LABEL[ch]}</span>}
              </button>
            );
          })}
        </div>

        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            onFiltersChange({ search: searchDraft });
          }}
        >
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onBlur={() => searchDraft !== filters.search && onFiltersChange({ search: searchDraft })}
            placeholder="Buscar cliente, celular o texto"
            className="h-8 pl-8 text-xs"
          />
        </form>

        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Vistas">
          {VIEWS.map((v) => {
            const active = filters.view === v.key;
            return (
              <button
                key={v.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onFiltersChange({ view: v.key })}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-primary/10"
                )}
              >
                {v.label} <span className="tabular-nums">{viewCount(v.key)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de carga de la lista: el alto está siempre reservado para que
          la lista no salte al aparecer. */}
      <div className="h-0.5 shrink-0" aria-hidden="true">
        {refreshing && <div className="h-full w-full animate-pulse bg-primary" />}
      </div>

      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overflow-x-hidden border-t transition-opacity",
          refreshing && "opacity-60"
        )}
        aria-busy={refreshing}
      >
        {!loading && visible.length === 0 ? (
          filters.channel !== "all" && !connectedNetworks.includes(filters.channel) ? (
            // Todavía no llegan mensajes de estas redes: se dice eso y no
            // "no hay conversaciones", que sugeriría que ya están conectadas.
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <ChannelIcon channel={filters.channel} className="h-8 w-8 text-muted-foreground" />
              <p className="text-[13px] font-medium">
                {CHANNEL_LABEL[filters.channel]} todavía no está conectado
              </p>
              <p className="text-xs text-muted-foreground">
                Conéctalo en Canales de mensajería y sus mensajes aparecerán aquí junto a los de WhatsApp.
              </p>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
              <p className="text-[13px] font-medium">No hay conversaciones</p>
              <p className="text-xs text-muted-foreground">
                Aparecerán aquí en cuanto un cliente escriba, o al ajustar los filtros.
              </p>
            </div>
          )
        ) : (
          <ul>
            {visible.map((c) => {
              const selected = c.identity === selectedIdentity;
              return (
                <li key={c.identity} className="border-b last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onSelect(c)}
                    aria-current={selected}
                    // min-w-0 en el botón y en cada hijo que trunca: sin eso el
                    // ancho se calcula contra el contenido y no elipsa.
                    className={cn(
                      "flex w-full min-w-0 gap-2.5 px-3 py-2.5 text-left transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                      selected ? "bg-primary/10" : "hover:bg-muted"
                    )}
                  >
                    <ConversationAvatar name={c.displayName} channel={c.channel} selected={selected} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex min-w-0 items-baseline gap-2">
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                          {c.displayName}
                        </span>
                        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                          {relative(c.lastMessageAt)}
                        </span>
                      </div>
                      <LastMessage conversation={c} />
                      {(c.situation || !c.windowOpen) && (
                        <div className="mt-0.5 flex min-w-0 flex-wrap gap-1">
                          {c.situation && <Chip>{c.situation.name}</Chip>}
                          {!c.windowOpen && <Chip tone="warn">Vencida</Chip>}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
