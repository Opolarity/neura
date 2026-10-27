// Acceso a datos del POS lateral. No inventa caminos: reutiliza los servicios
// de ventas y arma el mismo CreateOrderRequest que "Añadir venta", así una
// orden nacida en el chat es idéntica a una creada desde Ventas.
import { supabase } from "@/integrations/supabase/client";
import { getBusinessAccountIsActiveTrue, getPriceListIsActiveTrue } from "@/shared/services/service";
import {
  createOrder,
  fetchSaleProducts,
  fetchSalesFormData,
  fetchShippingCosts,
  getIdInventoryTypeApi,
  lookupDocument,
  searchClientByDocument,
  updatePaymentVoucherUrl,
  uploadPaymentVoucher,
} from "@/modules/sales/services";
import {
  adaptClientSearchResult,
  adaptPriceLists,
  adaptSalesFormData,
  adaptShippingCosts,
  getIdInventoryTypeAdapter,
} from "@/modules/sales/adapters";
import type { CreateOrderRequest } from "@/modules/sales/types";
import type {
  QuickOrderCatalogs,
  QuickOrderDraft,
  QuickOrderProduct,
  QuickOrderProductPage,
  QuickOrderTotals,
} from "../types/quickOrder.types";

// Los catálogos (listas, métodos, ubigeo, tarifas) no cambian mientras se
// atiende: se cargan una vez por sesión y se comparten entre chats.
let catalogsPromise: Promise<QuickOrderCatalogs> | null = null;

export const getQuickOrderCatalogsApi = (): Promise<QuickOrderCatalogs> => {
  if (!catalogsPromise) {
    catalogsPromise = (async () => {
      const [formData, activePriceLists, shippingCosts, inventoryType, accounts] = await Promise.all([
        fetchSalesFormData(),
        getPriceListIsActiveTrue(),
        fetchShippingCosts(),
        getIdInventoryTypeApi(),
        getBusinessAccountIsActiveTrue(),
      ]);
      const form = adaptSalesFormData(formData);
      return {
        documentTypes: form.documentTypes,
        saleTypes: form.saleTypes,
        // Como en Añadir venta: solo las listas activas.
        priceLists: adaptPriceLists(activePriceLists),
        paymentMethods: form.paymentMethods,
        paymentMethodSaleTypes: form.paymentMethodSaleTypes,
        situations: form.situations,
        countries: form.countries,
        states: form.states,
        cities: form.cities,
        neighborhoods: form.neighborhoods,
        shippingCosts: adaptShippingCosts(shippingCosts ?? []),
        businessAccounts: ((accounts ?? []) as Array<{ id: number; name: string }>).map((a) => ({
          id: a.id,
          name: a.name,
        })),
        stockTypeId: getIdInventoryTypeAdapter(inventoryType),
        stockTypes: (form.stockTypes ?? [])
          .filter((st) => st.is_active)
          .map((st) => ({ id: st.id, name: st.name })),
      };
    })().catch((error) => {
      // Un fallo no queda cacheado: el próximo intento vuelve a pedirlos.
      catalogsPromise = null;
      throw error;
    });
  }
  return catalogsPromise;
};

/** Productos por página en el buscador del panel. */
export const QUICK_ORDER_PAGE_SIZE = 12;

/** Productos con stock en el almacén del vendedor, una fila por variación. */
export const searchQuickOrderProductsApi = async (
  search: string,
  warehouseId: number,
  stockTypeId: number,
  page = 1
): Promise<QuickOrderProductPage> => {
  const response = await fetchSaleProducts({
    page,
    size: QUICK_ORDER_PAGE_SIZE,
    search: search.trim() || undefined,
    warehouseId,
    stockTypeId,
  });
  const rows: QuickOrderProduct[] = (response?.data ?? []).map((p) => ({
    productId: p.productId,
    productTitle: p.productTitle,
    variationId: p.variationId,
    sku: p.sku,
    imageUrl: p.imageUrl,
    stock: p.stock,
    terms: p.terms ?? [],
    prices: (p.prices ?? []).map((pr) => ({
      priceListId: pr.price_list_id,
      price: pr.price,
      salePrice: pr.sale_price,
    })),
  }));
  return { rows, total: response?.page?.total ?? rows.length };
};

export interface CustomerLookup {
  accountId: number | null;
  /** profiles."UID" de la cuenta, para las reglas de precio por cliente. */
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** De dónde salió: del ERP, de RENIEC/SUNAT, o no se encontró. */
  source: "erp" | "registry" | "none";
}

/**
 * Busca al cliente igual que Añadir venta: primero en el ERP por documento; si
 * no está y es DNI o RUC, en RENIEC/SUNAT para no tipear el nombre.
 */
export const findQuickOrderCustomerApi = async (
  documentTypeId: number,
  documentTypeCode: string | null,
  documentNumber: string
): Promise<CustomerLookup> => {
  const existing = adaptClientSearchResult(
    await searchClientByDocument(documentTypeId, documentNumber.trim())
  );
  if (existing) {
    // Igual que Añadir venta: el usuario de la cuenta (profiles."UID") habilita
    // las reglas por cliente.
    const { data: profile } = await supabase
      .from("profiles")
      .select("UID")
      .eq("account_id", existing.id)
      .maybeSingle();
    return {
      accountId: existing.id,
      userId: (profile?.UID as string | undefined) ?? null,
      firstName: existing.name ?? "",
      lastName: [existing.lastName, existing.lastName2].filter(Boolean).join(" "),
      email: existing.email ?? "",
      phone: existing.phone ?? "",
      source: "erp",
    };
  }

  const code = (documentTypeCode ?? "").toUpperCase();
  if (code === "DNI" || code === "RUC") {
    const found = (await lookupDocument(code, documentNumber.trim())) as {
      found?: boolean;
      nombres?: string;
      apellidoPaterno?: string;
      apellidoMaterno?: string;
      razonSocial?: string;
    } | null;
    if (found?.found) {
      return {
        accountId: null,
        userId: null,
        firstName: code === "RUC" ? found.razonSocial ?? "" : found.nombres ?? "",
        lastName:
          code === "RUC"
            ? ""
            : [found.apellidoPaterno, found.apellidoMaterno].filter(Boolean).join(" "),
        email: "",
        phone: "",
        source: "registry",
      };
    }
  }

  return { accountId: null, userId: null, firstName: "", lastName: "", email: "", phone: "", source: "none" };
};


/** Pagos o vueltos completos: método y monto mayor a cero. */
const validEntries = <T extends { paymentMethodId: number | null; amount: number | null }>(entries: T[]) =>
  entries.filter((e) => !!e.paymentMethodId && !!e.amount && e.amount > 0);

/**
 * Crea la orden con create-order —el mismo CreateOrderRequest que Añadir
 * venta— y después adjunta las capturas: las de los pagos a las filas
 * positivas de order_payment y las del vuelto a las negativas, en el orden en
 * que se insertaron (igual que useCreateSale).
 */
export const createQuickOrderApi = async (
  draft: QuickOrderDraft,
  totals: QuickOrderTotals,
  stockTypeId: number
): Promise<{ orderId: number; voucherWarning: string | null }> => {
  const c = draft.customer;
  const s = draft.shipping;
  const payments = draft.withPayment ? validEntries(draft.payments) : [];
  const changeEntries = draft.withPayment ? validEntries(draft.changeEntries) : [];

  // En personalizado create-order también recibe el shipping_methods.id de la
  // tarifa elegida (lo que Añadir venta guarda en shippingMethodId); la tarifa
  // sale del mismo catálogo cacheado que usa el panel.
  const shippingCost =
    draft.withShipping && s.shippingCostId
      ? (await getQuickOrderCatalogsApi()).shippingCosts.find((sc) => sc.id === s.shippingCostId) ?? null
      : null;

  const request: CreateOrderRequest & { shippingMethodId: string | null } = {
    documentType: String(c.documentTypeId ?? ""),
    documentNumber: c.documentNumber.trim(),
    customerName: c.firstName.trim(),
    customerLastname: c.lastName.trim(),
    customerLastname2: null,
    email: c.email.trim() || null,
    phone: c.phone.trim() || null,
    phoneWhatsapp: c.phone.trim() || null,
    saleType: String(draft.saleTypeId ?? ""),
    priceListId: draft.priceListId ? String(draft.priceListId) : null,
    shippingMethod: draft.withShipping && s.shippingCostId ? String(s.shippingCostId) : null,
    shippingMethodId: shippingCost?.shippingMethodId ? String(shippingCost.shippingMethodId) : null,
    shippingCost: draft.withShipping ? s.cost : null,
    countryId: draft.withShipping && s.countryId ? String(s.countryId) : null,
    stateId: draft.withShipping && s.stateId ? String(s.stateId) : null,
    cityId: draft.withShipping && s.cityId ? String(s.cityId) : null,
    neighborhoodId: draft.withShipping && s.neighborhoodId ? String(s.neighborhoodId) : null,
    address: draft.withShipping ? s.address.trim() || null : null,
    addressReference: draft.withShipping ? s.reference.trim() || null : null,
    receptionPerson: draft.withShipping ? s.receptionPerson.trim() || null : null,
    receptionPhone: draft.withShipping ? s.receptionPhone.trim() || null : null,
    withShipping: draft.withShipping,
    employeeSale: false,
    notes: draft.notes.trim() || null,
    subtotal: totals.subtotal,
    discount: totals.discount,
    total: totals.total,
    change: totals.change,
    isExistingClient: !!c.accountId,
    products: draft.lines.map((l) => ({
      variationId: l.variationId,
      quantity: l.quantity,
      price: l.price,
      discountAmount: l.discountAmount,
      stockTypeId: l.stockTypeId || stockTypeId,
    })),
    // create-order recorre payments con .map(): siempre un arreglo.
    payments: payments.map((p) => ({
      paymentMethodId: p.paymentMethodId!,
      amount: p.amount!,
      date: new Date().toISOString(),
      confirmationCode: p.operationCode.trim() || null,
      voucherUrls: null,
      businessAccountId: p.businessAccountId,
    })),
    changeEntries: changeEntries.map((e) => ({
      paymentMethodId: e.paymentMethodId!,
      amount: e.amount!,
      voucherUrls: null,
      businessAccountId: e.businessAccountId,
    })),
    initialSituationId: draft.situationId!,
    discounts: [
      ...draft.ruleDiscounts.map((d) => ({
        name: d.name,
        discount_amount: d.amount,
        code: d.code || "CUSTOM",
      })),
      ...draft.manualDiscounts.map((d) => ({
        name: d.name,
        discount_amount: d.amount,
        code: "CUSTOM",
      })),
    ],
  };

  const response = (await createOrder(request)) as { order?: { id?: number } } | null;
  const orderId = response?.order?.id;
  if (!orderId) throw new Error("La orden no devolvió su número. Revisa en Ventas antes de reintentar.");

  const hasFiles =
    payments.some((p) => p.vouchers.length > 0) || changeEntries.some((e) => e.vouchers.length > 0);
  if (!hasFiles) return { orderId, voucherWarning: null };

  let failed = 0;
  // Sube las capturas de una entrada y guarda sus URLs en su fila de pago.
  const uploadFor = async (files: File[], orderPaymentId: number) => {
    const urls: string[] = [];
    for (let k = 0; k < files.length; k++) {
      try {
        urls.push(await uploadPaymentVoucher(orderId, orderPaymentId, files[k], k));
      } catch (error) {
        console.error(error);
        failed++;
      }
    }
    if (urls.length) await updatePaymentVoucherUrl(orderPaymentId, urls);
  };

  try {
    const [{ data: positiveRows, error: posError }, { data: negativeRows, error: negError }] = await Promise.all([
      supabase.from("order_payment").select("id").eq("order_id", orderId).gte("amount", 0).order("id", { ascending: true }),
      supabase.from("order_payment").select("id").eq("order_id", orderId).lt("amount", 0).order("id", { ascending: true }),
    ]);
    if (posError) throw posError;
    if (negError) throw negError;

    for (let i = 0; i < payments.length; i++) {
      const row = positiveRows?.[i];
      if (row && payments[i].vouchers.length) await uploadFor(payments[i].vouchers, row.id as number);
      else if (payments[i].vouchers.length) failed += payments[i].vouchers.length;
    }
    for (let i = 0; i < changeEntries.length; i++) {
      const row = negativeRows?.[i];
      if (row && changeEntries[i].vouchers.length) await uploadFor(changeEntries[i].vouchers, row.id as number);
      else if (changeEntries[i].vouchers.length) failed += changeEntries[i].vouchers.length;
    }
  } catch (error) {
    console.error(error);
    failed = Math.max(failed, 1);
  }

  // La orden ya existe: no se revierte por una captura, se avisa.
  return {
    orderId,
    voucherWarning: failed
      ? "La orden se creó, pero algún comprobante no se pudo adjuntar. Súbelo desde Ventas."
      : null,
  };
};
