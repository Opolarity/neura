import type { FunctionErrorCode as EdgeFunctionErrorCode } from "@/shared/utils/functionError";

export type { EdgeFunctionErrorCode as TrainingErrorCode };
export { FunctionError as TrainingServiceError } from "@/shared/utils/functionError";

/* ------------------------------------------------------------------ *
 * API (snake_case, crudo tal como lo devuelve la edge function)
 * ------------------------------------------------------------------ */

/** Capacitador disponible. `slug` es lo que identifica su agenda. */
export interface TrainingHostApi {
  slug: string;
  host_name: string | null;
  host_job_title: string | null;
  host_avatar_url: string | null;
  title: string | null;
  description: string | null;
  timezone: string;
  duration_minutes: number;
  max_advance_days: number;
  min_notice_minutes: number;
  /** false = cuenta personal de Microsoft: la reunión no traerá enlace. */
  has_teams: boolean;
}

export interface TrainingSlotApi {
  /** Instante UTC ISO-8601. Nunca se convierte a mano, solo se formatea. */
  start: string;
  end: string;
}

export interface TrainingSlotsApiResponse {
  timezone: string;
  duration_minutes: number;
  slots: TrainingSlotApi[];
}

/**
 * Estados que devuelve la API. Solo llegan estos dos: las reservas a medio
 * crear no se listan nunca.
 */
export type TrainingStatus = "confirmed" | "cancelled";

export interface TrainingBookingApi {
  id: string;
  status: string | null;
  title: string | null;
  host_name: string | null;
  host_job_title: string | null;
  host_slug: string | null;
  starts_at: string;
  ends_at: string;
  host_timezone: string | null;
  invitee_name: string | null;
  invitee_email: string | null;
  notes: string | null;
  /** Enlace de Teams. Vacío si el capacitador usa una cuenta personal. */
  meeting_url: string | null;
  cancel_reason: string | null;
  created_at: string;
}

export interface TrainingBookingsApiResponse {
  data: TrainingBookingApi[];
  page: {
    current: number;
    size: number;
    total: number;
    total_pages: number;
  };
}

/* ------------------------------------------------------------------ *
 * Vista (camelCase, lo que consumen los componentes)
 * ------------------------------------------------------------------ */

export interface TrainingHost {
  slug: string;
  hostName: string;
  hostJobTitle: string | null;
  title: string;
  description: string | null;
  timezone: string;
  durationMinutes: number;
  minNoticeMinutes: number;
  hasTeams: boolean;
}

export interface TrainingBooking {
  id: string;
  status: TrainingStatus | null;
  title: string;
  hostName: string;
  hostJobTitle: string | null;
  hostSlug: string | null;
  startsAt: string;
  endsAt: string;
  inviteeName: string | null;
  notes: string | null;
  meetingUrl: string | null;
  cancelReason: string | null;
  /** Ya terminó: sirve para no ofrecer cancelar ni reprogramar. */
  isPast: boolean;
}

/** Pestañas del listado. Coinciden con el `scope` de la API. */
export type TrainingScope = "upcoming" | "past" | "cancelled";

export interface TrainingFilters {
  page: number;
  size: number;
  scope: TrainingScope;
}

export interface ScheduleTrainingPayload {
  slug: string;
  /** Uno de los `start` que devolvió la API, exacto. */
  start: string;
  inviteeName: string;
  /** Celular del solicitante, ya normalizado. Opcional: no todos lo tienen. */
  inviteePhone?: string;
  notes?: string;
}

export const MAX_NOTES_LENGTH = 2000;
