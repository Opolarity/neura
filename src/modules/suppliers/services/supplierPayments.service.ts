import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { buildEndpoint } from "@/shared/utils/query";
import {
  AddSupplierPaymentPayload,
  AddSupplierPaymentsBulkPayload,
  SupplierPaymentsApiResponse,
  SupplierPaymentsFilters,
} from "../types/supplierPayments.types";

export const getSupplierPaymentsApi = async (
  filters: SupplierPaymentsFilters = {},
): Promise<SupplierPaymentsApiResponse> => {
  const endpoint = buildEndpoint("get-supplier-payments", filters);

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;

  return (
    data ?? {
      paymentsdata: {
        data: [],
        page: { page: 1, size: 20, total: 0 },
        totals: { payable: 0, paid: 0, balance: 0 },
      },
    }
  );
};

/**
 * Registra un pago.
 *
 * Toda la validación vive en el SP —que el servicio sea de esa cotización, que
 * haya saldo, que no se pague de más—, así que aquí no se comprueba nada: la
 * pantalla enseña el saldo para que no se llegue a ese punto, pero la que
 * manda es la base.
 */
export const addSupplierPaymentApi = async (
  payload: AddSupplierPaymentPayload,
): Promise<void> => {
  await invokeFunction("add-supplier-payment", {
    body: {
      supplier_quotation_id: payload.supplierQuotationId,
      supplier_service_id: payload.supplierServiceId,
      amount: payload.amount,
      payment_method_id: payload.paymentMethodId,
      business_account_id: payload.businessAccountId,
      date: payload.date ?? null,
      description: payload.description ?? null,
      voucher_url: payload.voucherUrl ?? null,
    },
  });
};

/**
 * Salda varios servicios de una vez.
 *
 * Es UNA llamada, no un bucle de llamadas sueltas: el SP las mete en la misma
 * transacción, así que o entran todos los pagos o no entra ninguno. Un bucle
 * aquí podría dejar tres hechos y tres no, y a nadie mirando la pantalla que
 * sepa cuál de las dos cosas pasó.
 */
export const addSupplierPaymentsBulkApi = async (
  payload: AddSupplierPaymentsBulkPayload,
): Promise<void> => {
  await invokeFunction("add-supplier-payments-bulk", {
    body: {
      payments: payload.payments.map((p) => ({
        supplier_quotation_id: p.supplierQuotationId,
        supplier_service_id: p.supplierServiceId,
        amount: p.amount,
        voucher_url: payload.voucherUrl ?? null,
      })),
      payment_method_id: payload.paymentMethodId,
      business_account_id: payload.businessAccountId,
      date: payload.date ?? null,
      description: payload.description ?? null,
    },
  });
};

/**
 * Sube el comprobante de un pago y devuelve su url pública.
 *
 * Al bucket `sales`, junto a los comprobantes de venta: es el mismo tipo de
 * papel --la constancia de que el dinero se movió-- y repartirlos entre dos
 * sitios solo daría dos sitios donde buscarlos.
 *
 * Se sube ANTES de registrar el pago, porque el pago necesita la url. Si el
 * pago falla después, el fichero se queda huérfano en el storage: es el mismo
 * trato que en ventas, y es preferible al contrario --un pago registrado sin
 * su comprobante es un agujero en la contabilidad; un fichero de más, no.
 */
export const uploadSupplierPaymentVoucherApi = async (
  supplierQuotationId: number,
  file: File,
): Promise<string> => {
  const extension = file.name.split(".").pop() || "jpg";
  const path = `supplier-vouchers/${supplierQuotationId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from("sales")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("sales").getPublicUrl(path);

  return publicUrl;
};
