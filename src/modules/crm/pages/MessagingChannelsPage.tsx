import { useEffect, useState } from "react";
import { AlertTriangle, Bot, Info, Link2, Unlink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import PageLoader from "@/shared/components/page-loader/PageLoader";
import { preloadFacebookSdk } from "@/shared/services/facebookLogin";
import { useAuth } from "@/modules/auth";
import { ChannelIcon } from "../components/ChannelIcon";
import { useMessagingChannels } from "../hooks/useMessagingChannels";
import type { ConversationChannel } from "../types/crm.types";
import type {
  MessagingAccount,
  MessagingChannel,
  MessagingSaleType,
  WhatsappConnectMode,
} from "../types/messaging.types";
import { CHANNEL_LABEL } from "../utils/channels";

/** Qué se puede hacer con cada red una vez conectada. */
const WHAT_IT_DOES: Record<ConversationChannel, string> = {
  whatsapp: "Recibe y responde los mensajes de tu número de WhatsApp Business en Chats.",
  instagram: "Recibe y responde los mensajes directos de tu cuenta profesional de Instagram en Chats.",
  facebook: "Recibe y responde los mensajes de Messenger de tu página de Facebook en Chats.",
  tiktok: "Recibe y responde los mensajes directos de tu cuenta de TikTok en Chats.",
};

/** Redes que se conectan con el login de Facebook: un solo login trae las dos. */
const META_NETWORKS: ConversationChannel[] = ["facebook", "instagram"];

/** Por qué todavía no se puede conectar cada red desde aquí y a quién pedirlo. */
const CONNECT_NOTE: Partial<Record<ConversationChannel, string>> = {
  tiktok: "Disponible cuando TikTok apruebe la integración de mensajes de Neura. Mientras tanto, pide la conexión a soporte.",
};

// Valor centinela del Select: Radix no admite un SelectItem con value="".
const AUTO = "__auto__";

/**
 * Las redes de mensajería del negocio: en cuáles responde el bot, qué cuentas
 * están conectadas y a qué canal de venta van sus órdenes.
 *
 * Cada red NO es un canal externo (external_channels): ahí cada canal tiene
 * su propio catálogo habilitado. Todas usan el catálogo del canal del bot y
 * solo apuntan a su canal de venta.
 */
const MessagingChannelsPage = () => {
  const { permissionCodes } = useAuth();
  const canManage = permissionCodes.includes("crm_messaging.manage");
  const {
    settings,
    channels,
    saleTypes,
    loading,
    saving,
    setSaleType,
    setNetworkBotEnabled,
    connectMeta,
    connectWhatsapp,
    disconnectAccount,
  } = useMessagingChannels();

  // El SDK de Facebook se precarga: el click abre el diálogo sin demora.
  useEffect(() => {
    if (canManage) preloadFacebookSdk();
  }, [canManage]);

  if (loading) return <PageLoader message="Cargando canales de mensajería…" />;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-foreground">Canales de mensajería</h1>

      {/* Lo que falta para que el bot funcione: se dice acá y no se descubre
          con un chat que no contesta. */}
      {settings && !settings.ready && settings.issue && (
        <p className="flex items-start gap-2 rounded-lg bg-warning-soft px-4 py-3 text-sm text-warning-soft-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{settings.issue}</span>
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {channels.map((c) => (
          <ChannelCard
            key={c.network}
            channel={c}
            accounts={(settings?.accounts ?? []).filter((a) => a.network === c.network)}
            saleTypes={saleTypes}
            canManage={canManage}
            saving={saving}
            onSaleTypeChange={(id) => void setSaleType(c.network, id)}
            onBotEnabledChange={(enabled) => void setNetworkBotEnabled(c.network, enabled)}
            onConnect={() => void connectMeta()}
            onConnectWhatsapp={(mode) => void connectWhatsapp(mode)}
            onDisconnect={(account) => void disconnectAccount(account)}
          />
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-lg border bg-background p-4 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="flex flex-col gap-2 text-muted-foreground">
          <p>
            Con el bot activado en una red, atiende a los clientes a cualquier hora: responde consultas, muestra el
            catálogo con precios, promociones y stock, envía la guía de tallas, arma el pedido y registra el
            comprobante de pago. Cuando un asesor toma un chat, el bot deja de responder ahí.
          </p>
          <p>
            Las cuatro redes usan el mismo catálogo, precios y stock del canal del bot: no hace falta habilitar
            productos por red. Cada red solo indica a qué <strong className="font-medium text-foreground">canal de
            venta</strong> van sus órdenes: el Pedido que armas desde un chat lo toma de aquí, y Rendimiento y Costos
            por canal cuentan las ventas con eso.
          </p>
        </div>
      </div>
    </div>
  );
};

const accountLabel = (a: MessagingAccount) =>
  a.network === "instagram" && a.username ? `@${a.username}` : a.name || a.externalId;

const ChannelCard = ({
  channel,
  accounts,
  saleTypes,
  canManage,
  saving,
  onSaleTypeChange,
  onBotEnabledChange,
  onConnect,
  onConnectWhatsapp,
  onDisconnect,
}: {
  channel: MessagingChannel;
  accounts: MessagingAccount[];
  saleTypes: MessagingSaleType[];
  canManage: boolean;
  saving: boolean;
  onSaleTypeChange: (saleTypeId: number | null) => void;
  onBotEnabledChange: (enabled: boolean) => void;
  onConnect: () => void;
  onConnectWhatsapp: (mode: WhatsappConnectMode) => void;
  onDisconnect: (account: MessagingAccount) => void;
}) => {
  const connected = channel.status === "connected";
  const isMeta = META_NETWORKS.includes(channel.network);
  // Coexistencia por defecto: la mayoría de negocios ya atiende desde la app.
  const [usesBusinessApp, setUsesBusinessApp] = useState(true);

  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <ChannelIcon channel={channel.network} className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{CHANNEL_LABEL[channel.network]}</p>
            <Badge variant={connected ? "success" : "pending"} className="mt-0.5">
              {connected ? "Conectado" : "Sin conectar"}
            </Badge>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{WHAT_IT_DOES[channel.network]}</p>

        {/* El bot en esta red. Apagado, los mensajes llegan igual a Chats. */}
        <label className="flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm">
          <span className="flex min-w-0 items-start gap-2">
            <Bot className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0">
              <span className="block font-medium">Activar bot</span>
              <span className="block text-[11px] text-muted-foreground">
                {channel.botEnabled
                  ? "El bot responde los mensajes de esta red."
                  : "Los mensajes llegan a Chats y los responden los asesores."}
              </span>
            </span>
          </span>
          <Switch
            checked={channel.botEnabled}
            onCheckedChange={onBotEnabledChange}
            disabled={!canManage || saving}
            aria-label={`Activar el bot en ${CHANNEL_LABEL[channel.network]}`}
          />
        </label>

        {/* Páginas o cuentas de Instagram conectadas, con su baja. */}
        {accounts.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {accounts.map((a) => (
              <li key={a.externalId} className="flex min-w-0 items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm">
                <span className="min-w-0 flex-1 truncate font-medium">{accountLabel(a)}</span>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => onDisconnect(a)}
                    disabled={saving}
                    title={`Desconectar ${accountLabel(a)}`}
                  >
                    <Unlink className="mr-1 h-3.5 w-3.5" />
                    Desconectar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-1.5 rounded-md bg-muted px-3 py-2 text-sm">
          <p className="text-xs text-muted-foreground">Canal de venta de sus órdenes</p>
          {canManage ? (
            <Select
              value={channel.configured && channel.saleTypeId ? String(channel.saleTypeId) : AUTO}
              onValueChange={(v) => onSaleTypeChange(v === AUTO ? null : Number(v))}
              disabled={saving}
            >
              <SelectTrigger className="h-8 bg-background text-xs" aria-label={`Canal de venta de ${CHANNEL_LABEL[channel.network]}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AUTO}>
                  Automático{!channel.configured && channel.saleTypeName ? ` (${channel.saleTypeName})` : ""}
                </SelectItem>
                {saleTypes.map((st) => (
                  <SelectItem key={st.id} value={String(st.id)}>
                    {st.name.trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="font-medium">
              {channel.saleTypeName ?? "Sin canal de venta"}
              {!channel.configured && channel.saleTypeName && (
                <span className="font-normal text-muted-foreground"> (automático)</span>
              )}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            {!channel.saleTypeId
              ? "No hay canal de venta para esta red: elígelo, o crea uno en Ventas > Canales de venta."
              : channel.configured
                ? "El Pedido que armes desde estos chats usa este canal."
                : "Se deduce por el nombre del canal de venta. Elígelo para fijarlo."}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-1.5">
          {isMeta ? (
            // Un solo login de Meta conecta páginas y cuentas de Instagram:
            // las dos tarjetas abren el mismo diálogo.
            canManage ? (
              <>
                <Button variant={connected ? "outline" : "default"} onClick={onConnect} disabled={saving}>
                  <Link2 className="mr-2 h-4 w-4" />
                  {connected ? "Conectar otra cuenta" : "Conectar con Meta"}
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Inicia sesión con Meta y elige la página de Facebook y la cuenta de Instagram del negocio.
                </p>
              </>
            ) : (
              !connected && (
                <p className="text-[11px] text-muted-foreground">
                  Para conectarla hace falta el permiso "Configurar canales de mensajería".
                </p>
              )
            )
          ) : channel.network === "whatsapp" ? (
            // El número se conecta con Embedded Signup en la página del bot.
            canManage ? (
              <>
                <label className="flex items-start gap-2 text-[11px] text-muted-foreground">
                  <Checkbox
                    checked={usesBusinessApp}
                    onCheckedChange={(v) => setUsesBusinessApp(v === true)}
                    disabled={saving}
                    className="mt-px"
                  />
                  <span>Este número sigue usando la app WhatsApp Business</span>
                </label>
                <Button
                  variant={connected ? "outline" : "default"}
                  onClick={() => onConnectWhatsapp(usesBusinessApp ? "coexistence" : "cloud_api")}
                  disabled={saving}
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  {connected ? "Cambiar número" : "Conectar con Meta"}
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Inicia sesión con Meta y elige la cuenta de WhatsApp Business y el número del negocio.
                </p>
              </>
            ) : (
              !connected && (
                <p className="text-[11px] text-muted-foreground">
                  Para conectarlo hace falta el permiso "Configurar canales de mensajería".
                </p>
              )
            )
          ) : (
            <>
              <Button variant="outline" disabled title={CONNECT_NOTE[channel.network]}>
                <Link2 className="mr-2 h-4 w-4" />
                Conectar {CHANNEL_LABEL[channel.network]}
              </Button>
              <p className="text-[11px] text-muted-foreground">{CONNECT_NOTE[channel.network]}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MessagingChannelsPage;
