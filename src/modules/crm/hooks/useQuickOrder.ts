import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth, useUserProfile } from "@/modules/auth";
import { applyPriceRules } from "@/modules/sales/rules/applyPriceRules";
import { filterShippingCostsByLocation } from "@/modules/sales/utils";
import { formatCurrency } from "@/shared/utils/currency";
import { toastError } from "@/shared/utils/toastError";
import { sendMessageApi } from "../services/crm.service";
import {
  createQuickOrderApi,
  findQuickOrderCustomerApi,
  getQuickOrderCatalogsApi,
  searchQuickOrderProductsApi,
  type CustomerLookup,
} from "../services/quickOrder.service";
import type { Conversation } from "../types/crm.types";
import type {
  QuickOrderCatalogs,
  QuickOrderChange,
  QuickOrderDraft,
  QuickOrderLine,
  QuickOrderPayment,
  QuickOrderProduct,
  QuickOrderResult,
  QuickOrderTotals,
} from "../types/quickOrder.types";

// Última lista de precios y canal elegidos: el vendedor casi siempre vende con
// los mismos, y elegirlos en cada pedido es justo la fricción que se quiere sacar.
const PREFS_KEY = "crm.quickOrder.prefs";

const readPrefs = (): { priceListId?: number; saleTypeId?: number } => {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
  } catch {
    return {};
  }
};

const writePrefs = (prefs: { priceListId: number | null; saleTypeId: number | null }) => {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Sin almacenamiento (modo privado): se elige de nuevo la próxima vez.
  }
};

/** El teléfono del chat viene con código de país (51987654321); ventas lo guarda local. */
const localPhone = (phone: number | null): string => {
  if (!phone) return "";
  const raw = String(phone);
  return raw.length === 11 && raw.startsWith("51") ? raw.slice(2) : raw;
};

/** Etapa inicial por defecto: la primera que reserva stock sin descontarlo (-VIR). */
const defaultSituationId = (catalogs: QuickOrderCatalogs): number | null => {
  const sorted = [...catalogs.situations].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return (sorted.find((s) => s.code?.endsWith("-VIR")) ?? sorted[0])?.id ?? null;
};

const initialDraft = (
  conversation: Conversation,
  catalogs: QuickOrderCatalogs,
  channelSaleTypeId: number | null
): QuickOrderDraft => {
  const prefs = readPrefs();
  const c = conversation.customer;
  const dni = catalogs.documentTypes.find((d) => d.code?.toUpperCase() === "DNI");
  const priceListId =
    catalogs.priceLists.find((pl) => pl.id === prefs.priceListId)?.id ?? catalogs.priceLists[0]?.id ?? null;
  // El canal de la red del chat, definido en Canales de mensajería, manda. Lo
  // demás es para el negocio que todavía no tiene canal para esa red.
  const saleTypeId =
    catalogs.saleTypes.find((st) => st.id === channelSaleTypeId)?.id ??
    catalogs.saleTypes.find((st) => st.id === prefs.saleTypeId)?.id ??
    catalogs.saleTypes.find((st) => /whats/i.test(st.name))?.id ??
    catalogs.saleTypes[0]?.id ??
    null;

  return {
    customer: {
      documentTypeId: c?.documentTypeId ?? dni?.id ?? null,
      documentNumber: c?.documentNumber ?? "",
      firstName: c?.firstName ?? "",
      lastName: c?.lastName ?? "",
      phone: localPhone(conversation.phoneNumber),
      email: c?.email ?? "",
      accountId: c?.accountId ?? null,
    },
    priceListId,
    saleTypeId,
    situationId: defaultSituationId(catalogs),
    lines: [],
    ruleDiscounts: [],
    withShipping: false,
    shipping: {
      countryId: catalogs.countries[0]?.id ?? null,
      stateId: null,
      cityId: null,
      neighborhoodId: null,
      shippingCostId: null,
      cost: 0,
      address: "",
      reference: "",
      receptionPerson: "",
      receptionPhone: "",
    },
    manualDiscounts: [],
    withPayment: false,
    payments: [],
    changeEntries: [],
    notes: "",
  };
};

/** Un pago (o vuelto) vacío. El monto lo propone quien lo agrega. */
export const emptyPayment = (amount: number | null = null): QuickOrderPayment => ({
  id: crypto.randomUUID(),
  paymentMethodId: null,
  businessAccountId: null,
  amount,
  operationCode: "",
  vouchers: [],
});

const sumAmounts = (entries: { amount: number | null }[]) =>
  entries.reduce((sum, e) => sum + (e.amount && e.amount > 0 ? e.amount : 0), 0);

/** Redondeo a céntimos: evita que 0.1 + 0.2 deje "falta S/ 0.00000001". */
const cents = (n: number) => Math.round(n * 100) / 100;

/** Precio de lista de una variación para la lista elegida, como en Añadir venta. */
const listPrice = (product: QuickOrderProduct, priceListId: number | null): number => {
  const entry = priceListId
    ? product.prices.find((p) => p.priceListId === priceListId)
    : product.prices[0];
  return entry?.salePrice || entry?.price || 0;
};

export const computeTotals = (draft: QuickOrderDraft): QuickOrderTotals => {
  const subtotal = draft.lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  // Reglas de precio + manuales: negativo descuenta, positivo recarga.
  const discount =
    draft.ruleDiscounts.reduce((sum, d) => sum + d.amount, 0) +
    draft.manualDiscounts.reduce((sum, d) => sum + d.amount, 0);
  const shipping = draft.withShipping ? draft.shipping.cost || 0 : 0;
  const total = cents(Math.max(0, subtotal + discount + shipping));
  const paid = draft.withPayment ? cents(sumAmounts(draft.payments)) : 0;
  return {
    subtotal: cents(subtotal),
    discount: cents(discount),
    shipping,
    total,
    items: draft.lines.reduce((n, l) => n + l.quantity, 0),
    paid,
    pending: cents(Math.max(0, total - paid)),
    change: cents(Math.max(0, paid - total)),
    changeGiven: draft.withPayment ? cents(sumAmounts(draft.changeEntries)) : 0,
  };
};

const buildSummary = (
  draft: QuickOrderDraft,
  totals: QuickOrderTotals,
  orderId: number,
  methodName: (id: number | null) => string
): string => {
  const first = draft.customer.firstName.trim().split(/\s+/)[0];
  const lines = draft.lines.map((l) => {
    const detail = l.terms.length ? ` (${l.terms.join(" / ")})` : "";
    return `• ${l.quantity} × ${l.productTitle}${detail}: ${formatCurrency(l.price * l.quantity)}`;
  });
  const parts = [
    `${first ? `Hola ${first}, ` : ""}este es el resumen de tu pedido #${orderId}:`,
    ...lines,
  ];
  for (const d of [...draft.ruleDiscounts, ...draft.manualDiscounts]) {
    parts.push(`${d.name}: ${formatCurrency(d.amount)}`);
  }
  parts.push(draft.withShipping ? `Envío: ${formatCurrency(totals.shipping)}` : "Recojo en tienda");
  parts.push(`Total: ${formatCurrency(totals.total)}`);
  if (totals.paid > 0) {
    const methods = draft.payments
      .map((p) => methodName(p.paymentMethodId))
      .filter(Boolean)
      .join(" + ");
    parts.push(`Pagado: ${formatCurrency(totals.paid)}${methods ? ` por ${methods}` : ""}`);
    if (totals.pending > 0) parts.push(`Falta pagar: ${formatCurrency(totals.pending)}`);
  }
  return parts.join("\n");
};

interface Options {
  conversation: Conversation;
  channelId: number | null;
  draft: QuickOrderDraft | undefined;
  onDraftChange: (draft: QuickOrderDraft) => void;
  onDraftReset: () => void;
  /** Canal de venta de la red del chat (Canales de mensajería); null si no hay. */
  channelSaleTypeId: number | null;
}

export const useQuickOrder = ({
  conversation,
  channelId,
  draft,
  onDraftChange,
  onDraftReset,
  channelSaleTypeId,
}: Options) => {
  const { user } = useAuth();
  const { ensureProfile } = useUserProfile();

  const [catalogs, setCatalogs] = useState<QuickOrderCatalogs | null>(null);
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QuickOrderProduct[]>([]);
  const [searching, setSearching] = useState(false);

  const [lookingUp, setLookingUp] = useState(false);
  const [lookup, setLookup] = useState<CustomerLookup["source"] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuickOrderResult | null>(null);
  const [sendingSummary, setSendingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Catálogos + almacén del vendedor (el stock que se busca es el suyo, igual
  // que create-order, que descuenta del almacén de su perfil).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cats, profile] = await Promise.all([getQuickOrderCatalogsApi(), ensureProfile()]);
        if (cancelled) return;
        setCatalogs(cats);
        setWarehouseId(profile?.warehouse_id ?? null);
        if (!profile?.warehouse_id) {
          setLoadError("Tu usuario no tiene almacén asignado: pídelo en Configuración > Usuarios.");
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) setLoadError("No se pudieron cargar los datos para armar pedidos.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ensureProfile]);

  // El borrador nace con los datos que el bot ya le pidió al cliente. Solo
  // mientras no haya resultado: tras crear la orden se muestra el éxito, no un
  // carrito nuevo.
  useEffect(() => {
    if (catalogs && !draft && !result) onDraftChange(initialDraft(conversation, catalogs, channelSaleTypeId));
  }, [catalogs, draft, result, conversation, onDraftChange, channelSaleTypeId]);

  const update = useCallback(
    (patch: Partial<QuickOrderDraft> | ((d: QuickOrderDraft) => Partial<QuickOrderDraft>)) => {
      if (!draft) return;
      const partial = typeof patch === "function" ? patch(draft) : patch;
      onDraftChange({ ...draft, ...partial });
    },
    [draft, onDraftChange]
  );

  // Con canal definido para la red del chat, el pedido no lo pregunta: es ese.
  // Si el borrador nació antes de que llegara la configuración (o se cambió
  // después), se alinea. Los métodos de pago dependen del canal: se limpian.
  const saleTypeFixed =
    !!channelSaleTypeId && !!catalogs?.saleTypes.some((st) => st.id === channelSaleTypeId);

  useEffect(() => {
    if (!saleTypeFixed || !draft || draft.saleTypeId === channelSaleTypeId) return;
    update((d) => ({
      saleTypeId: channelSaleTypeId,
      payments: d.payments.map((p) => ({ ...p, paymentMethodId: null, businessAccountId: null })),
      changeEntries: d.changeEntries.map((e) => ({ ...e, paymentMethodId: null, businessAccountId: null })),
    }));
  }, [saleTypeFixed, channelSaleTypeId, draft, update]);

  // Búsqueda con debounce: el vendedor tipea mientras lee el chat.
  useEffect(() => {
    if (!catalogs || !warehouseId) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const rows = await searchQuickOrderProductsApi(query, warehouseId, catalogs.stockTypeId);
        if (!cancelled) setResults(rows);
      } catch (error) {
        console.error(error);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, catalogs, warehouseId]);

  const addProduct = useCallback(
    (product: QuickOrderProduct) => {
      if (!draft || product.stock <= 0) return;
      update((d) => {
        const existing = d.lines.find((l) => l.variationId === product.variationId);
        if (existing) {
          return {
            lines: d.lines.map((l) =>
              l.variationId === product.variationId
                ? { ...l, quantity: Math.min(l.quantity + 1, l.maxStock) }
                : l
            ),
          };
        }
        const price = listPrice(product, d.priceListId);
        const line: QuickOrderLine = {
          variationId: product.variationId,
          productId: product.productId,
          productTitle: product.productTitle,
          sku: product.sku,
          imageUrl: product.imageUrl,
          terms: product.terms.map((t) => t.name),
          originalPrice: price,
          price,
          quantity: 1,
          maxStock: product.stock,
        };
        return { lines: [...d.lines, line] };
      });
    },
    [draft, update]
  );

  const setQuantity = useCallback(
    (variationId: number, quantity: number) => {
      update((d) => ({
        lines:
          quantity <= 0
            ? d.lines.filter((l) => l.variationId !== variationId)
            : d.lines.map((l) =>
                l.variationId === variationId ? { ...l, quantity: Math.min(quantity, l.maxStock) } : l
              ),
      }));
    },
    [update]
  );

  // Reglas de precio, igual que Añadir venta: se recalculan cuando cambia el
  // carrito, la lista o el cliente. La llave evita volver a llamar cuando lo
  // único que cambió es el precio que las propias reglas acaban de poner.
  const rulesKey = draft
    ? JSON.stringify([
        draft.priceListId,
        draft.customer.accountId,
        draft.lines.map((l) => [l.variationId, l.quantity, l.originalPrice]),
      ])
    : "";
  const draftRef = useRef(draft);
  draftRef.current = draft;
  // La página pasa un callback nuevo en cada render: se lee de una ref para que
  // no reinicie (y cancele) el cálculo de reglas que está en curso.
  const onDraftChangeRef = useRef(onDraftChange);
  onDraftChangeRef.current = onDraftChange;

  useEffect(() => {
    const current = draftRef.current;
    if (!current || !current.priceListId) return;
    if (current.lines.length === 0) {
      if (current.ruleDiscounts.length) onDraftChangeRef.current({ ...current, ruleDiscounts: [] });
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await applyPriceRules(
        current.lines,
        current.priceListId!,
        null,
        current.customer.accountId
      );
      const latest = draftRef.current;
      if (cancelled || !latest) return;
      const priceBy = new Map(res.items.map((i) => [i.variationId, i.price]));
      onDraftChangeRef.current({
        ...latest,
        lines: latest.lines.map((l) => ({ ...l, price: priceBy.get(l.variationId) ?? l.price })),
        ruleDiscounts: res.discounts.map((d) => ({ name: d.name, amount: d.amount, code: d.code })),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [rulesKey]);

  // Al cambiar de lista, los precios de lista se recalculan con los productos
  // ya buscados no alcanzan: se vuelve a partir del último resultado conocido.
  const changePriceList = useCallback(
    (priceListId: number) => {
      update((d) => ({
        priceListId,
        lines: d.lines.map((l) => {
          const product = results.find((r) => r.variationId === l.variationId);
          const price = product ? listPrice(product, priceListId) : l.originalPrice;
          return { ...l, originalPrice: price, price };
        }),
      }));
      writePrefs({ priceListId, saleTypeId: draft?.saleTypeId ?? null });
    },
    [update, results, draft?.saleTypeId]
  );

  const changeSaleType = useCallback(
    (saleTypeId: number) => {
      // Los métodos de pago dependen del canal: al cambiarlo, los elegidos
      // pueden dejar de valer.
      update((d) => ({
        saleTypeId,
        payments: d.payments.map((p) => ({ ...p, paymentMethodId: null, businessAccountId: null })),
        changeEntries: d.changeEntries.map((e) => ({ ...e, paymentMethodId: null, businessAccountId: null })),
      }));
      writePrefs({ priceListId: draft?.priceListId ?? null, saleTypeId });
    },
    [update, draft?.priceListId]
  );

  const searchCustomer = useCallback(async () => {
    if (!draft || !catalogs || !draft.customer.documentTypeId || !draft.customer.documentNumber.trim()) return;
    const docType = catalogs.documentTypes.find((d) => d.id === draft.customer.documentTypeId);
    setLookingUp(true);
    try {
      const found = await findQuickOrderCustomerApi(
        draft.customer.documentTypeId,
        docType?.code ?? null,
        draft.customer.documentNumber
      );
      setLookup(found.source);
      if (found.source !== "none") {
        update((d) => ({
          customer: {
            ...d.customer,
            accountId: found.accountId,
            firstName: found.firstName || d.customer.firstName,
            lastName: found.lastName || d.customer.lastName,
            email: found.email || d.customer.email,
            phone: d.customer.phone || found.phone,
          },
        }));
      } else {
        update((d) => ({ customer: { ...d.customer, accountId: null } }));
      }
    } catch (error) {
      toastError(error, "No se pudo buscar el documento");
    } finally {
      setLookingUp(false);
    }
  }, [draft, catalogs, update]);

  const totals = useMemo(() => (draft ? computeTotals(draft) : null), [draft]);

  // Igual que Añadir venta: solo los métodos vinculados al canal; si el canal
  // no tiene ninguno, la lista queda vacía (y el panel lo avisa).
  const paymentMethods = useMemo(() => {
    if (!catalogs || !draft?.saleTypeId) return catalogs?.paymentMethods ?? [];
    const allowed = catalogs.paymentMethodSaleTypes
      .filter((m) => m.saleTypeId === draft.saleTypeId)
      .map((m) => m.paymentMethodId);
    return catalogs.paymentMethods.filter((m) => allowed.includes(m.id));
  }, [catalogs, draft?.saleTypeId]);

  /** El método no trae cuenta propia: el vendedor tiene que elegir una. */
  const needsAccount = useCallback(
    (paymentMethodId: number | null) => {
      if (!paymentMethodId || !catalogs) return false;
      const method = catalogs.paymentMethods.find((m) => m.id === paymentMethodId);
      return !method?.businessAccountId;
    },
    [catalogs]
  );

  /** Al elegir método, la cuenta se toma del método si la trae. */
  const accountFor = useCallback(
    (paymentMethodId: number | null) =>
      catalogs?.paymentMethods.find((m) => m.id === paymentMethodId)?.businessAccountId || null,
    [catalogs]
  );

  const methodName = useCallback(
    (id: number | null) => catalogs?.paymentMethods.find((m) => m.id === id)?.name ?? "",
    [catalogs]
  );

  // ---- Pagos, vuelto y descuentos manuales --------------------------------
  const setPayments = useCallback(
    (payments: QuickOrderPayment[]) => update({ payments }),
    [update]
  );
  const addPayment = useCallback(() => {
    // El primero propone el total; los siguientes, lo que falta.
    update((d) => ({ payments: [...d.payments, emptyPayment(computeTotals(d).pending || null)] }));
  }, [update]);

  const setChangeEntries = useCallback(
    (changeEntries: QuickOrderChange[]) => update({ changeEntries }),
    [update]
  );
  const addChangeEntry = useCallback(() => {
    update((d) => {
      const t = computeTotals(d);
      const left = cents(t.change - t.changeGiven);
      const { operationCode: _omit, ...entry } = emptyPayment(left > 0 ? left : null);
      return { changeEntries: [...d.changeEntries, entry] };
    });
  }, [update]);

  const addManualDiscount = useCallback(
    (name: string, amount: number) =>
      update((d) => ({
        manualDiscounts: [...d.manualDiscounts, { id: crypto.randomUUID(), name, amount: cents(amount) }],
      })),
    [update]
  );
  const removeManualDiscount = useCallback(
    (id: string) => update((d) => ({ manualDiscounts: d.manualDiscounts.filter((m) => m.id !== id) })),
    [update]
  );

  const shippingOptions = useMemo(() => {
    if (!catalogs || !draft) return [];
    const s = draft.shipping;
    return filterShippingCostsByLocation(catalogs.shippingCosts, s.countryId, s.stateId, s.cityId, s.neighborhoodId);
  }, [catalogs, draft]);

  /** Lo que falta para poder crear la orden, con las etiquetas que se ven. */
  const missing = useMemo(() => {
    if (!draft) return [];
    const list: string[] = [];
    if (draft.lines.length === 0) list.push("Prendas");
    if (!draft.customer.documentTypeId || !draft.customer.documentNumber.trim()) list.push("Documento");
    if (!draft.customer.firstName.trim()) list.push("Nombre");
    if (!draft.priceListId) list.push("Lista de precios");
    if (!draft.saleTypeId) list.push("Canal");
    if (!draft.situationId) list.push("Estado");
    if (draft.withShipping) {
      if (!draft.shipping.shippingCostId) list.push("Método de envío");
      if (!draft.shipping.address.trim()) list.push("Dirección");
    }
    if (draft.withPayment) {
      if (draft.payments.length === 0) list.push("Al menos un pago");
      draft.payments.forEach((p, i) => {
        const n = draft.payments.length > 1 ? ` ${i + 1}` : "";
        if (!p.paymentMethodId) list.push(`Método del pago${n}`);
        if (!p.amount || p.amount <= 0) list.push(`Monto del pago${n}`);
        if (needsAccount(p.paymentMethodId) && !p.businessAccountId) list.push(`Cuenta del pago${n}`);
        if (p.vouchers.length === 0) list.push(`Captura del pago${n}`);
      });
      draft.changeEntries.forEach((e, i) => {
        const n = draft.changeEntries.length > 1 ? ` ${i + 1}` : "";
        if (!e.paymentMethodId) list.push(`Método del vuelto${n}`);
        if (!e.amount || e.amount <= 0) list.push(`Monto del vuelto${n}`);
        if (needsAccount(e.paymentMethodId) && !e.businessAccountId) list.push(`Cuenta del vuelto${n}`);
      });
      const t = computeTotals(draft);
      if (t.changeGiven > t.change) list.push("Vuelto mayor al calculado");
    }
    return list;
  }, [draft, needsAccount]);

  const submit = useCallback(async () => {
    if (!draft || !catalogs || !totals || missing.length) return false;
    setSubmitting(true);
    try {
      const { orderId, voucherWarning } = await createQuickOrderApi(draft, totals, catalogs.stockTypeId);
      setResult({ orderId, voucherWarning, summary: buildSummary(draft, totals, orderId, methodName) });
      onDraftReset();
      return true;
    } catch (error) {
      toastError(error, "No se pudo crear la orden");
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [draft, catalogs, totals, missing.length, onDraftReset, methodName]);

  // Mandar el resumen pasa por la misma compuerta que cualquier mensaje: hay
  // que tener el control y la ventana de 24 h abierta.
  const takenByMe = !!conversation.takenBy && conversation.takenBy === user?.id;
  const summaryBlockedReason = !conversation.windowOpen
    ? "Pasaron 24 h desde el último mensaje del cliente: WhatsApp no deja escribirle."
    : !takenByMe
      ? "Toma el control del chat para enviarle el resumen."
      : null;

  const sendSummary = useCallback(async () => {
    if (!result || !channelId || summaryBlockedReason) return false;
    setSendingSummary(true);
    setSummaryError(null);
    try {
      const res = await sendMessageApi(
        channelId,
        conversation.phoneNumber,
        conversation.whatsappUserId,
        result.summary
      );
      if (!res.success) {
        setSummaryError(res.error ?? "No se pudo enviar el resumen.");
        return false;
      }
      return true;
    } finally {
      setSendingSummary(false);
    }
  }, [result, channelId, summaryBlockedReason, conversation.phoneNumber, conversation.whatsappUserId]);

  return {
    catalogs,
    loadError,
    draft,
    totals,
    update,
    query,
    setQuery,
    results,
    searching,
    addProduct,
    setQuantity,
    changePriceList,
    changeSaleType,
    saleTypeFixed,
    searchCustomer,
    lookingUp,
    lookup,
    paymentMethods,
    needsAccount,
    accountFor,
    setPayments,
    addPayment,
    setChangeEntries,
    addChangeEntry,
    addManualDiscount,
    removeManualDiscount,
    shippingOptions,
    missing,
    submit,
    submitting,
    result,
    clearResult: () => {
      setResult(null);
      setSummaryError(null);
    },
    sendSummary,
    sendingSummary,
    summaryError,
    summaryBlockedReason,
  };
};
