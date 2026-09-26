import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EntityCombobox } from "../EntityCombobox";
import { ExplosionMaterial } from "../../types/explosions.types";
import { MaterialOption } from "../../types/services.types";
import { VariationOption } from "../../services/productionOrders.service";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { optionKey } from "../../hooks/useExplosionDetail";
import { Label } from "@/components/ui/label";

interface ExplosionMaterialsEditorProps {
  lines: ExplosionMaterial[];
  materials: MaterialOption[];
  search: string;
  onSearchChange: (value: string) => void;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
  onSelectMaterial: (index: number, material: MaterialOption) => void;
  onChangeQuantity: (index: number, value: string) => void;
  /**
   * Las prendas que cubre la receta. Son las filas del desplegable «Por
   * prenda»: sin prendas no hay excepciones que declarar.
   */
  variations: VariationOption[];
  /** Vacio quita la excepcion y la prenda vuelve a la cantidad general. */
  onChangeVariationQuantity: (
    index: number,
    variationId: number,
    value: string,
  ) => void;

  /** Alta de un material que todavía no existe, desde la fila que lo necesita. */
  onCreateMaterial: (index: number) => void;
  /**
   * Edición del material de la fila. Lo que se edita es el material del
   * CATÁLOGO, así que se pasa su id y no el índice: el cambio alcanza a todas
   * las líneas que lo usen.
   */
  onEditMaterial: (materialId: number) => void;
  previewTotal: number;
  /**
   * Solo lectura: entrar a una receta no debería dejar tocarla. Aquí no se
   * deshabilitan los campos, se sustituyen por texto -- un formulario en gris
   * sigue pareciendo un formulario, y lo que se quiere es leer.
   */
  readOnly?: boolean;
}

export const ExplosionMaterialsEditor = ({
  lines,
  materials,
  search,
  onSearchChange,
  onAddLine,
  onRemoveLine,
  onSelectMaterial,
  onChangeQuantity,
  variations,
  onChangeVariationQuantity,
  onCreateMaterial,
  onEditMaterial,
  previewTotal,
  readOnly = false,
}: ExplosionMaterialsEditorProps) => {
  // Una opción por VARIACIÓN ("Jersey 30/1 · Negro"): dos colores del mismo
  // material son dos opciones.
  const options = materials.map((material) => ({
    id: optionKey(material),
    label: material.name,
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Materiales por producto</h2>
        {!readOnly && (
          <Button type="button" variant="outline" onClick={onAddLine} className="gap-2">
            <Plus className="w-4 h-4" />
            Añadir material
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Material</TableHead>
            {/* Al costado del material, como en el papel del taller: ahí la
                clase es el «Tipo:» que agrupa las líneas. Se lee, no se
                edita -- la clase es del material, no de esta receta. */}
            <TableHead className="w-32">Clase</TableHead>
            {/* Es el consumo POR UNIDAD de prenda: el backend lo multiplica
                después por las prendas de la orden. Decir «Cantidad» a secas
                invitaba a teclear el total del lote, y ese error no da ningún
                aviso -- la explosión saldría multiplicada dos veces. */}
            <TableHead className="w-36 text-right">Consumo unitario</TableHead>
            {/* La excepcion por prenda. Sin prendas en la receta no hay nada
                que declarar y la columna sobra. */}
            {variations.length > 0 && (
              <TableHead className="w-32">Por prenda</TableHead>
            )}
            <TableHead className="w-20">UM</TableHead>
            <TableHead className="w-32 text-right">Costo unit.</TableHead>
            <TableHead className="w-32 text-right">Subtotal</TableHead>
            {!readOnly && <TableHead className="w-12" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={(readOnly ? 6 : 7) + (variations.length > 0 ? 1 : 0)}
                className="text-center text-muted-foreground p-8"
              >
                {readOnly
                  ? "Esta receta todavía no tiene materiales."
                  : "Sin materiales. Añade al menos uno para que el desarrollo tenga total."}
              </TableCell>
            </TableRow>
          ) : (
            lines.map((line, index) => (
              <TableRow key={line.id ?? `new-${index}`}>
                <TableCell>
                  {readOnly ? (
                    <span className="font-medium">
                      {line.materialName || "—"}
                    </span>
                  ) : (
                  <div className="flex min-w-0 gap-2">
                    <EntityCombobox
                      className="min-w-0 flex-1"
                      options={options}
                      value={
                        line.materialId
                          ? optionKey({ id: line.materialId, materialVariationId: line.materialVariationId })
                          : null
                      }
                      onSelect={(option) => {
                        const material = materials.find((m) => optionKey(m) === option.id);
                        if (material) onSelectMaterial(index, material);
                      }}
                      search={search}
                      onSearchChange={onSearchChange}
                      placeholder="Seleccionar material..."
                      searchPlaceholder="Buscar material..."
                      fallbackLabel={line.materialName}
                    />
                    {/* Crear el material aquí mismo: si todavía no existe,
                        salir a Materiales y volver era el único motivo para
                        abandonar la receta a medio armar. Mismo patrón que el
                        alta de explosión en la orden de producción. */}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => onCreateMaterial(index)}
                      aria-label="Crear material para esta línea"
                      title="Crear material"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    {/* Corregir el material sin abandonar la receta: la clase,
                        la unidad y el costo que se leen a la derecha son suyos,
                        y hasta ahora arreglar uno mal cargado obligaba a salir
                        a Materiales y volver a armar esto. Solo con material
                        elegido: sobre una fila vacía no hay nada que editar. */}
                    {line.materialId > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => onEditMaterial(line.materialId)}
                        aria-label={`Editar ${line.materialName || "material"}`}
                        title="Editar material"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {line.materialClassName || "—"}
                </TableCell>
                <TableCell className={readOnly ? "text-right" : undefined}>
                  {readOnly ? (
                    <span className="tabular-nums">
                      {line.quantity === null ? "—" : line.quantity}
                    </span>
                  ) : (
                    <Input
                      type="number"
                      step="0.01"
                      className="text-right"
                      value={line.quantity === null ? "" : line.quantity}
                      onChange={(e) => onChangeQuantity(index, e.target.value)}
                      placeholder="0"
                    />
                  )}
                </TableCell>
                {variations.length > 0 && (
                <TableCell>
                  {/* Por prenda.
                  
                      La cantidad de arriba vale para TODAS; aqui se declara la
                      excepcion de la que no la cumple: «la XL lleva 1.6», «la S
                      no lo lleva» (cero). Vacio devuelve la prenda a la
                      general, que es la unica forma de deshacer una excepcion
                      sin tener que reteclear el numero de arriba.

                      Solo con prendas en la receta: sin ellas no hay a quien
                      declararle nada, y un desplegable vacio invita a buscar
                      lo que no existe. */}
                  {readOnly && (
                    <span className="text-muted-foreground text-xs">
                      {line.variations.length === 0
                        ? "Igual en todas"
                        : `${line.variations.length} ${
                            line.variations.length === 1
                              ? "excepción"
                              : "excepciones"
                          }`}
                    </span>
                  )}
                  {!readOnly && (
                    /* Un diálogo y no un popover: la tabla scrollea en
                       horizontal y el panel anclado a la celda se quedaba
                       estrecho y a medio recortar en cuanto la receta tenía
                       varias prendas. */
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 px-2 text-xs"
                          title="Cantidad distinta para alguna prenda"
                        >
                          <Layers className="h-3.5 w-3.5" />
                          {line.variations.length > 0 ? (
                            <Badge variant="secondary" className="px-1.5 py-0">
                              {line.variations.length}
                            </Badge>
                          ) : (
                            "Por prenda"
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="flex max-h-[85vh] w-[calc(100vw-2rem)] flex-col overflow-hidden sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>
                            Consumo por prenda
                            {line.materialName ? ` · ${line.materialName}` : ""}
                          </DialogTitle>
                          <DialogDescription>
                            Vacío usa la cantidad general
                            {line.quantity !== null ? ` (${line.quantity})` : ""}.
                            Cero significa que esa prenda no lo lleva.
                          </DialogDescription>
                        </DialogHeader>

                        {/* pr-2 y no pr-1: el anillo de foco del input se
                            pinta 4 px POR FUERA de su borde, y con 4 px de
                            hueco --menos aun si el sistema dibuja la barra de
                            scroll dentro-- el contenedor se lo comia. */}
                        <div className="min-h-0 flex-1 overflow-y-auto pl-1 pr-2">
                          <div className="space-y-3">
                            {variations.map((variation) => {
                              const excepcion = line.variations.find(
                                (v) => v.variationId === variation.id,
                              );
                              return (
                                <div
                                  key={variation.id}
                                  /* 7rem y no 5.5rem: con 88 px el numero no
                                     cabia dentro del input. Medido: "1234.56"
                                     pide 91 px de contenido y solo habia 86,
                                     asi que se cortaba el ultimo digito. */
                                  className="grid grid-cols-[1fr_7rem] items-center gap-3"
                                >
                                  <Label
                                    htmlFor={`emv-${index}-${variation.id}`}
                                    className="truncate text-xs font-normal"
                                    title={variation.label}
                                  >
                                    {variation.label}
                                  </Label>
                                  <Input
                                    id={`emv-${index}-${variation.id}`}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    /* Sin las flechas del number: aqui se
                                       teclea un decimal, no se sube de uno en
                                       uno, y le robaban ~20 px al numero. El
                                       mismo tratamiento que los inputs de
                                       stock del inventario de productos. */
                                    className="h-8 text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    value={excepcion ? excepcion.quantity : ""}
                                    placeholder={
                                      line.quantity === null
                                        ? "0"
                                        : String(line.quantity)
                                    }
                                    onChange={(e) =>
                                      onChangeVariationQuantity(
                                        index,
                                        variation.id,
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </TableCell>
                )}

                <TableCell className="text-muted-foreground text-sm">
                  {line.measurementUnit || "—"}
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-sm">
                  {line.unitCost === null ? "—" : line.unitCost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {((line.quantity ?? 0) * (line.unitCost ?? 0)).toFixed(2)}
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveLine(index)}
                      aria-label="Quitar línea"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Previsualización: el total que se guarda lo calcula el backend. */}
      <div className="flex justify-end gap-4 pr-4 text-sm">
        <span className="text-muted-foreground">Total estimado</span>
        <span className="font-semibold tabular-nums">{previewTotal.toFixed(2)}</span>
      </div>
    </div>
  );
};
