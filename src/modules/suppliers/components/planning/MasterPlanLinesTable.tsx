import { Eye, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateDisplay } from "@/shared/utils/date";
import {
  MasterPlanLine,
  MasterPlanLineProcess,
  MasterPlanLinesResponse,
  MasterPlanStage,
  MasterPlanStageKey,
} from "../../types/planning.types";
import {
  MASTER_PLAN_STATES,
  STAGE_STATES,
  processBadge,
  stageWorkshop,
} from "../../utils/planningStatus";
import { tallerCorto } from "../../utils/routeServiceSchedule";

const fmt = (value: number) => value.toLocaleString("es-PE");
const fecha = (value: string | null) => (value ? formatDateDisplay(value) : "—");

/**
 * La clave con la que una talla es columna. Sin distinguir mayúsculas ni
 * espacios de los extremos (2026-10-22): el backend ya normaliza, pero la
 * cabecera y las celdas se cruzan por esta clave y basta una grafía heredada
 * para que una fila no encuentre su columna y la cantidad salga 0.
 */
const sizeKey = (size: string | null) => size?.trim().toUpperCase() || "Otros";

/** El destino de un proceso (quién lo hace) y su avance, como «Destino corte / costura». */
const ProcessCell = ({ process }: { process: MasterPlanLineProcess | undefined }) => {
  if (!process) return <span className="text-muted-foreground">—</span>;
  const percent = process.requested > 0 ? (100 * process.advanced) / process.requested : null;
  const badge = processBadge(process.status, process.lateDays, percent);
  const quien = tallerCorto(process.supplierName) ?? "Sin encargo";
  const title = [
    process.name,
    process.supplierName ?? "Proveedor, sin encargo",
    `${fmt(process.advanced)} de ${fmt(process.requested)}`,
    process.promisedDate ? `Pactada ${fecha(process.promisedDate)}` : null,
    process.endDate ? `Terminada ${fecha(process.endDate)}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  return (
    <div className="flex flex-col gap-1" title={title}>
      <span className="whitespace-nowrap text-xs">{quien}</span>
      <Badge variant={badge.variant} className="w-fit whitespace-nowrap">
        {badge.label}
      </Badge>
    </div>
  );
};

/**
 * Los tres bloques de la planilla del taller, cada uno con sus columnas.
 * Corte lleva fecha real y cantidad real; Costura, inicio programado y fin
 * real (la recepción del proveedor); Acabado, inicio y fin programados.
 */
type StageColumn = "taller" | "inicio" | "prog" | "real" | "cantidad" | "porcentaje" | "avance" | "estado";
const BLOQUES: Array<{ key: MasterPlanStageKey; title: string; cols: Array<{ col: StageColumn; label: string }> }> = [
  {
    key: "cut",
    title: "Corte",
    cols: [
      { col: "taller", label: "Taller" },
      { col: "prog", label: "Fch. Prog." },
      { col: "real", label: "Fch. Real" },
      { col: "cantidad", label: "Cant. Real" },
      { col: "porcentaje", label: "% Corte" },
      { col: "estado", label: "Estado" },
    ],
  },
  {
    key: "sewing",
    title: "Costura",
    cols: [
      { col: "taller", label: "Taller" },
      { col: "inicio", label: "Fch. Prog. Inicio" },
      { col: "real", label: "Fch. Real Fin" },
      { col: "avance", label: "Avance" },
      { col: "estado", label: "Estado" },
    ],
  },
  {
    key: "finishing",
    title: "Acabado",
    cols: [
      { col: "taller", label: "Taller" },
      { col: "inicio", label: "Fch. Prog. Inicio" },
      { col: "prog", label: "Fch. Prog. Fin" },
      { col: "avance", label: "Avance" },
      { col: "estado", label: "Estado" },
    ],
  },
];
const COLUMNAS_BLOQUES = BLOQUES.reduce((sum, b) => sum + b.cols.length, 0);

/** Las celdas de un bloque; si la OP no hace ese servicio, una sola: «No aplica». */
const StageCells = ({ stageKey, stage, cols }: { stageKey: MasterPlanStageKey; stage: MasterPlanStage; cols: StageColumn[] }) => {
  if (!stage.applies) {
    return (
      <TableCell colSpan={cols.length} className="text-muted-foreground whitespace-nowrap text-center">
        No aplica
      </TableCell>
    );
  }
  const badge = STAGE_STATES[stageKey][stage.status];
  const porcentaje = stage.percent === null ? "—" : `${fmt(stage.percent)}%`;
  return (
    <>
      {cols.map((col) => {
        switch (col) {
          case "taller":
            return (
              <TableCell key={col} className="whitespace-nowrap text-xs" title={stage.workshop ?? undefined}>
                {stageWorkshop(stage, tallerCorto)}
              </TableCell>
            );
          case "inicio":
            return <TableCell key={col} className="whitespace-nowrap tabular-nums">{fecha(stage.plannedStart)}</TableCell>;
          case "prog":
            return <TableCell key={col} className="whitespace-nowrap tabular-nums">{fecha(stage.plannedEnd)}</TableCell>;
          case "real":
            return <TableCell key={col} className="whitespace-nowrap tabular-nums">{fecha(stage.actualEnd)}</TableCell>;
          case "cantidad":
            return (
              <TableCell key={col} className="text-right tabular-nums">
                {stage.advanced === null || stage.advanced === 0 ? "—" : fmt(stage.advanced)}
              </TableCell>
            );
          case "porcentaje":
          case "avance":
            return (
              <TableCell
                key={col}
                className="text-right tabular-nums"
                title={stage.requested !== null ? `${fmt(stage.advanced ?? 0)} de ${fmt(stage.requested)}` : undefined}
              >
                {porcentaje}
              </TableCell>
            );
          case "estado":
            return (
              <TableCell key={col}>
                <Badge variant={badge.variant} className="whitespace-nowrap">
                  {badge.label}
                </Badge>
              </TableCell>
            );
        }
      })}
    </>
  );
};

interface MasterPlanLinesTableProps {
  plan: MasterPlanLinesResponse;
  loading: boolean;
  onOpen: (line: MasterPlanLine) => void;
}

/**
 * El Plan de producción como el «Maestro Programa de Producción»: una fila por
 * OP × O/C × estilo × color, con las tallas en columnas y los bloques Corte,
 * Costura y Acabado de la planilla del taller. Overtake no maquila: sin
 * cliente, OS/O/P del cliente ni entrega al cliente.
 * Solo lectura: el ojo abre la OP.
 */
export const MasterPlanLinesTable = ({ plan, loading, onOpen }: MasterPlanLinesTableProps) => {
  const tallas = plan.sizes;
  const procesos = plan.processes;
  // Por bloques, en el orden de la cabecera: documento (5), el cuadro de
  // tallas, la cantidad (1), Corte / Costura / Acabado, y el cierre (3).
  const colSpan = 5 + tallas.length + 1 + COLUMNAS_BLOQUES + 3;
  // La celda fija necesita un fondo OPACO: con bg-inherit toma el de la fila,
  // que en las impares no existe y en las pares es plomo al 50 %, y lo que
  // pasa por debajo al desplazar se veía a través. Aquí: blanco, con el mismo
  // plomo al 50 % encima en las pares, y el plomo del hover de la fila.
  const sticky =
    "sticky left-0 z-[1] bg-background " +
    "[tr:nth-child(even)>&]:[background-image:linear-gradient(hsl(var(--muted)/0.5),hsl(var(--muted)/0.5))] " +
    "[tr:hover>&]:bg-muted [tr:hover>&]:[background-image:none]";

  return (
    // Alto fijo con scroll interno: las filas son altas y sin tope empujaban
    // la paginación fuera de la pantalla.
    <Table className="min-w-max" containerClassName="max-h-[60vh]">
      <TableHeader>
        <TableRow>
          <TableHead rowSpan={2} className="whitespace-nowrap">Fch. Doc.</TableHead>
          {/* El encabezado fijo conserva su fondo: va sobre las filas al desplazar. */}
          <TableHead rowSpan={2} className="sticky left-0 z-20 bg-background">OP</TableHead>
          <TableHead rowSpan={2}>O/C</TableHead>
          <TableHead rowSpan={2}>Modelo</TableHead>
          <TableHead rowSpan={2}>Color</TableHead>
          {tallas.map((t) => (
            <TableHead rowSpan={2} key={sizeKey(t.size)} className="text-right">
              {sizeKey(t.size)}
            </TableHead>
          ))}
          <TableHead rowSpan={2} className="whitespace-nowrap text-right">Cant. Prog.</TableHead>
          {/* Corte, Costura y Acabado, como en la planilla. */}
          {BLOQUES.map((bloque) => (
            <TableHead
              key={bloque.key}
              colSpan={bloque.cols.length}
              className="h-10 border-l text-center uppercase tracking-wide"
            >
              {bloque.title}
            </TableHead>
          ))}
          <TableHead rowSpan={2}>Otros</TableHead>
          <TableHead rowSpan={2}>Estado</TableHead>
          <TableHead rowSpan={2} className="w-16">Acciones</TableHead>
        </TableRow>
        {/* La segunda fila queda fija debajo de la primera (h-10). */}
        <TableRow>
          {BLOQUES.flatMap((bloque) =>
            bloque.cols.map((c, i) => (
              <TableHead
                key={`${bloque.key}-${c.col}`}
                className={`top-10 whitespace-nowrap ${i === 0 ? "border-l" : ""} ${
                  c.col === "cantidad" || c.col === "porcentaje" || c.col === "avance" ? "text-right" : ""
                }`}
              >
                {c.label}
              </TableHead>
            ))
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && plan.data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={colSpan} className="py-8 text-center">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando el plan...
              </div>
            </TableCell>
          </TableRow>
        ) : plan.data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={colSpan} className="text-muted-foreground p-10 text-center">
              No hay líneas con estos filtros
            </TableCell>
          </TableRow>
        ) : (
          plan.data.map((line) => {
            const estado = MASTER_PLAN_STATES[line.state];
            const otros = line.processes.filter((p) => !procesos.some((e) => e.processGroupId === p.processGroupId));
            return (
              <TableRow
                key={`${line.productionOrderId}-${line.cutOrderId ?? "x"}-${line.productId}-${line.color}`}
              >
                <TableCell className="whitespace-nowrap tabular-nums">{fecha(line.issueDate)}</TableCell>
                <TableCell className={`${sticky} whitespace-nowrap font-medium tabular-nums`}>
                  {line.productionOrderCode ?? "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">{line.cutCode ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap font-medium" title={line.modelTitle ?? undefined}>
                  {line.model}
                </TableCell>
                <TableCell className="whitespace-nowrap">{line.color ?? "—"}</TableCell>
                {tallas.map((t) => {
                  const q = line.sizes.find((s) => sizeKey(s.size) === sizeKey(t.size))?.quantity ?? 0;
                  return (
                    <TableCell key={sizeKey(t.size)} className="text-right tabular-nums">
                      {q > 0 ? fmt(q) : <span className="text-muted-foreground">0</span>}
                    </TableCell>
                  );
                })}
                <TableCell className="text-right font-semibold tabular-nums">{fmt(line.quantity)}</TableCell>
                {BLOQUES.map((bloque) => (
                  <StageCells
                    key={bloque.key}
                    stageKey={bloque.key}
                    stage={line.stages[bloque.key]}
                    cols={bloque.cols.map((c) => c.col)}
                  />
                ))}
                <TableCell>
                  {otros.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div className="flex gap-3">
                      {otros.map((o) => (
                        <div key={`${o.processGroupId}-${o.name}`} className="flex flex-col gap-0.5">
                          <span className="text-muted-foreground whitespace-nowrap text-[11px]">{o.name}</span>
                          <ProcessCell process={o} />
                        </div>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={estado.variant} className="whitespace-nowrap">
                    {line.lateDays > 0 ? `${estado.label} · ${line.lateDays} d` : estado.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpen(line)}
                    title="Ver la orden de producción"
                    aria-label={`Ver la orden ${line.productionOrderCode ?? ""}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};
