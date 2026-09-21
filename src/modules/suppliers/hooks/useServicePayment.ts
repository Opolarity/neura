import { useCallback, useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { getPaymentMethodsIsActiveTrueAndActiveTrue } from "@/shared/services/service";
import { errorMessageOf } from "@/shared/utils/functionError";
import { supplierPaymentsAdapter } from "../adapters/supplierPayments.adapter";
import {
  addSupplierPaymentApi,
  getSupplierPaymentsApi,
} from "../services/supplierPayments.service";
import {
  AddSupplierPaymentPayload,
  SupplierPaymentRow,
} from "../types/supplierPayments.types";
import { PaymentMethodOption } from "./useSupplierPayments";

/**
 * Pagar UN servicio desde donde se esté, sin ir a la pantalla de pagos.
 *
 * Lo que se debe no se calcula aquí: se le pregunta al backend por ese
 * servicio (`service_id`), que es el único que sabe si ya llegó a recepción y
 * cuánto se le ha abonado —incluida su parte de los pagos hechos a la
 * cotización entera—. Adivinarlo desde la fila del plan daría otro número.
 */
export const useServicePayment = () => {
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [row, setRow] = useState<SupplierPaymentRow | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
  const [saving, setSaving] = useState(false);

  // Los métodos no dependen del servicio: se piden una vez y se quedan.
  useEffect(() => {
    getPaymentMethodsIsActiveTrueAndActiveTrue()
      .then((methods) =>
        setPaymentMethods(
          (methods ?? []).map((method) => ({
            id: method.id,
            name: method.name ?? "",
            businessAccountId: method.business_account_id ?? null,
            businessAccountName: method.business_accounts?.name ?? null,
          })),
        ),
      )
      .catch(console.error);
  }, []);

  const cargar = useCallback(async (id: number) => {
    try {
      const response = await getSupplierPaymentsApi({ service_id: id, size: 1 });
      const adapted = supplierPaymentsAdapter(response);
      const encontrado = adapted.data[0] ?? null;

      if (!encontrado) {
        // Sin fila no es un fallo: es que el servicio todavía no se ha
        // recibido, y hasta entonces no hay nada que pagar.
        toast({
          title: "Todavía no hay nada que pagar",
          description:
            "El trabajo no ha llegado a recepción, así que aún no es deuda exigible.",
        });
        setServiceId(null);
        return;
      }

      setRow(encontrado);
    } catch (error) {
      console.error("Error loading service payment:", error);
      toast({
        title: "No se pudo consultar el saldo del servicio",
        description: errorMessageOf(error),
        variant: "destructive",
      });
      setServiceId(null);
    }
  }, []);

  const open = (id: number) => {
    setServiceId(id);
    setRow(null);
    void cargar(id);
  };

  const close = () => {
    setServiceId(null);
    setRow(null);
  };

  const submit = async (payload: AddSupplierPaymentPayload) => {
    setSaving(true);
    try {
      await addSupplierPaymentApi(payload);
      toast({ title: "Pago registrado" });
      close();
    } catch (error) {
      console.error("Error adding supplier payment:", error);
      toast({
        title: "No se pudo registrar el pago",
        description: errorMessageOf(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return { serviceId, row, paymentMethods, saving, open, close, submit };
};
