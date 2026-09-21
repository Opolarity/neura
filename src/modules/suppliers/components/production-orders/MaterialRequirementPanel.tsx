import { useMemo, useState } from "react";
import { Loader2, Package, ShoppingCart } from "lucide-react";
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
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { useMaterialRequirement } from "../../hooks/useMaterialRequirement";
import { MaterialPurchaseDialog } from "./MaterialPurchaseDialog";
import { MaterialRequirementRow } from "../../types/materialRequirement.types";
import { ProductionOrderPurchases } from "./ProductionOrderPurchases";

interface MaterialRequirementPanelProps {
  productionOrderId: number | null;
  /** OP-0001 / OM-0001. Encabeza el bloque cuando se pinta con título. */
  orderCode?: string | null;
  /** Cambia al guardar los ítems: otra cantidad, otro requerimiento. */
  reloadKey?: number;
  /**
   * Dentro de una pestaña el título sobra: lo dice ya la etiqueta. Se oculta
   * solo el bloque de la izquierda; lo de la derecha de esa fila se queda.
   */
  showHeading?: boolean;
}

const fmt = (value: number) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 3 }).format(value);

const money = (value: number | null) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: "PEN",
      }).format(value);

/**
 * Cuánto material hace falta para producir lo que pide la orden.
 *
 * Es la explosión de la orden ENTERA: una fila por material, con lo que hay que
 * comprar en total. No va seccionada por prenda —así estaba antes— porque esa
 * vista respondía a la pregunta equivocada: lo que se hace con este cuadro es
 * comprar, y se compra el material una vez para toda la orden, no por prenda.
 *
 * Partirlo por prenda además obligaba a repetir el stock y el faltante en cada
 * grupo que compartiera un material —son de la orden, no atribuibles a una
 * prenda— y a leer tres bloques para saber cuánto jersey hay que pedir.
 *
 * La explosión guarda el consumo por UNIDAD; el backend lo multiplica por la
 * cantidad de cada prenda con la misma fórmula que usa para descontar el stock,
 * así que lo que se ve aquí y lo que se descuenta al guardar no pueden
 * discrepar. Aquí no se suma nada: los totales vienen calculados.
 */
export const MaterialRequirementPanel = ({
  productionOrderId,
  orderCode,
  reloadKey = 0,
  showHeading = true,
}: MaterialRequirementPanelProps) => {
  const { requirement, loading, reload } = useMaterialRequirement(
    productionOrderId,
    reloadKey
  );

  const [comprando, setComprando] = useState(false);
  /**
   * El material que se está comprando desde su propia fila, o null.
   *
   * Es la misma idea que cotizar un proceso desde la ruta: el documento se
   * enlaza DESDE la cosa que lo necesita, y el pop-up pregunta lo suyo. Para
   * un material suelto no hay nada que elegir ni pasos que recorrer, que es
   * lo que hacía lento entrar por «Comprar material» para una sola línea.
   */
  const [comprandoUno, setComprandoUno] = useState<MaterialRequirementRow | null>(
    null,
  );

  /** Sube al crear una compra: es lo que hace que aparezca sin recargar. */
  const [comprasKey, setComprasKey] = useState(0);

  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });

  const materials = requirement?.materials ?? [];

  /** Cuántos materiales no alcanzan. Es lo que decide si se puede comprar. */
  const faltantes = materials.filter((material) => material.missing > 0).length;

  // El SP devuelve la orden entera en una llamada -- está acotada por sus
  // ítems -- así que el corte por página se hace aquí.
  const pageMaterials = useMemo(() => {
    const start = (pagination.p_page - 1) * pagination.p_size;
    return materials.slice(start, start + pagination.p_size);
  }, [materials, pagination.p_page, pagination.p_size]);

  if (productionOrderId === null) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {showHeading ? (
          <div>
            <h2 className="text-lg font-semibold">
              Explosión de materiales
              {orderCode && (
                <span className="text-muted-foreground font-normal">
                  {" · O. Producción "}
                  {orderCode}
                </span>
              )}
            </h2>
            <p className="text-muted-foreground text-xs">
              El consumo de la ficha por la cantidad de cada prenda, sumado para
              toda la orden.
            </p>
          </div>
        ) : (
          // Placeholder para que el costo estimado siga a la derecha.
          <span />
        )}
        {materials.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm">
              Costo estimado{" "}
              <span className="font-semibold tabular-nums">
                {money(requirement?.estimatedTotalCost ?? 0)}
              </span>
            </span>

            {/* Con que haya materiales. Antes solo salía cuando faltaba algo,
                y eso decidía por el usuario: reponer un material que hoy
                alcanza obligaba a salir a Cotizaciones y armarla a mano. El
                diálogo abre marcado solo lo que falta, así que comprar de más
                sigue siendo una decisión y no un descuido. */}
            {materials.length > 0 && productionOrderId !== null && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setComprando(true)}
                title={
                  faltantes > 0
                    ? `Crear las cotizaciones de lo que falta ()`
                    : "Crear una cotización de material para esta orden"
                }
              >
                <ShoppingCart className="h-4 w-4" />
                Comprar material
                {faltantes > 0 && (
                  <Badge variant="warning" className="px-1.5 py-0">
                    {faltantes}
                  </Badge>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          Calculando...
        </div>
      ) : materials.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
          <Package className="h-7 w-7 opacity-50" />
          <p className="text-sm">
            Ningún ítem tiene explosión asignada, así que no hay consumo que
            calcular.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-48">Material</TableHead>
                  {/* La misma columna que la receta: es el «Tipo:» por el que
                      el papel del taller agrupa las líneas. */}
                  <TableHead>Clase</TableHead>
                  <TableHead>U.M</TableHead>
                  <TableHead className="text-right">Total req.</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Faltante</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageMaterials.map((material) => (
                  // El faltante NO tiñe la fila: la falta de material es
                  // información de una sola columna, y pintar la línea entera
                  // de rojo leía como error de la fila -- el material está bien
                  // cargado, solo hay que comprar más.
                  <TableRow key={material.materialId}>
                    <TableCell className="font-medium">
                      {material.materialName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {material.materialClassName ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {material.measurementUnit}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmt(material.totalRequired)}
                    </TableCell>
                    {/* El total arriba --es contra el que se calcula el
                        faltante-- y debajo, solo cuando lo hay, cuánto de ese
                        saldo ya está en un taller. En ámbar cuando lo mío no
                        alcanza y el total solo cuadra gracias a esa parte: es
                        el caso que hoy se lee como «no falta nada» teniendo el
                        almacén vacío. */}
                    <TableCell className="text-right tabular-nums">
                      <div>{fmt(material.stock)}</div>
                      {material.stockAtSuppliers > 0 && (
                        <div
                          className={
                            material.stockOwn < material.totalRequired
                              ? "text-warning text-xs"
                              : "text-muted-foreground text-xs"
                          }
                          title={
                            `En mis almacenes: ${fmt(material.stockOwn)} · ` +
                            `en talleres: ${fmt(material.stockAtSuppliers)}`
                          }
                        >
                          {fmt(material.stockAtSuppliers)} en talleres
                        </div>
                      )}
                    </TableCell>
                    <TableCell
                      className={
                        material.missing > 0
                          ? "text-destructive text-right font-medium tabular-nums"
                          : "text-muted-foreground text-right tabular-nums"
                      }
                    >
                      {material.missing > 0 ? fmt(material.missing) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {money(material.totalCost)}
                    </TableCell>

                    {/* Comprar ESTE material, sin pasar por la lista entera.
                        Abre el mismo diálogo con una sola línea, ya marcada:
                        un proveedor, una orden, una pantalla. */}
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setComprandoUno(material)}
                        title={`Generar orden de compra de ${material.materialName}`}
                        aria-label={`Generar orden de compra de ${material.materialName}`}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <PaginationBar
            pagination={{ ...pagination, total: materials.length }}
            onPageChange={(page) =>
              setPagination((prev) => ({ ...prev, p_page: page }))
            }
            onPageSizeChange={(size) =>
              setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }))
            }
          />
        </>
      )}

      <ProductionOrderPurchases
        productionOrderId={productionOrderId}
        reloadKey={comprasKey}
      />

      {/* El de UNA fila. Mismo diálogo, con un solo material y ya marcado:
          sale una sola orden, así que se ve y se crea en una pantalla. */}
      {comprandoUno && productionOrderId !== null && (
        <MaterialPurchaseDialog
          open
          onOpenChange={(next) => {
            if (!next) setComprandoUno(null);
          }}
          productionOrderId={productionOrderId}
          orderCode={orderCode ?? null}
          materials={[comprandoUno]}
          marcarTodo
          onCreated={() => {
            reload();
            setComprasKey((key) => key + 1);
          }}
        />
      )}

      {/* Se monta al abrir: arranca leyendo los proveedores de cada material y
          cerrar sin guardar no deja nada a medias. */}
      {comprando && productionOrderId !== null && (
        <MaterialPurchaseDialog
          open
          onOpenChange={setComprando}
          productionOrderId={productionOrderId}
          orderCode={orderCode ?? null}
          materials={materials}
          onCreated={() => {
            reload();
            setComprasKey((key) => key + 1);
          }}
        />
      )}
    </div>
  );
};
