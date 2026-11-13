import { useMutation, useQuery } from "@tanstack/react-query";
import {
  applyCourierQuote,
  cancelCourierShipment,
  createCourierShipment,
  getCourierLabel,
  refreshCourierTracking,
  removeCourierShipment,
} from "../services/Couriers.service";
import type { CourierQuoteOption, CourierShipment, FreightPayer } from "../types/Couriers.types";
import type { OrderCourier } from "../adapters/Couriers.adapter";
import { toastError } from "@/shared/utils/toastError";
import { useToast } from "@/hooks/use-toast";
import { useOrderCourier } from "./useOrderCourier";

/** Abre el PDF del courier en una pestaña nueva. */
const openPdf = (base64: string, fileName: string) => {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const win = window.open(url, "_blank");
  if (!win) {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

export const useCourierShipment = (orderId: number | null) => {
  const { toast } = useToast();
  const { query, setOrderCourier, queryClient } = useOrderCourier(orderId);
  // Antes de la guía, quién paga el flete es una elección del formulario (no se
  // guarda); con guía, manda lo que diga el courier. Vive en la caché para que
  // la sección y el rótulo de la venta vean la misma elección.
  const freightKey = ["courier-freight-choice", orderId];
  const { data: freightChoice = "store" } = useQuery<FreightPayer>({
    queryKey: freightKey,
    queryFn: () => "store",
    staleTime: Infinity,
    enabled: orderId != null,
  });
  const setFreightChoice = (payer: FreightPayer) => queryClient.setQueryData(freightKey, payer);

  const raw = query.data?.shipment ?? null;
  const shipment: CourierShipment | null = raw
    ? { ...raw, freightPayer: raw.trackingNumber ? raw.freightPayer : freightChoice }
    : null;

  const keepCod = (data: OrderCourier): OrderCourier => ({
    ...data,
    cashOnDelivery: query.data?.cashOnDelivery ?? data.cashOnDelivery,
  });

  const apply = useMutation({
    mutationFn: (option: CourierQuoteOption) => applyCourierQuote(orderId!, option),
    onSuccess: (data) => setOrderCourier(keepCod(data)),
    onError: (error) => toastError(error, "No se pudo aplicar el envío"),
  });

  const create = useMutation({
    mutationFn: (pickupKey: string | null) => createCourierShipment(orderId!, pickupKey, freightChoice),
    onSuccess: ({ label, ...data }) => {
      setOrderCourier(keepCod(data));
      const number = data.shipment?.trackingNumber;
      toast({ title: number ? `Guía ${number} generada` : "Guía generada", variant: "success" });
      if (label && number) openPdf(label, `rotulo-${number}.pdf`);
    },
    onError: (error) => toastError(error, "No se pudo generar la guía"),
  });

  const refresh = useMutation({
    mutationFn: () => refreshCourierTracking(orderId!),
    onSuccess: (data) => setOrderCourier(keepCod(data)),
    onError: (error) => toastError(error, "No se pudo actualizar el estado"),
  });

  const label = useMutation({
    mutationFn: () => getCourierLabel(orderId!),
    onSuccess: ({ base64, fileName }) => openPdf(base64, fileName),
    onError: (error) => toastError(error, "No se pudo descargar el rótulo"),
  });

  const cancel = useMutation({
    mutationFn: () => cancelCourierShipment(orderId!),
    onSuccess: (data) => {
      setOrderCourier(keepCod(data));
      toast({ title: "Guía anulada en Shalom", variant: "success" });
    },
    onError: (error) => toastError(error, "No se pudo anular la guía"),
  });

  const remove = useMutation({
    mutationFn: () => removeCourierShipment(orderId!),
    onSuccess: (data) => setOrderCourier(keepCod(data)),
    onError: (error) => toastError(error, "No se pudo quitar el envío"),
  });

  return {
    shipment,
    isLoading: query.isLoading,
    applyQuote: apply.mutateAsync,
    createShipment: (pickupKey: string | null) => create.mutate(pickupKey),
    isCreating: create.isPending,
    refreshTracking: () => refresh.mutate(),
    isRefreshing: refresh.isPending,
    downloadLabel: () => label.mutate(),
    isDownloadingLabel: label.isPending,
    cancelShipment: () => cancel.mutate(),
    isCancelling: cancel.isPending,
    removeShipment: () => remove.mutate(),
    isRemoving: remove.isPending,
    setFreightPayer: setFreightChoice,
  };
};
