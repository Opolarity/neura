import { useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { errorMessageOf } from "@/shared/utils/functionError";
import { getPaymentMethodsIsActiveTrueAndActiveTrue } from "@/shared/services/service";
import { PaymentMethodOption } from "@/modules/suppliers/hooks/useSupplierPayments";
import {
  addSupplierPaymentApi,
  uploadSupplierPaymentVoucherApi,
} from "@/modules/suppliers/services/supplierPayments.service";
import {
  AddSupplierPaymentPayload,
  SupplierPaymentRow,
} from "@/modules/suppliers/types/supplierPayments.types";
import { fetchQuotationByIdServices } from "../services/Quotations.service";
import { QuotationServiceApi } from "../types/Quotations.types";

interface QuotationRef {
  id: number;
  code: string | null;
  subject: string;
  supplierId: number;
  supplierName: string;
}

/** Todas las líneas de servicio de una vez: no se paga por páginas. */
const ALL_SERVICES = 500;

const toNumber = (value: number | string | null | undefined) => Number(value ?? 0) || 0;

/** Un servicio de la cotización con su deuda → la fila que entiende el diálogo de pago. */
const toPaymentRow = (service: QuotationServiceApi, quotation: QuotationRef): SupplierPaymentRow => {
  const payable = toNumber(service.payable);
  const paid = toNumber(service.paid);
  const balance = toNumber(service.pending);
  return {
    serviceId: service.id,
    serviceCode: service.code ?? "",
    serviceDescription: service.description ?? "",
    quotationId: quotation.id,
    quotationCode: quotation.code ?? "",
    quotationDescription: quotation.subject,
    supplierId: quotation.supplierId,
    supplierName: quotation.supplierName,
    payable,
    paid,
    balance,
    status: paid <= 0 ? "PENDING" : balance > 0 ? "PARTIAL" : "PAID",
  };
};

/**
 * Pagar desde la cotización, eligiendo a qué servicio va el pago.
 *
 * Se ofrecen solo los servicios con algo pendiente, y el importe arranca en lo
 * pendiente del elegido. El saldo lo valida el SP (sp_add_supplier_payment),
 * igual que en «Pagos a proveedores».
 */
export const useQuotationPayment = (quotation: QuotationRef | null, onPaid?: () => void) => {
  const [choices, setChoices] = useState<SupplierPaymentRow[]>([]);
  const [target, setTarget] = useState<SupplierPaymentRow | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
  const [opening, setOpening] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const open = async () => {
    if (!quotation) return;
    try {
      setOpening(true);
      const response = await fetchQuotationByIdServices({
        id: quotation.id,
        search: null,
        page: 1,
        size: ALL_SERVICES,
        kind: "SERVICE",
      });
      const pendientes = response.data
        .map((service) => toPaymentRow(service, quotation))
        .filter((row) => row.balance > 0);
      if (pendientes.length === 0) {
        toast({
          title: "No hay nada pendiente de pago",
          description: "Un servicio se debe cuando se recibe.",
        });
        return;
      }
      setChoices(pendientes);
      setTarget(pendientes[0]);
    } catch (error) {
      toast({
        title: "No se pudo consultar lo pendiente",
        description: errorMessageOf(error),
        variant: "destructive",
      });
    } finally {
      setOpening(false);
    }
  };

  const choose = (serviceId: number) =>
    setTarget(choices.find((row) => row.serviceId === serviceId) ?? null);

  const close = () => {
    setTarget(null);
    setChoices([]);
  };

  const submit = async (payload: AddSupplierPaymentPayload, voucher: File | null) => {
    setSaving(true);
    try {
      const voucherUrl = voucher
        ? await uploadSupplierPaymentVoucherApi(payload.supplierQuotationId, voucher)
        : null;
      await addSupplierPaymentApi({ ...payload, voucherUrl });
      toast({ title: "Pago registrado", variant: "success" });
      close();
      onPaid?.();
    } catch (error) {
      toast({
        title: "No se pudo registrar el pago",
        description: errorMessageOf(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return { choices, target, paymentMethods, opening, saving, open, choose, close, submit };
};
