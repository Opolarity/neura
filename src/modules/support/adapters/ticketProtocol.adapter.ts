import type { TicketProtocol, TicketProtocolApiResponse } from "../types/Support.types";

export const adaptTicketProtocol = (raw: TicketProtocolApiResponse): TicketProtocol => ({
  title: raw.title,
  subtitle: raw.subtitle ?? null,
  html: raw.content_html ?? "",
  version: Number(raw.version ?? 0),
  updatedAt: raw.updated_at ?? null,
});
