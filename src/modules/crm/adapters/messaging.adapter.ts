import type { MessagingSettings, MessagingSettingsApi } from "../types/messaging.types";

export const messagingSettingsAdapter = (row: MessagingSettingsApi): MessagingSettings => ({
  botEnabled: !!row.bot_enabled,
  configured: !!row.configured,
  channelExists: !!row.channel_exists,
  ready: !!row.ready,
  issue: row.issue ?? null,
  networks: (row.networks ?? []).map((n) => ({
    network: n.network,
    saleTypeId: n.sale_type_id ?? null,
    saleTypeName: n.sale_type_name?.trim() || null,
    configured: !!n.configured,
    // Sin el dato (backend anterior) vale el interruptor general del bot.
    botEnabled: n.bot_enabled ?? !!row.bot_enabled,
  })),
  accounts: (row.accounts ?? []).map((a) => ({
    network: a.network,
    externalId: a.external_id,
    name: a.name?.trim() || null,
    username: a.username?.trim() || null,
    connectedAt: a.connected_at,
  })),
});
