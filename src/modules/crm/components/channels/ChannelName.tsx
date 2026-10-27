import { CHANNEL_COLOR, CHANNEL_LABEL } from "../../utils/channels";
import type { ConversationChannel } from "../../types/crm.types";
import { ChannelIcon } from "../ChannelIcon";

/**
 * Nombre de la red con su ícono y el punto del color que tiene en el gráfico:
 * así la fila de la tabla y la barra se reconocen como el mismo canal.
 */
export const ChannelName = ({ code }: { code: ConversationChannel }) => (
  <span className="flex items-center gap-1.5 font-medium">
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: CHANNEL_COLOR[code] }}
      aria-hidden="true"
    />
    <ChannelIcon channel={code} className="h-3.5 w-3.5" />
    {CHANNEL_LABEL[code]}
  </span>
);
