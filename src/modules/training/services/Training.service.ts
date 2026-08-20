import { supabase } from "@/integrations/supabase/client";
import { throwEdgeFunctionError } from "@/shared/services/edgeFunctionError";
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
 * {error, error_code} y los de infraestructura con status != 2xx.
 */
const throwTrainingFunctionError = (error: unknown): Promise<never> =>
  throwEdgeFunctionError(
    error,
    "No se pudo conectar con el servicio de capacitaciones. Revisa tu conexión e intenta nuevamente.",
  );

export const getTrainingHosts = async (): Promise<TrainingHostApi[]> => {
  const { data, error } = await supabase.functions.invoke("get-training-hosts", {
    method: "POST",
    body: {},
  });
  if (error) await throwTrainingFunctionError(error);
  if (data?.error) await throwTrainingFunctionError({ context: null, message: data.error });

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
  const { data, error } = await supabase.functions.invoke("get-training-slots", {
    method: "POST",
    body: { slug },
  });
  if (error) await throwTrainingFunctionError(error);
  if (data?.error) await throwTrainingFunctionError({ context: null, message: data.error });

  return {
    timezone: data?.data?.timezone ?? "America/Lima",
    duration_minutes: Number(data?.data?.duration_minutes ?? 30),
    slots: Array.isArray(data?.data?.slots) ? data.data.slots : [],
  };
};

export const getTrainingBookings = async (
  filters: TrainingFilters,
): Promise<TrainingBookingsApiResponse> => {
  const { data, error } = await supabase.functions.invoke("get-training-bookings", {
    method: "POST",
    body: { scope: filters.scope, page: filters.page, page_size: filters.size },
  });
  if (error) await throwTrainingFunctionError(error);
  if (data?.error) await throwTrainingFunctionError({ context: null, message: data.error });

  return data as TrainingBookingsApiResponse;
};

export const createTrainingBooking = async (
  payload: ScheduleTrainingPayload,
): Promise<TrainingBookingApi> => {
  const { data, error } = await supabase.functions.invoke("create-training-booking", {
    method: "POST",
    body: {
      slug: payload.slug,
      start: payload.start,
      invitee_name: payload.inviteeName,
      // La zona del navegador solo se guarda como referencia: los instantes
      // viajan siempre en UTC.
      invitee_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notes: payload.notes || undefined,
    },
  });
  if (error) await throwTrainingFunctionError(error);
  if (data?.error) await throwTrainingFunctionError({ context: null, message: data.error });

  return data.data as TrainingBookingApi;
};

export const cancelTrainingBooking = async (
  bookingId: string,
  reason?: string,
): Promise<TrainingBookingApi> => {
  const { data, error } = await supabase.functions.invoke("cancel-training-booking", {
    method: "POST",
    body: { booking_id: bookingId, reason: reason || undefined },
  });
  if (error) await throwTrainingFunctionError(error);
  if (data?.error) await throwTrainingFunctionError({ context: null, message: data.error });

  return data.data as TrainingBookingApi;
};

export const rescheduleTrainingBooking = async (
  bookingId: string,
  start: string,
): Promise<TrainingBookingApi> => {
  const { data, error } = await supabase.functions.invoke("reschedule-training-booking", {
    method: "POST",
    body: { booking_id: bookingId, start },
  });
  if (error) await throwTrainingFunctionError(error);
  if (data?.error) await throwTrainingFunctionError({ context: null, message: data.error });

  return data.data as TrainingBookingApi;
};
