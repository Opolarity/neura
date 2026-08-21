import { useEffect, useMemo, useState } from "react";
import { Filter, MessageSquare, RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import PageLoader from "@/shared/components/page-loader/PageLoader";
import { useAuth } from "@/modules/auth";
import { ConversationHeader } from "../components/ConversationHeader";
import { ConversationList } from "../components/ConversationList";
import { ConversationThread } from "../components/ConversationThread";
import { MessageComposer } from "../components/MessageComposer";
import { useConversationThread } from "../hooks/useConversationThread";
import { useConversations } from "../hooks/useConversations";
import type { Conversation } from "../types/crm.types";

// Valor centinela del Select: Radix no admite un SelectItem con value="".
const ALL = "__all__";

const InboxPage = () => {
  const { user } = useAuth();
  const {
    data,
    situations,
    channelId,
    loading,
    acting,
    filters,
    updateFilters,
    clearFilters,
    reload,
    setSituation,
    assign,
    takeControl,
  } = useConversations();

  const [selectedIdentity, setSelectedIdentity] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState("");

  // La conversación seleccionada se busca en la lista viva, no se copia a un
  // estado propio: así al refrescarse la lista el encabezado muestra el estado
  // nuevo (quién la tomó, la etapa) sin quedar desfasado.
  const selected = useMemo<Conversation | null>(
    () => data.find((c) => c.identity === selectedIdentity) ?? null,
    [data, selectedIdentity]
  );

  const { messages, loading: threadLoading, reload: reloadThread } =
    useConversationThread(selected);

  // Al entrar, abre la primera conversación: una pantalla partida con el lado
  // derecho vacío no comunica nada.
  useEffect(() => {
    if (!selectedIdentity && data.length > 0) {
      setSelectedIdentity(data[0].identity);
    }
  }, [data, selectedIdentity]);

  const runAndRefresh = async (action: Promise<boolean>) => {
    const ok = await action;
    if (ok) reloadThread();
  };

  const hasFilters =
    filters.search !== "" ||
    filters.situationId !== null ||
    filters.unassigned ||
    filters.taken !== null;

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold leading-tight">Chats</h1>
          <p className="text-sm text-muted-foreground">
            Los chats de WhatsApp del negocio, con su etapa y su responsable.
          </p>
        </div>

        <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={reload} disabled={loading}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            updateFilters({ search: searchDraft });
          }}
        >
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Buscar cliente, teléfono o texto…"
            className="h-8 w-[230px] pl-8 text-xs"
          />
        </form>

        <Select
          value={filters.situationId ? String(filters.situationId) : ALL}
          onValueChange={(v) =>
            updateFilters({ situationId: v === ALL ? null : Number(v) })
          }
        >
          <SelectTrigger className="h-8 w-[170px] text-xs">
            <SelectValue placeholder="Todas las etapas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las etapas</SelectItem>
            {situations.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={filters.assignedTo ? "default" : "outline"}
          size="sm"
          className="h-8 px-2.5 text-xs"
          onClick={() =>
            updateFilters({
              assignedTo: filters.assignedTo ? null : user?.id ?? null,
              unassigned: false,
            })
          }
        >
          Mías
        </Button>

        <Button
          variant={filters.unassigned ? "default" : "outline"}
          size="sm"
          className="h-8 px-2.5 text-xs"
          onClick={() =>
            updateFilters({ unassigned: !filters.unassigned, assignedTo: null })
          }
        >
          Sin asignar
        </Button>

        <Button
          variant={filters.taken === true ? "default" : "outline"}
          size="sm"
          className="h-8 px-2.5 text-xs"
          onClick={() => updateFilters({ taken: filters.taken === true ? null : true })}
        >
          <Filter className="mr-1 h-3.5 w-3.5" />
          Tomadas
        </Button>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
          className="h-8 px-2.5 text-xs"
            onClick={() => {
              setSearchDraft("");
              clearFilters();
            }}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Bandeja: lista fija a la izquierda, hilo a la derecha. Alto fijo con
          scroll interno en cada panel, para que la página no scrollee entera. */}
      <Card className="relative flex min-h-0 flex-1 flex-row overflow-hidden">
        {loading && <PageLoader message="Cargando chats…" />}

        <aside className="flex w-[340px] shrink-0 flex-col border-r bg-primary/[0.05]">
          <ConversationList
            conversations={data}
            selectedIdentity={selectedIdentity}
            loading={loading}
            onSelect={(c) => setSelectedIdentity(c.identity)}
          />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          {selected ? (
            <>
              <ConversationHeader
                conversation={selected}
                situations={situations}
                busy={acting}
                onSituationChange={(id) => runAndRefresh(setSituation(selected, id))}
                onAssign={(userId) => runAndRefresh(assign(selected, userId))}
                onTake={() => runAndRefresh(takeControl(selected, false))}
                onRelease={() => runAndRefresh(takeControl(selected, true))}
              />

              <div className="min-h-0 flex-1">
                <ConversationThread messages={messages} loading={threadLoading} />
              </div>

              {/* El compositor decide solo si se puede escribir o no: cuando no
                  se puede, muestra el motivo en lugar de la caja. */}
              <MessageComposer
                conversation={selected}
                channelId={channelId}
                onSent={reloadThread}
              />
            </>
          ) : (
            !loading && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Elegí una conversación para verla.
                </p>
              </div>
            )
          )}
        </section>
      </Card>
    </div>
  );
};

export default InboxPage;
