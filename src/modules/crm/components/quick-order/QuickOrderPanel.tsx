import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  CircleCheck,
  ExternalLink,
  Loader2,
  Send,
  Settings2,
  ShoppingBag,
  Sparkles,
  Truck,
  User,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SalePaymentStatusBadge } from "@/modules/sales/components/sales/SalePaymentStatusBadge";
import { getSalePaymentStatusFromAmounts } from "@/modules/sales/utils/salePaymentStatus";
import { formatCurrency } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/utils";
import { emptyPayment, useQuickOrder } from "../../hooks/useQuickOrder";
import type { Conversation } from "../../types/crm.types";
import type { QuickOrderDraft } from "../../types/quickOrder.types";
import { CHANNEL_LABEL } from "../../utils/channels";
import { ChannelIcon } from "../ChannelIcon";
import { CustomerFields } from "./CustomerFields";
import { DiscountsSection } from "./DiscountsSection";
import { NumberSelect } from "./NumberSelect";
import { OrderCart } from "./OrderCart";
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

type BlockKey = "products" | "customer" | "shipping" | "payment" | "more";

/**
 * Un bloque plegable del pedido. Cerrado muestra un resumen a la derecha (el
 * cliente, el envío, lo pagado), así el panel angosto se lee de un vistazo y
 * solo se abre lo que se está llenando. `toggle` es el interruptor de Envío y
 * Pago: apagado, el bloque no aplica a la orden.
 */
const Block = ({
  icon: Icon,
  title,
  summary,
  open,
  onOpenChange,
  toggle,
  children,
}: {
  icon: typeof Truck;
  title: string;
  summary?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toggle?: { checked: boolean; onChange: (checked: boolean) => void; label: string };
  children: React.ReactNode;
}) => {
  const disabled = toggle && !toggle.checked;
  return (
    <section className="border-b">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => !disabled && onOpenChange(!open)}
          aria-expanded={!disabled && open}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 text-left text-xs",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            disabled && "cursor-default"
          )}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="font-semibold">{title}</span>
          {summary && (!open || disabled) && (
            <span className="ml-auto min-w-0 truncate text-muted-foreground">{summary}</span>
          )}
          {!disabled && (
            <ChevronDown
              className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180", !summary || open ? "ml-auto" : "")}
            />
          )}
        </button>
        {toggle && (
          <Switch
            checked={toggle.checked}
            onCheckedChange={(checked) => {
              toggle.onChange(checked);
              onOpenChange(checked);
            }}
            aria-label={toggle.label}
          />
        )}
      </div>
      {open && !disabled && <div className="px-3 pb-3">{children}</div>}
    </section>
  );
};

/**
 * POS lateral de la bandeja: el vendedor arma el pedido mientras el cliente
 * pide por el chat, y lo crea sin salir de la conversación. Cubre lo de
 * Añadir venta en el orden en que se arma una venta (productos, cliente,
 * envío, pago); lo que casi no se toca va en "Más opciones". En personalizado
 * create-order no recibe fecha de venta: la orden queda con la de hoy.
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
  const [open, setOpen] = useState<Record<BlockKey, boolean>>({
    products: true,
    customer: false,
    shipping: false,
    payment: false,
    more: false,
  });
  const [showMissing, setShowMissing] = useState(false);
  const qo = useQuickOrder({ conversation, channelId, draft, onDraftChange, onDraftReset, channelSaleTypeId });
  const setBlock = (key: BlockKey) => (value: boolean) => setOpen((o) => ({ ...o, [key]: value }));

  const header = (
    <div className="flex items-center gap-2 border-b px-3 py-2">
      <ShoppingBag className="h-4 w-4" />
      <p className="flex-1 text-sm font-semibold">Pedido</p>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Cerrar el pedido">
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

  // Orden creada: número, estado del pago, aviso del comprobante si falló, y
  // el resumen listo para mandar.
  if (qo.result) {
    const { orderId, summary, voucherWarning, total, paid } = qo.result;
    return (
      <>
        {header}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
          <div className="flex items-start gap-2">
            <CircleCheck className="mt-0.5 h-6 w-6 shrink-0 text-success" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Orden #{orderId} creada</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <SalePaymentStatusBadge status={getSalePaymentStatusFromAmounts(paid, total)} />
                <span className="tabular-nums text-muted-foreground">
                  {formatCurrency(paid)} de {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>
          {voucherWarning && (
            <p className="rounded-md bg-warning-soft px-2 py-1.5 text-xs text-warning-soft-foreground">
              {voucherWarning}
            </p>
          )}
          {/* La orden completa (comprobantes, guía, rótulo, notas) se ve en Ventas. */}
          <Button variant="outline" asChild>
            <Link to={`/sales/edit/${orderId}`} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver venta
            </Link>
          </Button>
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
          <Button variant="ghost" onClick={qo.clearResult}>
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
  const manyStockTypes = catalogs.stockTypes.length > 1;
  const stockTypeName = (id: number) =>
    manyStockTypes ? catalogs.stockTypes.find((st) => st.id === id)?.name ?? null : null;
  const neighborhood = catalogs.neighborhoods.find((n) => n.id === d.shipping.neighborhoodId)?.name;
  const saleTypeName = catalogs.saleTypes.find((st) => st.id === d.saleTypeId)?.name;
  const priceListName = catalogs.priceLists.find((pl) => pl.id === d.priceListId)?.name;

  return (
    <>
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Block
          icon={ShoppingBag}
          title="Productos"
          summary={totals.items ? `${totals.items} · ${formatCurrency(totals.subtotal)}` : "Vacío"}
          open={open.products}
          onOpenChange={setBlock("products")}
        >
          <div className="flex flex-col gap-2.5">
            <ProductPicker
              query={qo.query}
              onQueryChange={qo.setQuery}
              results={qo.results}
              searching={qo.searching}
              priceListId={d.priceListId}
              onAdd={qo.addProduct}
              onScan={() => void qo.addByCode()}
              hasMore={qo.hasMoreResults}
              loadingMore={qo.loadingMore}
              onLoadMore={() => void qo.loadMoreResults()}
            />
            <OrderCart
              lines={d.lines}
              stockTypeName={stockTypeName}
              onQuantityChange={qo.setQuantity}
              onPriceChange={qo.setLinePrice}
            />
            {/* Por qué cambió un precio o apareció un regalo. */}
            {d.appliedRules.length > 0 && (
              <ul className="flex flex-col gap-1">
                {d.appliedRules.map((r) => (
                  <li
                    key={r.name}
                    className="flex items-start gap-1.5 rounded-md bg-primary/10 px-2 py-1.5 text-[11px]"
                  >
                    <Sparkles className="mt-px h-3 w-3 shrink-0 text-primary" />
                    <span>{r.message || r.name}</span>
                  </li>
                ))}
              </ul>
            )}
            <DiscountsSection
              ruleDiscounts={d.ruleDiscounts}
              manualDiscounts={d.manualDiscounts}
              onAdd={qo.addManualDiscount}
              onRemove={qo.removeManualDiscount}
            />
          </div>
        </Block>

        <Block
          icon={User}
          title="Cliente"
          summary={customerName || d.customer.documentNumber || "Sin datos"}
          open={open.customer}
          onOpenChange={setBlock("customer")}
        >
          <CustomerFields
            customer={d.customer}
            documentTypes={catalogs.documentTypes}
            lookingUp={qo.lookingUp}
            lookup={qo.lookup}
            botOrderId={conversation.customer?.orderId ?? null}
            onChange={(customer) => qo.update({ customer })}
            onSearch={qo.searchCustomer}
          />
        </Block>

        <Block
          icon={Truck}
          title="Envío"
          summary={
            d.withShipping
              ? [neighborhood, d.shipping.shippingCostId ? formatCurrency(totals.shipping) : null]
                  .filter(Boolean)
                  .join(" · ") || "Sin completar"
              : "Recojo en tienda"
          }
          open={open.shipping}
          onOpenChange={setBlock("shipping")}
          toggle={{
            checked: d.withShipping,
            onChange: (withShipping) => qo.update({ withShipping }),
            label: "Con envío",
          }}
        >
          <ShippingFields
            shipping={d.shipping}
            catalogs={catalogs}
            options={qo.shippingOptions}
            onChange={(shipping) => qo.update({ shipping })}
          />
        </Block>

        <Block
          icon={Wallet}
          title="Pago"
          summary={d.withPayment ? `${formatCurrency(totals.paid)} pagado` : "Sin registrar"}
          open={open.payment}
          onOpenChange={setBlock("payment")}
          toggle={{
            checked: d.withPayment,
            onChange: (withPayment) =>
              qo.update((cur) => ({
                withPayment,
                // Al activarlo arranca con un pago por el total: casi siempre se
                // paga completo y en un solo medio.
                payments:
                  withPayment && cur.payments.length === 0 ? [emptyPayment(totals.total || null)] : cur.payments,
              })),
            label: "Registrar pago",
          }}
        >
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
        </Block>

        <Block
          icon={Settings2}
          title="Más opciones"
          summary={[priceListName, saleTypeName].filter(Boolean).join(" · ")}
          open={open.more}
          onOpenChange={setBlock("more")}
        >
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <NumberSelect
                label="Lista de precios"
                placeholder="Lista de precios"
                value={d.priceListId}
                options={catalogs.priceLists}
                onChange={qo.changePriceList}
              />
              {/* El canal lo define la red del chat en Canales de mensajería:
                  no se pregunta. Sin canal para esa red, queda el selector. */}
              {qo.saleTypeFixed ? (
                <Link
                  to="/crm/messaging"
                  className="flex h-8 min-w-0 items-center gap-1.5 rounded-md border bg-muted/40 px-2.5 text-xs hover:bg-muted"
                  title="Canal de venta de esta red. Se cambia en Canales de mensajería."
                >
                  <ChannelIcon channel={conversation.channel} className="h-3.5 w-3.5" />
                  <span className="min-w-0 truncate">{saleTypeName ?? "Canal"}</span>
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
              <p className="text-[10.5px] text-muted-foreground">
                Define el canal de venta de {CHANNEL_LABEL[conversation.channel]} en{" "}
                <Link to="/crm/messaging" className="font-medium underline underline-offset-2">
                  Canales de mensajería
                </Link>{" "}
                para no elegirlo cada vez.
              </p>
            )}
            {manyStockTypes && (
              <NumberSelect
                label="Tipo de inventario"
                placeholder="Inventario"
                value={d.stockTypeId}
                options={catalogs.stockTypes}
                onChange={qo.changeStockType}
              />
            )}
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
          </div>
        </Block>
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
