import { useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { Hand, RefreshCw, Search, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageLoader from "@/shared/components/page-loader/PageLoader";
import { useAuth } from "@/modules/auth";
import { cn } from "@/shared/utils/utils";
import { useConversationsBoard } from "../hooks/useConversationsBoard";
import type { BoardCard, BoardColumn } from "../types/crm.types";

/** Color del encabezado de columna según el estado macro de la etapa. */
const columnAccent = (statusCode: string | null) => {
  switch ((statusCode ?? "").toUpperCase()) {
    case "COM":
      return "bg-success-soft text-success-soft-foreground";
    case "CAN":
      return "bg-destructive-soft text-destructive-soft-foreground";
    case "PEN":
      return "bg-primary/10 text-primary";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const relative = (iso: string) => {
  try {
    return formatDistanceToNowStrict(new Date(iso), { locale: es });
  } catch {
    return "";
  }
};

const BoardPage = () => {
  const { user } = useAuth();
  const { columns, loading, search, onlyMine, setSearch, setOnlyMine, reload, moveCard } =
    useConversationsBoard();

  const [searchDraft, setSearchDraft] = useState("");
  // Qué se está arrastrando y sobre qué columna está encima. dragOver se guarda
  // aparte para poder resaltar el destino sin tocar los datos.
  const [dragging, setDragging] = useState<{ card: BoardCard; from: number | null } | null>(
    null
  );
  const [dragOver, setDragOver] = useState<number | null | undefined>(undefined);

  const handleDrop = (column: BoardColumn) => {
    setDragOver(undefined);
    if (!dragging) return;

    const target = dragging;
    setDragging(null);

    // La columna "Sin etapa" no es una etapa real: no se puede volver a ella.
    // Quitarle la etapa a un chat significaría borrar su historial de
    // situaciones, que es justo lo que el tablero existe para construir.
    if (column.situationId === null) return;

    moveCard(target.card, column.situationId, target.from);
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold leading-tight">Chats Status</h1>
          <p className="text-sm text-muted-foreground">
            Arrastrá un chat a otra columna para cambiarle la etapa.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5 text-xs"
          onClick={reload}
          disabled={loading}
        >
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Actualizar
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchDraft);
          }}
        >
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Buscar cliente, teléfono o documento…"
            className="h-8 w-[250px] pl-8 text-xs"
          />
        </form>

        <Button
          variant={onlyMine ? "default" : "outline"}
          size="sm"
          className="h-8 px-2.5 text-xs"
          onClick={() => setOnlyMine(onlyMine ? null : user?.id ?? null)}
        >
          Mías
        </Button>

        {(search || onlyMine) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs"
            onClick={() => {
              setSearchDraft("");
              setSearch("");
              setOnlyMine(null);
            }}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Limpiar
          </Button>
        )}
      </div>

      {/* El tablero scrollea en horizontal; cada columna en vertical. */}
      <div className="relative min-h-0 flex-1">
        {loading && <PageLoader message="Cargando tablero…" />}

        <div className="flex h-full gap-3 overflow-x-auto pb-2">
          {columns.map((column) => {
            const isOver = dragOver === column.situationId;
            const isDropTarget = column.situationId !== null;

            return (
              <section
                key={column.situationId ?? "sin-etapa"}
                onDragOver={(e) => {
                  if (!isDropTarget) return;
                  e.preventDefault();
                  setDragOver(column.situationId);
                }}
                onDragLeave={() => setDragOver(undefined)}
                onDrop={() => handleDrop(column)}
                className={cn(
                  "flex w-[270px] shrink-0 flex-col rounded-lg border bg-card transition-colors",
                  isOver && isDropTarget && "border-primary bg-primary/5"
                )}
              >
                <header
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-t-lg px-3 py-2",
                    columnAccent(column.statusCode)
                  )}
                >
                  <h2 className="truncate text-xs font-semibold">{column.name}</h2>
                  <span className="shrink-0 rounded-full bg-background/60 px-1.5 text-[10.5px] font-medium tabular-nums">
                    {column.total}
                  </span>
                </header>

                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
                  {column.cards.length === 0 && (
                    <p className="px-1 py-3 text-center text-[11px] text-muted-foreground">
                      Sin chats
                    </p>
                  )}

                  {column.cards.map((card) => (
                    <article
                      key={card.identity}
                      draggable
                      onDragStart={() =>
                        setDragging({ card, from: column.situationId })
                      }
                      onDragEnd={() => {
                        setDragging(null);
                        setDragOver(undefined);
                      }}
                      className={cn(
                        "cursor-grab rounded-md border bg-background p-2 active:cursor-grabbing",
                        dragging?.card.identity === card.identity && "opacity-40"
                      )}
                    >
                      <p className="truncate text-[12px] font-medium leading-tight">
                        {card.displayName}
                      </p>

                      {card.subtitle && (
                        <p className="truncate text-[10.5px] leading-tight text-muted-foreground">
                          {card.subtitle}
                        </p>
                      )}

                      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                        {card.lastMessage || "—"}
                      </p>

                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-[10px] tabular-nums text-muted-foreground">
                          {relative(card.lastMessageAt)}
                        </span>

                        {card.taken && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-info/15 px-1.5 py-0.5 text-[9.5px] font-medium text-info">
                            <Hand className="h-2.5 w-2.5" />
                            Tomada
                          </span>
                        )}

                        {card.assignedToName && (
                          <span className="inline-flex min-w-0 items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[9.5px] font-medium text-muted-foreground">
                            <User className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{card.assignedToName}</span>
                          </span>
                        )}
                      </div>
                    </article>
                  ))}

                  {/* Aviso honesto: la columna puede tener más de lo que se ve. */}
                  {column.total > column.cards.length && (
                    <p className="px-1 pt-1 text-center text-[10px] text-muted-foreground">
                      +{column.total - column.cards.length} más
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BoardPage;
