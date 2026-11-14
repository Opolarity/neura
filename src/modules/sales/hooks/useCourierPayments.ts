import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCourierPayments,
  getOlvaPaymentLink,
  markCourierGuidesPaid,
  unmarkCourierGuidesPaid,
} from "../services/CourierPayments.service";
import type { CourierCode } from "../types/Couriers.types";
import { toastError } from "@/shared/utils/toastError";
import { useToast } from "@/hooks/use-toast";

export const useCourierPayments = (
  courier: CourierCode | null,
  from: string | null,
  to: string | null,
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = ["courier-payments", courier, from, to];

  const query = useQuery({
    queryKey,
    queryFn: () => getCourierPayments(courier!, from!, to!),
    enabled: courier !== null && !!from && !!to,
    refetchOnWindowFocus: false,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["courier-payments", courier] });

  const mark = useMutation({
    mutationFn: (orderIds: number[]) => markCourierGuidesPaid(courier!, orderIds),
    onSuccess: ({ updated }) => {
      toast({ title: `${updated} guía(s) marcadas como pagadas`, variant: "success" });
      refresh();
    },
    onError: (error) => toastError(error, "No se pudo marcar como pagado"),
  });

  const unmark = useMutation({
    mutationFn: (orderIds: number[]) => unmarkCourierGuidesPaid(courier!, orderIds),
    onSuccess: ({ updated }) => {
      toast({ title: `${updated} guía(s) vuelven a pendiente` });
      refresh();
    },
    onError: (error) => toastError(error, "No se pudo desmarcar"),
  });

  const payLink = useMutation({
    mutationFn: getOlvaPaymentLink,
    onSuccess: (url) => window.open(url, "_blank", "noopener"),
    onError: (error) => toastError(error, "No se pudo obtener el link de pago"),
  });

  return {
    data: query.data ?? null,
    isLoading: query.isFetching,
    error: query.error,
    refetch: () => query.refetch(),
    markPaid: mark.mutate,
    isMarking: mark.isPending,
    unmarkPaid: unmark.mutate,
    isUnmarking: unmark.isPending,
    openPaymentLink: payLink.mutate,
    payingOrderId: payLink.isPending ? payLink.variables ?? null : null,
  };
};
