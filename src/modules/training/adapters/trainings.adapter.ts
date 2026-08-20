import type { PaginationState } from "@/shared/components/pagination/Pagination";
import type {
  TrainingBooking,
  TrainingBookingApi,
  TrainingBookingsApiResponse,
  TrainingHost,
  TrainingHostApi,
  TrainingStatus,
} from "../types/Training.types";

/**
 * `status` llega como string abierto: hoy solo son 'confirmed' y 'cancelled',
 * pero se normaliza en vez de castear para que un valor nuevo caiga en null y
 * el badge lo trate como desconocido, en lugar de mentir.
 */
const toStatus = (value: string | null): TrainingStatus | null =>
  value === "confirmed" || value === "cancelled" ? value : null;

export const adaptTrainingHost = (api: TrainingHostApi): TrainingHost => ({
  slug: api.slug,
  hostName: api.host_name?.trim() || "Equipo OPOLARITY",
  hostJobTitle: api.host_job_title?.trim() || null,
  title: api.title?.trim() || "Capacitación",
  description: api.description?.trim() || null,
  timezone: api.timezone,
  durationMinutes: api.duration_minutes,
  minNoticeMinutes: api.min_notice_minutes,
  hasTeams: api.has_teams,
});

export const adaptTrainingBooking = (api: TrainingBookingApi): TrainingBooking => ({
  id: api.id,
  status: toStatus(api.status),
  title: api.title?.trim() || "Capacitación",
  hostName: api.host_name?.trim() || "Equipo OPOLARITY",
  hostJobTitle: api.host_job_title?.trim() || null,
  hostSlug: api.host_slug,
  startsAt: api.starts_at,
  endsAt: api.ends_at,
  inviteeName: api.invitee_name,
  notes: api.notes,
  meetingUrl: api.meeting_url?.trim() || null,
  cancelReason: api.cancel_reason,
  isPast: Date.parse(api.ends_at) < Date.now(),
});

export const adaptTrainingBookingsResponse = (
  response: TrainingBookingsApiResponse,
): { bookings: TrainingBooking[]; pagination: PaginationState } => ({
  bookings: (response.data ?? []).map(adaptTrainingBooking),
  pagination: {
    p_page: response.page?.current ?? 1,
    p_size: response.page?.size ?? 20,
    total: response.page?.total ?? 0,
  },
});
