import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import type {
  ScheduleTrainingPayload,
  TrainingBookingApi,
  TrainingBookingsApiResponse,
  TrainingFilters,
  TrainingHostApi,
  TrainingSlotsApiResponse,
} from "../types/Training.types";

/**
 * Mismo contrato que soporte: los errores de negocio llegan como 200 +
 * {error, error_code} y los de infraestructura con status != 2xx. Los dos los
 * resuelve `invokeFunction`, que preserva el `error_code` — de ahi salen los
 * `code === "slot_taken"` que miran los dialogos.
 */
const NETWORK_MESSAGE =
  "No se pudo conectar con el servicio de capacitaciones. Revisa tu conexión e intenta nuevamente.";

/** Envoltura comun de la API externa: el payload util viaja dentro de `data`. */
interface TrainingEnvelope<T> {
  data?: T;
}

export const getTrainingHosts = async (): Promise<TrainingHostApi[]> => {
  const data = await invokeFunction<TrainingEnvelope<{ items?: TrainingHostApi[] }>>(
    "get-training-hosts",
    { method: "POST", body: {}, networkMessage: NETWORK_MESSAGE },
  );

  return Array.isArray(data?.data?.items) ? data.data.items : [];
};

/**
 * Los horarios se piden en vivo cada vez. Cachearlos es exactamente la ventana
 * en la que el capacitador acepta otra reunión desde Outlook y el usuario
 * reserva encima.
 *
 * `excludeBookingId` no viaja: al reprogramar, OPOLARITY ya excluye la propia
 * reunión de la rejilla, así que su hueco actual reaparece como libre.
 */
export const getTrainingSlots = async (
  slug: string,
): Promise<TrainingSlotsApiResponse> => {
  const data = await invokeFunction<TrainingEnvelope<TrainingSlotsApiResponse>>(
    "get-training-slots",
    { method: "POST", body: { slug }, networkMessage: NETWORK_MESSAGE },
  );

  return {
    timezone: data?.data?.timezone ?? "America/Lima",
    duration_minutes: Number(data?.data?.duration_minutes ?? 30),
    slots: Array.isArray(data?.data?.slots) ? data.data.slots : [],
  };
};

export const getTrainingBookings = async (
  filters: TrainingFilters,
): Promise<TrainingBookingsApiResponse> =>
  invokeFunction<TrainingBookingsApiResponse>("get-training-bookings", {
    method: "POST",
    networkMessage: NETWORK_MESSAGE,
    body: { scope: filters.scope, page: filters.page, page_size: filters.size },
  });

export const createTrainingBooking = async (
  payload: ScheduleTrainingPayload,
): Promise<TrainingBookingApi> => {
  const data = await invokeFunction<TrainingEnvelope<TrainingBookingApi>>(
    "create-training-booking",
    {
      method: "POST",
      networkMessage: NETWORK_MESSAGE,
      body: {
        slug: payload.slug,
        start: payload.start,
        invitee_name: payload.inviteeName,
        invitee_phone: payload.inviteePhone || undefined,
        // La zona del navegador solo se guarda como referencia: los instantes
        // viajan siempre en UTC.
        invitee_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notes: payload.notes || undefined,
      },
    },
  );

  return data.data as TrainingBookingApi;
};

export const cancelTrainingBooking = async (
  bookingId: string,
  reason?: string,
): Promise<TrainingBookingApi> => {
  const data = await invokeFunction<TrainingEnvelope<TrainingBookingApi>>(
    "cancel-training-booking",
    {
      method: "POST",
      networkMessage: NETWORK_MESSAGE,
      body: { booking_id: bookingId, reason: reason || undefined },
    },
  );

  return data.data as TrainingBookingApi;
};

export const rescheduleTrainingBooking = async (
  bookingId: string,
  start: string,
): Promise<TrainingBookingApi> => {
  const data = await invokeFunction<TrainingEnvelope<TrainingBookingApi>>(
    "reschedule-training-booking",
    {
      method: "POST",
      networkMessage: NETWORK_MESSAGE,
      body: { booking_id: bookingId, start },
    },
  );

  return data.data as TrainingBookingApi;
};
