import type { BotPauseApi, BotPauseState } from "../types/crm.types";

export const NO_PAUSE: BotPauseState = {
  paused: false,
  until: null,
  indefinite: false,
  reason: null,
  pausedBy: null,
};

export const botPauseAdapter = (api: BotPauseApi | null | undefined): BotPauseState =>
  api
    ? {
        paused: !!api.paused,
        until: api.until ?? null,
        indefinite: !!api.indefinite,
        reason: api.reason ?? null,
        pausedBy: api.paused_by ?? null,
      }
    : NO_PAUSE;
