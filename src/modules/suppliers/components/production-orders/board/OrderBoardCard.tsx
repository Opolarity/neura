import { ReactNode, useState } from "react";
import { FileText, Loader2, Scissors } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateField } from "@/shared/components/date-range";
import { formatDateDisplay } from "@/shared/utils/date";
import { useCutFabric } from "../../../hooks/useCutFabric";
import { useCutOrders } from "../../../hooks/useCutOrders";
import { RouteStepSchedule, useOrderRouteServices } from "../../../hooks/useOrderRouteServices";
import { useProductionOrderCost } from "../../../hooks/useProductionOrderCost";
import { claveDe, cubreProceso, useServiceOrders } from "../../../hooks/useServiceOrders";
import { useOrderItemOptions } from "../../../hooks/useOrderItemOptions";
import { OrderOverview } from "../../../hooks/useOrderOverview";
import { CutAttributeItem, CutOrder } from "../../../types/cutOrders.types";
import { CUT_FABRIC_USAGE_LABELS, CutFabricLine, CutWasteEntry } from "../../../types/cutFabric.types";
import { ServiceOrderActions } from "../ServiceOrderActions";
import { MaterialRequirementPanel } from "../MaterialRequirementPanel";
import { QuotationFromProcessDialog } from "../QuotationFromProcessDialog";
import { RouteAdvanceButton } from "./RouteAdvanceButton";
import { StartCutDialog } from "./StartCutDialog";
import { IngresarMermaDialog } from "./IngresarMermaDialog";

const fmt = (value: number) => value.toLocaleString("es-PE");
const money = (value: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);

interface OrderBoardCardProps {
  productionOrderId: number;
  orderCode: string | null;
  canEdit: boolean;
  /** La orden resumida: avance por proceso y recepción. */
  overview: OrderOverview;
  /**
   * El proceso por defecto «Corte» (process_group con essential_order 1). Su
   * fila lleva las O/C, «Iniciar corte» y la fecha programada. Null si el
   * catálogo aún no lo marca.
   */
  cutProcessGroupId: number | null;
  /** La receta trae materiales: va la fila «Materiales». */
  withMaterials: boolean;
  reloadKey: number;
  onReceive: () => void;
  receiveDisabled: boolean;
  /** Por qué «Recibir» está apagado aunque no haya bloqueo: el último proceso aún no entrega. */
  receiveHint?: string | null;
  /** Algo cambió en cortes, consumo o receta: se relee el resumen. */
  onChanged: () => void;
  /** Se registró un avance o un encargo desde la ruta: se relee la orden y el resumen. */
  onAdvanced: () => void;
  /** Se guardó un corte («Iniciar corte»): la página relee la orden. */
  onCutRegistered?: () => void;
}

/** Una fila de la pizarra: el proceso y su taller a la izquierda, lo que produce a la derecha. */
const BoardRow = ({ left, children }: { left: ReactNode; children: ReactNode }) => (
  <div className="grid border-t md:grid-cols-[220px_minmax(0,1fr)]">
    <div className="flex flex-col gap-0.5 p-4 md:border-r">{left}</div>
    <div className="min-w-0 p-4">{children}</div>
  </div>
);

const StageLeft = ({
  name,
  detail,
  note,
}: {
  name: string;
  detail?: string | null;
  /** Debajo del detalle, más tenue: el código del encargo. */
  note?: string | null;
}) => (
  <>
    <span className="font-semibold">{name}</span>
    {detail && <span className="text-muted-foreground text-sm">{detail}</span>}
    {note && <span className="text-muted-foreground text-xs">{note}</span>}
  </>
);

/**
 * Las dos fechas del encargo, cada una con su nombre: lo pactado con el taller
 * y cuándo se terminó. Si va tarde, el atraso se suma al lado; no las tapa.
 */
const Schedule = ({ schedule }: { schedule: RouteStepSchedule }) => (
  <span className="flex flex-wrap items-center gap-3 text-sm tabular-nums">
    <span>
      <span className="text-muted-foreground">Pactada </span>
      {schedule.pactada ? formatDateDisplay(schedule.pactada) : "—"}
    </span>
    <span>
      <span className="text-muted-foreground">Terminada </span>
      {schedule.fin ? formatDateDisplay(schedule.fin) : "—"}
    </span>
    {schedule.atraso > 0 && <Badge variant="destructive-soft">{schedule.atraso} d tarde</Badge>}
  </span>
);

/** «1,500 de 11,995 terminadas». */
const Count = ({ value, of, label }: { value: number; of: number; label: string }) => (
  <span className="text-sm">
    <span className="font-semibold tabular-nums">{fmt(value)}</span>{" "}
    <span className="text-muted-foreground">
      de {fmt(of)} {label}
    </span>
  </span>
);

/**
 * La orden como en la pizarra del taller (multicliente, 2026-10-15): las filas
 * son la ruta. Los materiales, cada proceso con el taller que lo hace y sus
 * encargos, la recepción a stock y el costo de producción.
 *
 * Desde la fila de cada proceso se avanza (2026-10-19) y, con 2026-11-11, se
 * manejan sus encargos: orden de servicio, situación, precios y consumo, en la
 * columna del proceso, debajo del taller (antes, la tarjeta «Servicios a
 * talleres»). El Corte lleva además sus O/C con «Iniciar corte».
 *
 * En personalizado cada proceso lo hace un taller proveedor.
 */
export const OrderBoardCard = ({
  productionOrderId,
  orderCode,
  canEdit,
  overview,
  cutProcessGroupId,
  withMaterials,
  reloadKey,
  onReceive,
  receiveDisabled,
  receiveHint = null,
  onChanged,
  onAdvanced,
  onCutRegistered,
}: OrderBoardCardProps) => {
  const processes = overview.production?.processes ?? [];
  // El taller y las fechas de cada proceso, y los pasos de la ruta con los
  // que se abre el avance de cada fila.
  const { schedule: schedules, steps } = useOrderRouteServices(productionOrderId, reloadKey);
  const stepFor = (processGroupId: number | null) =>
    processGroupId === null ? null : (steps.find((s) => s.processGroupId === processGroupId) ?? null);
  // Lo que cuesta producirla: materiales + encargos (202610150003).
  const cost = useProductionOrderCost(productionOrderId, reloadKey);
  // Los encargos a talleres (2026-11-11): sus botones van en la fila de cada
  // proceso, en vez de la tarjeta «Servicios a talleres».
  const encargos = useServiceOrders(productionOrderId, orderCode, reloadKey);

  // La fila del Corte por defecto: ahí van sus O/C (202611100005).
  const filaCorte =
    cutProcessGroupId === null ? -1 : processes.findIndex((p) => p.processGroupId === cutProcessGroupId);
  const cortes = useCutOrders(filaCorte >= 0 ? productionOrderId : null, onChanged);

  const prendas = useOrderItemOptions(productionOrderId);
  const [encargarDe, setEncargarDe] = useState<{ processGroupId: number; name: string; stepOrder: number } | null>(
    null
  );

  return (
    <Card>
      <CardHeader className="!p-4">
        <CardTitle className="text-lg">Ruta de la orden</CardTitle>
      </CardHeader>
      <CardContent className="!p-0">
        {withMaterials && (
          <BoardRow left={<StageLeft name="Materiales" detail="Antes de cortar" />}>
            <MaterialRequirementPanel
              productionOrderId={productionOrderId}
              orderCode={orderCode}
              reloadKey={reloadKey}
              showHeading={false}
              onRecipeRefreshed={onChanged}
            />
          </BoardRow>
        )}
        {processes.length === 0 && (
          <BoardRow left={<StageLeft name="Procesos" />}>
            <p className="text-muted-foreground text-sm">
              La orden aún no tiene ruta: se arma en la receta de sus prendas.
            </p>
          </BoardRow>
        )}
        {processes.map((process, index) => {
          const groupId = process.processGroupId;
          const schedule = groupId !== null ? schedules.get(groupId) : undefined;
          const conEncargo = process.serviceCodes.length > 0;
          const paso = stepFor(groupId);
          return (
            <BoardRow
              key={`${groupId ?? "p"}-${index}`}
              left={
                <>
                  <StageLeft
                    name={process.name}
                    detail={conEncargo ? (schedule?.taller ?? "Proveedor") : "Proveedor, sin encargo"}
                    note={conEncargo ? process.serviceCodes.join(", ") : null}
                  />
                  {/* 2026-11-11: el encargo del proveedor, con su orden de
                      servicio, situación, precios y consumo, debajo del
                      taller. Si un encargo cubre dos procesos, sale en los dos. */}
                  {conEncargo &&
                    groupId !== null &&
                    encargos.encargos
                      .filter((encargo) => cubreProceso(encargo, groupId))
                      .map((encargo) => (
                        <div key={claveDe(encargo)} className="mt-3 flex flex-col gap-2">
                          <span className="text-muted-foreground text-xs">
                            {[encargo.quotationCode, ...new Set(encargo.services.map((s) => s.situationName || "Sin situación"))]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                          <ServiceOrderActions
                            vertical
                            encargo={encargo}
                            enCotizacionId={encargos.enCotizacionId}
                            imprimiendo={encargos.imprimiendo}
                            onPrint={(e) => void encargos.print(e)}
                            onChanged={onAdvanced}
                          />
                        </div>
                      ))}
                </>
              }
            >
              <div className="flex flex-wrap items-center gap-3">
                <Count value={process.advanced} of={process.requested} label="terminadas" />
                {conEncargo && schedule && <Schedule schedule={schedule} />}
                {process.complete && <Badge variant="success">Terminado</Badge>}
                <span className="flex-1" />
                {canEdit && groupId !== null && !conEncargo && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() =>
                      setEncargarDe({
                        processGroupId: groupId,
                        name: process.name,
                        stepOrder: paso?.order ?? index + 1,
                      })
                    }
                  >
                    <FileText className="h-4 w-4" />
                    Encargar al taller
                  </Button>
                )}
                {/* El Corte avanza al registrar el corte («Iniciar corte»): sin botón. */}
                {index !== filaCorte && <RouteAdvanceButton step={paso} canEdit={canEdit} onSaved={onAdvanced} />}
              </div>
              {index === filaCorte && (
                <div className="mt-4">
                  <CorteBlock
                    cortes={cortes}
                    canEdit={canEdit}
                    productionOrderId={productionOrderId}
                    onCutRegistered={onCutRegistered}
                  />
                </div>
              )}
            </BoardRow>
          );
        })}
        <BoardRow left={<StageLeft name="Recepción a stock" />}>
          <div className="flex flex-wrap items-center gap-3">
            <Count value={overview.reception.received} of={overview.reception.ordered} label="recibidas" />
            <span className="flex-1" />
            {receiveHint && <span className="text-muted-foreground text-xs">{receiveHint}</span>}
            <Button variant="outline" size="sm" onClick={onReceive} disabled={receiveDisabled}>
              Recibir
            </Button>
          </div>
        </BoardRow>
        {cost && (
          <BoardRow
            left={
              <>
                <span className="font-semibold">Costo de producción</span>
                <span className="text-xl font-bold tabular-nums">{money(cost.total)}</span>
                {cost.unitCost !== null && (
                  <span className="text-muted-foreground text-sm tabular-nums">
                    {money(cost.unitCost)} por prenda
                  </span>
                )}
              </>
            }
          >
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm tabular-nums">
              <span>
                <span className="text-muted-foreground">Materiales </span>
                {money(cost.materials)}
              </span>
              <span>
                <span className="text-muted-foreground">Servicios </span>
                {money(cost.services)}
              </span>
            </div>
          </BoardRow>
        )}
      </CardContent>
      {encargarDe && (
        <QuotationFromProcessDialog
          open
          onOpenChange={(abierto) => !abierto && setEncargarDe(null)}
          productionOrderId={productionOrderId}
          productionOrderCode={orderCode}
          processGroupId={encargarDe.processGroupId}
          processName={encargarDe.name}
          stepOrder={encargarDe.stepOrder}
          orderQuantity={prendas.items.reduce((sum, item) => sum + item.quantity, 0)}
          items={prendas.items}
          onCreated={() => {
            setEncargarDe(null);
            onAdvanced();
          }}
        />
      )}
    </Card>
  );
};

/**
 * Lo que cuenta de una O/C: lo cortado de cada talla y, en la que aún no se
 * registra, lo pedido (202610280003).
 */
const cuentaDe = (cut: CutOrder) =>
  cut.items.reduce((sum, line) => sum + (line.cutQuantity ?? line.quantity), 0);

type CortesState = ReturnType<typeof useCutOrders>;

const fmtTela = (value: number) => value.toLocaleString("es-PE", { maximumFractionDigits: 4 });

/** La merma de una O/C por unidad: no se suman kilos con metros. */
const totalesDeMerma = (entradas: CutWasteEntry[]) => {
  const porUnidad = new Map<string, number>();
  entradas.forEach((e) => porUnidad.set(e.unit, (porUnidad.get(e.unit) ?? 0) + e.quantity));
  return [...porUnidad].map(([unit, quantity]) => ({ unit, quantity }));
};

type TelaState = ReturnType<typeof useCutFabric>;

const SIN_PRENDAS: CutAttributeItem[] = [];
const fmtPct = (value: number) => value.toLocaleString("es-PE", { maximumFractionDigits: 1 });

/**
 * La unidad del consumo de una O/C: como el backend, la de la tela principal
 * si la hay; null si va en varias unidades (2026-10-30).
 */
const lineasDelConsumo = (fabrics: CutFabricLine[]) =>
  fabrics.some((f) => f.usage === "MAIN") ? fabrics.filter((f) => f.usage === "MAIN") : fabrics;
const unidadUnica = (fabrics: CutFabricLine[]) => {
  const unidades = new Set(fabrics.map((f) => f.unit));
  return unidades.size === 1 ? [...unidades][0] : null;
};

/**
 * Lo cortado frente a lo pedido (2026-10-28): de más en verde, de menos en
 * rojo, con los textos de estado de neura-styles (success / destructive soft).
 */
const Diferencia = ({ value }: { value: number }) => (
  <span
    className={`ml-1 text-xs font-medium ${
      value > 0 ? "text-success-soft-foreground" : "text-destructive-soft-foreground"
    }`}
  >
    ({value > 0 ? "+" : ""}
    {fmt(value)})
  </span>
);

/**
 * La fila Corte: la tabla resumen de las O/C. Nacen del corte realizado, que
 * se registra con «Iniciar corte» (2026-10-30): una O/C por estilo + color
 * con todas sus tallas y, si el backend la registra en el corte, su tela.
 */
const CorteBlock = ({
  cortes,
  canEdit,
  productionOrderId,
  onCutRegistered,
}: {
  cortes: CortesState;
  canEdit: boolean;
  productionOrderId: number;
  onCutRegistered?: () => void;
}) => {
  const tela = useCutFabric(productionOrderId);
  // 202611100005: sin tela en el corte si el backend lo dice (fabric_by_cut):
  // la del Corte de un proveedor la descuenta su encargo. Enviar la tela al
  // taller desde aquí queda para después.
  const conTela = tela.data?.fabricByCut ?? true;
  const [cortando, setCortando] = useState(false);
  const prendas = cortes.data?.attributes.find((a) => a.termId === null)?.items ?? SIN_PRENDAS;
  const iniciar =
    canEdit && prendas.length > 0 ? (
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setCortando(true)}>
        <Scissors className="h-4 w-4" />
        Iniciar corte
      </Button>
    ) : null;
  return (
    <>
      <CutOrdersTable cortes={cortes} tela={tela} canEdit={canEdit} iniciar={iniciar} conTela={conTela} />
      {cortando && (
        <StartCutDialog
          open
          onOpenChange={setCortando}
          items={prendas}
          cutOrders={cortes.data?.cutOrders ?? []}
          fabric={tela.data}
          nextCode={cortes.nextCode}
          saving={cortes.working}
          fabricAllowed={conTela}
          onSave={async (payload) => {
            // registerCutFull ya relee las O/C y avisa a la página (onChanged).
            const ok = await cortes.registerCutFull(payload);
            if (ok) {
              void tela.reload();
              onCutRegistered?.();
            }
            return ok;
          }}
        />
      )}
    </>
  );
};

/**
 * Corte real por O/C: pedido, cortado y la diferencia, el % del pedido, el
 * consumo unitario (2026-10-30: en su columna, ya no bajo la tela) y la tela
 * que usó (202610280002). Sin el resumen de telas debajo (2026-10-30): repetía
 * la columna Tela.
 */
const CutOrdersTable = ({
  cortes,
  tela,
  canEdit,
  iniciar,
  conTela,
}: {
  cortes: CortesState;
  tela: TelaState;
  canEdit: boolean;
  /** El botón «Iniciar corte», junto a la fecha programada. */
  iniciar: ReactNode;
  /** Sin tela en el corte (202611100005): sin consumo, tela ni merma. */
  conTela: boolean;
}) => {
  const cutOrders = cortes.data?.cutOrders ?? [];
  const telaDe = (cutOrderId: number) => tela.data?.cutOrders.find((c) => c.cutOrderId === cutOrderId);
  // 202611060010: por id, para que el diálogo siga a la tela recargada.
  const [mermaDe, setMermaDe] = useState<number | null>(null);
  const corteDeMerma = mermaDe === null ? undefined : telaDe(mermaDe);

  if (cortes.loading && !cortes.data) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando cortes...
      </div>
    );
  }
  // 202610280015: la fecha pactada del Corte, una para la OP. Se pacta antes
  // de cortar: va aunque aún no haya O/C. Es la que lee el Plan.
  const fechaProgramada = (
    <div className="mb-3 flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium">Fecha programada de corte</span>
      <div className="w-44">
        <DateField
          value={cortes.data?.cutPlannedDate ?? null}
          onChange={(fecha) => void cortes.setPlannedDate(fecha)}
          disabled={!canEdit || cortes.working}
          maxDate={null}
          showClear
        />
      </div>
      {iniciar}
    </div>
  );
  if (cutOrders.length === 0) {
    return (
      <>
        {fechaProgramada}
        <p className="text-muted-foreground text-sm">Aún no hay O/C: usa «Iniciar corte».</p>
      </>
    );
  }

  const pedido = cutOrders.reduce((sum, cut) => sum + cut.total, 0);
  // Con algo cortado, el total suma lo de las O/C sin cortar por lo pedido.
  const cortado = cutOrders.reduce((sum, cut) => sum + cuentaDe(cut), 0);
  const algunoCortado = cutOrders.some((cut) => cut.cutTotal !== null);
  const diferenciaTotal = cortado - pedido;

  // La tela total, solo si toda va en la misma unidad (no se suman metros con kilos).
  const telaCortes = tela.data?.cutOrders ?? [];
  const unidadesTela = new Set(telaCortes.flatMap((c) => c.fabrics.map((f) => f.unit)));
  const telaTotal = telaCortes.reduce((sum, c) => sum + (c.net ?? 0), 0);
  const unidadTotal = unidadesTela.size === 1 ? [...unidadesTela][0] : null;
  // El consumo total, con la misma regla que el de cada O/C: la tela
  // principal si la hay, y solo si va en una sola unidad.
  const conConsumo = telaCortes
    .filter((c) => (c.garments ?? 0) > 0 && c.fabrics.length > 0)
    .map((c) => ({ garments: c.garments as number, lineas: lineasDelConsumo(c.fabrics) }));
  const unidadConsumoTotal = unidadUnica(conConsumo.flatMap((c) => c.lineas));
  const netoConsumo = conConsumo.reduce(
    (sum, c) => sum + c.lineas.reduce((s, f) => s + f.used - f.leftover, 0),
    0
  );
  const prendasConsumo = conConsumo.reduce((sum, c) => sum + c.garments, 0);
  const consumoTotal =
    unidadConsumoTotal !== null && prendasConsumo > 0 ? netoConsumo / prendasConsumo : null;

  // 2026-10-30: 7 columnas; el color sigue bajo la O/C y la diferencia junto
  // a lo cortado. El consumo unitario sale a su columna.
  return (
    <>
      {fechaProgramada}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>O/C</TableHead>
            <TableHead className="text-right">Pedido</TableHead>
            <TableHead className="text-right">Cortado</TableHead>
            <TableHead className="text-right">% del pedido</TableHead>
            {conTela && <TableHead className="text-right">Consumo unit.</TableHead>}
            {conTela && <TableHead className="text-right">Tela</TableHead>}
            <TableHead>Fch. real</TableHead>
            {conTela && <TableHead>Merma</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {cutOrders.map((cut) => {
            const diferencia = cut.cutTotal === null ? null : cut.cutTotal - cut.total;
            const suTela = telaDe(cut.id);
            const unidad = unidadUnica(suTela?.fabrics ?? []);
            const variasUnidades = unidad === null && (suTela?.fabrics.length ?? 0) > 1;
            const unidadConsumo = unidadUnica(lineasDelConsumo(suTela?.fabrics ?? []));
            return (
              <TableRow key={cut.id}>
                <TableCell className="py-2">
                  <div className="whitespace-nowrap font-medium">{cut.code}</div>
                  <div className="text-muted-foreground text-xs">{cut.termName ?? "—"}</div>
                </TableCell>
                <TableCell className="py-2 text-right tabular-nums">{fmt(cut.total)}</TableCell>
                <TableCell className="whitespace-nowrap py-2 text-right tabular-nums">
                  {cut.cutTotal === null ? "—" : fmt(cut.cutTotal)}
                  {diferencia !== null && diferencia !== 0 && (
                    <Diferencia value={diferencia} />
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap py-2 text-right tabular-nums">
                  {cut.orderPercent === null ? "—" : `${fmtPct(cut.orderPercent)} %`}
                </TableCell>
                {conTela && (
                  <TableCell className="whitespace-nowrap py-2 text-right tabular-nums">
                    {suTela?.realConsumption == null ? (
                      "—"
                    ) : suTela.fabrics.length > 1 ? (
                      // Con varias telas, el consumo de cada una (202611040003).
                      suTela.fabrics.map((f) => (
                        <div key={f.materialVariationId}>
                          <span className="text-muted-foreground mr-1 text-xs">
                            {f.usage ? CUT_FABRIC_USAGE_LABELS[f.usage] : f.label}
                          </span>
                          {f.consumption === null ? "—" : fmtTela(f.consumption)}
                          <span className="text-muted-foreground ml-1 text-xs">
                            {f.unit ? `${f.unit}/prenda` : "/prenda"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <>
                        {fmtTela(suTela.realConsumption)}
                        <span className="text-muted-foreground ml-1 text-xs">
                          {unidadConsumo ? `${unidadConsumo}/prenda` : "/prenda"}
                        </span>
                      </>
                    )}
                  </TableCell>
                )}
                {conTela && (
                  <TableCell className="whitespace-nowrap py-2 text-right tabular-nums">
                    {suTela?.net == null ? (
                      "—"
                    ) : variasUnidades ? (
                      `${suTela.fabrics.length} telas`
                    ) : (
                      <>
                        {fmtTela(suTela.net)}
                        {unidad && <span className="text-muted-foreground ml-1 text-xs">{unidad}</span>}
                      </>
                    )}
                  </TableCell>
                )}
                <TableCell className="whitespace-nowrap py-2 tabular-nums">
                  {cut.cutOn ? formatDateDisplay(cut.cutOn) : "—"}
                </TableCell>
                {conTela && (
                  <TableCell className="py-2">
                    <div className="flex flex-col items-start gap-1">
                      {totalesDeMerma(suTela?.waste ?? []).map((total) => (
                        <span key={total.unit} className="whitespace-nowrap text-sm tabular-nums">
                          {fmtTela(total.quantity)}
                          <span className="text-muted-foreground ml-1 text-xs">{total.unit}</span>
                        </span>
                      ))}
                      {canEdit && (suTela?.fabrics.length ?? 0) > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap"
                          onClick={() => setMermaDe(cut.id)}
                        >
                          Ingresar merma
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="py-2">Total</TableCell>
            <TableCell className="py-2 text-right tabular-nums">{fmt(pedido)}</TableCell>
            <TableCell className="whitespace-nowrap py-2 text-right tabular-nums">
              {algunoCortado ? fmt(cortado) : "—"}
              {algunoCortado && diferenciaTotal !== 0 && (
                <Diferencia value={diferenciaTotal} />
              )}
            </TableCell>
            <TableCell className="whitespace-nowrap py-2 text-right tabular-nums">
              {algunoCortado && pedido > 0 ? `${fmtPct((cortado * 100) / pedido)} %` : ""}
            </TableCell>
            {conTela && (
              <TableCell className="whitespace-nowrap py-2 text-right tabular-nums">
                {consumoTotal !== null && (
                  <>
                    {fmtTela(consumoTotal)}
                    <span className="text-muted-foreground ml-1 text-xs">
                      {unidadConsumoTotal ? `${unidadConsumoTotal}/prenda` : "/prenda"}
                    </span>
                  </>
                )}
              </TableCell>
            )}
            {conTela && (
              <TableCell className="whitespace-nowrap py-2 text-right tabular-nums">
                {telaTotal > 0 && unidadesTela.size <= 1 ? (
                  <>
                    {fmtTela(telaTotal)}
                    {unidadTotal && <span className="text-muted-foreground ml-1 text-xs">{unidadTotal}</span>}
                  </>
                ) : (
                  ""
                )}
              </TableCell>
            )}
            <TableCell className="py-2" />
            {conTela && <TableCell className="py-2" />}
          </TableRow>
        </TableFooter>
      </Table>

      {corteDeMerma && (
        <IngresarMermaDialog
          open
          onOpenChange={(abierto) => !abierto && setMermaDe(null)}
          corte={corteDeMerma}
          warehouses={tela.data?.warehouses ?? []}
          onChanged={tela.reload}
        />
      )}
    </>
  );
};
