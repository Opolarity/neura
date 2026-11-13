import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  connectShalomPro,
  disconnectShalomPro,
  getCourierSettings,
} from "../services/Couriers.service";
import type { CourierSettings } from "../types/Couriers.types";
import { toastError } from "@/shared/utils/toastError";
import { useToast } from "@/hooks/use-toast";

export const COURIER_SETTINGS_KEY = ["courier-settings"];

/**
 * Olva y Shalom son métodos de envío (OWN-OLVA / OWN-SHALOM): activos = su
 * método existe. Se configuran en el formulario del método; aquí solo se leen
 * y se conecta la cuenta Shalom Pro.
 */
export const useCourierSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const settingsQuery = useQuery({
    queryKey: COURIER_SETTINGS_KEY,
    queryFn: getCourierSettings,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: COURIER_SETTINGS_KEY });

  const connect = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      connectShalomPro(username, password),
    onSuccess: () => {
      refresh();
      toast({ title: "Shalom Pro conectado", variant: "success" });
    },
    onError: (error) => toastError(error, "No se pudo conectar Shalom Pro"),
  });

  const disconnect = useMutation({
    mutationFn: disconnectShalomPro,
    onSuccess: refresh,
    onError: (error) => toastError(error, "No se pudo desconectar Shalom Pro"),
  });

  return {
    settings: settingsQuery.data ?? ([] as CourierSettings[]),
    isLoading: settingsQuery.isLoading,
    connectShalom: connect.mutateAsync,
    isConnecting: connect.isPending,
    disconnectShalom: disconnect.mutate,
  };
};
