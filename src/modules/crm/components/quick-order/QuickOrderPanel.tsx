import { useState } from "react";
import { Link } from "react-router-dom";
import { CircleCheck, Loader2, Percent, Send, Truck, User, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/utils";
import { useQuickOrder } from "../../hooks/useQuickOrder";
import type { Conversation } from "../../types/crm.types";
import type { QuickOrderDraft } from "../../types/quickOrder.types";
import { CHANNEL_LABEL } from "../../utils/channels";
import { ChannelIcon } from "../ChannelIcon";
import { CustomerFields } from "./CustomerFields";
import { NumberSelect } from "./NumberSelect";
import { OrderCart } from "./OrderCart";
import { emptyPayment } from "../../hooks/useQuickOrder";
import { DiscountsSection } from "./DiscountsSection";
import { PaymentsSection } from "./PaymentsSection";
import { ProductPicker } from "./ProductPicker";
import { ShippingFields } from "./ShippingFields";

interface Props {
  conversation: Conversation;
  channelId: number | null;
  draft: QuickOrderDraft | undefined;
  onDraftChange: (draft: QuickOrderDraft) => void;
  onDraftReset: () => void;
  /** Canal de venta de la red del chat (Canales de mensajería); null si no hay. */
  channelSaleTypeId: number | null;
  onClose: () => void;
  /** El resumen salió por WhatsApp: la página recarga el hilo. */
  onSummarySent: () => void;
}

type Tab = "order" | "customer";

const Section = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <section className={cn("border-t px-3 py-2.5", className)}>{children}</section>
);

/** Fila de check que despliega su sección: sin marcar, no estorba. */
const ToggleRow = ({
  id,
  checked,
  onChange,
  icon: Icon,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: typeof Truck;
  label: string;
}) => (
  <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-xs font-medium">
    <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} />
    <Icon className="h-3.5 w-3.5" />
    {label}
  </label>
);

/**
 * POS lateral de la bandeja: el vendedor arma el pedido mientras el cliente
 * pide prendas por el chat, y lo crea sin salir de la conversación.
 */
export const QuickOrderPanel = ({
  conversation,
  channelId,
  draft,
  onDraftChange,
  onDraftReset,
  channelSaleTypeId,
  onClose,
  onSummarySent,
}: Props) => {
  const [tab, setTab] = useState<Tab>("order");
  const [showMissing, setShowMissing] = useState(false);
  const qo = useQuickOrder({ conversation, channelId, draft, onDraftChange, onDraftReset, channelSaleTypeId });

  const header = (
    <div className="flex items-center border-b">
      {(
        [
          ["order", "Pedido"],
          ["customer", "Cliente"],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => setTab(key)}
          aria-selected={tab === key}
          role="tab"
          className={cn(
            "flex-1 border-b-2 py-2.5 text-xs transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
            tab === key ? "border-primary font-semibold" : "border-transparent text-muted-foreground"
          )}
        >
          {label}
        </button>
      ))}
      <Button variant="ghost" size="icon" className="mx-1 h-8 w-8" onClick={onClose} aria-label="Cerrar el pedido">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );

  if (qo.loadError) {
    return (
      <>
        {header}
        <p className="p-4 text-xs text-muted-foreground">{qo.loadError}</p>
      </>
    );
  }

  // Orden creada: número, aviso de la captura si falló, y el resumen listo.
  if (qo.result) {
    const { orderId, summary, voucherWarning } = qo.result;
    return (
      <>
        {header}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
          <div className="flex items-center gap-2">
            <CircleCheck className="h-6 w-6 text-success" />
            <div>
              <p className="text-sm font-semibold">Orden #{orderId} creada</p>
              <p className="text-xs text-muted-foreground">Quedó en Ventas con el estado elegido.</p>
            </div>
          </div>
          {voucherWarning && (
            <p className="rounded-md bg-warning-soft px-2 py-1.5 text-xs text-warning-soft-foreground">
              {voucherWarning}
            </p>
          )}
          <div className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs leading-relaxed">{summary}</div>
          {qo.summaryBlockedReason ? (
            <p className="text-xs text-muted-foreground">{qo.summaryBlockedReason}</p>
          ) : (
            <Button
              onClick={async () => {
                if (await qo.sendSummary()) onSummarySent();
              }}
              disabled={qo.sendingSummary}
            >
              {qo.sendingSummary ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar resumen al chat
            </Button>
          )}
          {qo.summaryError && <p className="text-xs text-destructive">{qo.summaryError}</p>}
          <Button variant="outline" onClick={qo.clearResult}>
            Nuevo pedido
          </Button>
        </div>
      </>
    );
  }

  if (!qo.catalogs || !qo.draft || !qo.totals) {
    return (
      <>
        {header}
        <div className="flex flex-1 items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparando el pedido…
        </div>
      </>
    );
  }

  const { catalogs, draft: d, totals } = qo;
  const customerName = [d.customer.firstName, d.customer.lastName].filter(Boolean).join(" ");

  if (tab === "customer") {
    return (
      <>
        {header}
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <CustomerFields
            customer={d.customer}
            documentTypes={catalogs.documentTypes}
            lookingUp={qo.lookingUp}
            lookup={qo.lookup}
            botOrderId={conversation.customer?.orderId ?? null}
            onChange={(customer) => qo.update({ customer })}
            onSearch={qo.searchCustomer}
          />
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <button
          type="button"
          onClick={() => setTab("customer")}
          className="flex w-full items-center gap-2 bg-muted/60 px-3 py-2 text-left text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate font-medium">{customerName || "Sin nombre"}</span>
          <span className="shrink-0 text-muted-foreground">{d.customer.documentNumber || "Agregar documento"}</span>
        </button>

        <div className="grid grid-cols-2 gap-1.5 px-3 py-2">
          <NumberSelect
            label="Lista de precios"
            placeholder="Lista de precios"
            value={d.priceListId}
            options={catalogs.priceLists}
            onChange={qo.changePriceList}
          />
          {/* El canal lo define la red del chat en Canales de mensajería: no se
              pregunta. Sin canal para esa red, queda el selector de antes. */}
          {qo.saleTypeFixed ? (
            <Link
              to="/crm/messaging"
              className="flex h-8 min-w-0 items-center gap-1.5 rounded-md border bg-muted/40 px-2.5 text-xs hover:bg-muted"
              title="Canal de venta de esta red. Se cambia en Canales de mensajería."
            >
              <ChannelIcon channel={conversation.channel} className="h-3.5 w-3.5" />
              <span className="min-w-0 truncate">
                {catalogs.saleTypes.find((st) => st.id === d.saleTypeId)?.name ?? "Canal"}
              </span>
            </Link>
          ) : (
            <NumberSelect
              label="Canal de venta"
              placeholder="Canal"
              value={d.saleTypeId}
              options={catalogs.saleTypes}
              onChange={qo.changeSaleType}
            />
          )}
        </div>
        {!qo.saleTypeFixed && (
          <p className="-mt-1 px-3 pb-2 text-[10.5px] text-muted-foreground">
            Define el canal de venta de {CHANNEL_LABEL[conversation.channel]} en{" "}
            <Link to="/crm/messaging" className="font-medium underline underline-offset-2">
              Canales de mensajería
            </Link>{" "}
            para no elegirlo cada vez.
          </p>
        )}

        <div className="px-3 pb-2.5">
          <ProductPicker
            query={qo.query}
            onQueryChange={qo.setQuery}
            results={qo.results}
            searching={qo.searching}
            priceListId={d.priceListId}
            onAdd={qo.addProduct}
          />
        </div>

        <Section>
          <p className="mb-1 text-xs font-semibold">Carrito</p>
          <OrderCart lines={d.lines} onQuantityChange={qo.setQuantity} />
        </Section>

        <Section>
          <ToggleRow
            id="qo-shipping"
            checked={d.withShipping}
            onChange={(withShipping) => qo.update({ withShipping })}
            icon={Truck}
            label="Con envío"
          />
          {d.withShipping && (
            <div className="mt-2">
              <ShippingFields
                shipping={d.shipping}
                catalogs={catalogs}
                options={qo.shippingOptions}
                onChange={(shipping) => qo.update({ shipping })}
              />
            </div>
          )}
        </Section>

        <Section>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold">
            <Percent className="h-3.5 w-3.5" />
            Descuentos
          </p>
          <DiscountsSection
            ruleDiscounts={d.ruleDiscounts}
            manualDiscounts={d.manualDiscounts}
            onAdd={qo.addManualDiscount}
            onRemove={qo.removeManualDiscount}
          />
        </Section>

        <Section>
          <ToggleRow
            id="qo-payment"
            checked={d.withPayment}
            onChange={(withPayment) =>
              qo.update((cur) => ({
                withPayment,
                // Al marcarlo, arranca con un pago por el total: casi siempre
                // se paga completo y en un solo medio.
                payments:
                  withPayment && cur.payments.length === 0 ? [emptyPayment(totals.total || null)] : cur.payments,
              }))
            }
            icon={Wallet}
            label="Registrar pago"
          />
          {d.withPayment && (
            <div className="mt-2">
              <PaymentsSection
                payments={d.payments}
                changeEntries={d.changeEntries}
                totals={totals}
                methods={qo.paymentMethods}
                accounts={catalogs.businessAccounts}
                needsAccount={qo.needsAccount}
                accountFor={qo.accountFor}
                onPaymentsChange={qo.setPayments}
                onAddPayment={qo.addPayment}
                onChangeEntriesChange={qo.setChangeEntries}
                onAddChangeEntry={qo.addChangeEntry}
              />
            </div>
          )}
        </Section>

        <Section className="flex flex-col gap-1.5">
          <NumberSelect
            label="Estado de la orden"
            placeholder="Estado"
            value={d.situationId}
            options={catalogs.situations}
            onChange={(situationId) => qo.update({ situationId })}
          />
          <Textarea
            value={d.notes}
            onChange={(e) => qo.update({ notes: e.target.value })}
            placeholder="Nota para el pedido (opcional)"
            className="min-h-[52px] text-xs"
            aria-label="Nota del pedido"
          />
        </Section>
      </div>

      <footer className="flex flex-col gap-1 border-t px-3 py-2.5 text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatCurrency(totals.subtotal)}</span>
        </div>
        {totals.discount !== 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>{totals.discount < 0 ? "Descuentos" : "Recargos"}</span>
            <span className="tabular-nums">{formatCurrency(totals.discount)}</span>
          </div>
        )}
        {d.withShipping && (
          <div className="flex justify-between text-muted-foreground">
            <span>Envío</span>
            <span className="tabular-nums">{formatCurrency(totals.shipping)}</span>
          </div>
        )}
        <div className="mb-1 flex justify-between text-sm font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(totals.total)}</span>
        </div>
        {d.withPayment && totals.paid > 0 && (
          <div className="mb-1 flex justify-between text-muted-foreground">
            <span>
              Pagado {formatCurrency(totals.paid)}
              {totals.pending > 0 ? ` · falta ${formatCurrency(totals.pending)}` : ""}
            </span>
            {totals.change > 0 && <span className="tabular-nums">Vuelto {formatCurrency(totals.change)}</span>}
          </div>
        )}
        {showMissing && qo.missing.length > 0 && (
          <p className="text-destructive" role="alert">
            Falta: {qo.missing.join(", ")}.
          </p>
        )}
        <Button
          onClick={() => {
            if (qo.missing.length) {
              setShowMissing(true);
              return;
            }
            void qo.submit();
          }}
          disabled={qo.submitting}
        >
          {qo.submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear orden
        </Button>
      </footer>
    </>
  );
};
