import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import PageLoader from "@/shared/components/page-loader/PageLoader";
import { useAuth } from "@/modules/auth";
import { ChatBackdrop } from "../components/ChatBackdrop";
import { ConversationHeader } from "../components/ConversationHeader";
import { ConversationList } from "../components/ConversationList";
import { ConversationThread } from "../components/ConversationThread";
import { MessageComposer } from "../components/MessageComposer";
import { QuickOrderPanel } from "../components/quick-order/QuickOrderPanel";
import { useBotPause } from "../hooks/useBotPause";
import { useConversationThread } from "../hooks/useConversationThread";
import { useConversations } from "../hooks/useConversations";
import { useMessagingSettings } from "../hooks/useMessagingSettings";
import { useQuickOrderDrafts } from "../hooks/useQuickOrderDrafts";
import type { Conversation } from "../types/crm.types";

const InboxPage = () => {
  const { permissionCodes } = useAuth();
  const canOrder = permissionCodes.includes("sales.create");

  const {
    data,
    counts,
    networkCounts,
    situations,
    channelId,
    initialLoading,
    listLoading,
    acting,
    filters,
    updateFilters,
    setSituation,
    assign,
    takeControl,
  } = useConversations();

  // En qué redes responde el bot y canal de venta de cada red.
  const messaging = useMessagingSettings();

  const [selectedIdentity, setSelectedIdentity] = useState<string | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const drafts = useQuickOrderDrafts();

  // La conversación seleccionada se busca en la lista viva, así el encabezado
  // muestra el estado nuevo (quién la tomó, la etapa) sin quedar desfasado. Si
  // un filtro la deja fuera de la lista, el chat sigue abierto con su última
  // versión conocida, como en WhatsApp: filtrar cambia la lista, no el chat.
  const lastSelected = useRef<Conversation | null>(null);
  const selected = useMemo<Conversation | null>(() => {
    const live = data.find((c) => c.identity === selectedIdentity);
    if (live) return live;
    const kept = lastSelected.current;
    return kept && kept.identity === selectedIdentity ? kept : null;
  }, [data, selectedIdentity]);

  useEffect(() => {
    lastSelected.current = selected;
  }, [selected]);

  const { messages, loading: threadLoading, reload: reloadThread } =
    useConversationThread(selected);

  // El bot del chat abierto es el de su red.
  const botEnabled = selected ? messaging.botEnabledFor(selected.channel) : false;
  const botPause = useBotPause(channelId, selected);

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

  const draft = selected ? drafts.get(selected.identity) : null;
  const showOrder = orderOpen && canOrder && !!selected;

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* Tres zonas en una sola tarjeta: lista, chat y pedido. Alto fijo con
          scroll interno en cada una, para que la página no scrollee entera.
          Sin barra de navegación propia: el sidebar del ERP ya cumple ese rol. */}
      <Card className="relative flex min-h-0 flex-1 flex-row overflow-hidden">
        {initialLoading && <PageLoader message="Cargando chats…" />}

        <aside
          className={
            showOrder
              ? "w-14 shrink-0 border-r"
              : "flex w-[260px] shrink-0 flex-col border-r"
          }
        >
          <ConversationList
            conversations={data}
            counts={counts}
            networkCounts={networkCounts}
            connectedNetworks={messaging.connectedNetworks}
            situations={situations}
            filters={filters}
            selectedIdentity={selectedIdentity}
            loading={initialLoading}
            refreshing={listLoading}
            compact={showOrder}
            onFiltersChange={updateFilters}
            onSelect={(c) => setSelectedIdentity(c.identity)}
            onExpand={() => setOrderOpen(false)}
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
                onRelease={() => runAndRefresh(takeControl(selected, true))}
                botEnabled={botEnabled}
                botPause={botPause.state}
                botPauseBusy={botPause.busy}
                onPauseBot={(until) => void botPause.pause(until)}
                onResumeBot={() => void botPause.resume()}
                orderOpen={showOrder}
                orderItems={draft ? draft.lines.reduce((n, l) => n + l.quantity, 0) : 0}
                onToggleOrder={() => setOrderOpen((open) => !open)}
              />

              {/* Fondo oscuro (--chat), de la familia del sidebar: sobre él se
                  leen el cliente en blanco y lo que manda el negocio en morado. */}
              <div className="relative min-h-0 flex-1 bg-chat">
                {/* Patrón de dibujos de la marca, fijo detrás de los mensajes. */}
                <ChatBackdrop />
                <div className="relative h-full">
                  <ConversationThread messages={messages} loading={threadLoading} />
                </div>
              </div>

              {/* El compositor decide solo si se puede escribir o no: cuando no
                  se puede, muestra el motivo en lugar de la caja. */}
              <MessageComposer
                conversation={selected}
                channelId={channelId}
                botEnabled={botEnabled}
                onSent={reloadThread}
                onTake={() => runAndRefresh(takeControl(selected, false))}
                busy={acting}
              />
            </>
          ) : (
            !initialLoading && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Elige una conversación para verla.
                </p>
              </div>
            )
          )}
        </section>

        {showOrder && selected && (
          <aside className="flex w-[320px] shrink-0 flex-col border-l">
            <QuickOrderPanel
              key={selected.identity}
              conversation={selected}
              channelId={channelId}
              draft={drafts.get(selected.identity)}
              onDraftChange={(next) => drafts.set(selected.identity, next)}
              onDraftReset={() => drafts.reset(selected.identity)}
              channelSaleTypeId={messaging.saleTypeFor(selected.channel)}
              onClose={() => setOrderOpen(false)}
              onSummarySent={reloadThread}
            />
          </aside>
        )}
      </Card>
    </div>
  );
};

export default InboxPage;
