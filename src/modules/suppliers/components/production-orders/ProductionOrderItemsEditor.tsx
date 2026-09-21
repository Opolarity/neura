import { useState } from "react";
import { FilePlus2, Package, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { ExplosionQuickCreateDialog } from "./ExplosionQuickCreateDialog";
import { ItemProductDialog } from "./ItemProductDialog";
import { VariationOption } from "../../services/productionOrders.service";
import { explosionShortLabel } from "../../utils/explosionLabel";
import {
  ExplosionOption,
  ProductionOrderItem,
} from "../../types/productionOrders.types";

interface ProductionOrderItemsEditorProps {
  items: ProductionOrderItem[];
  explosions: ExplosionOption[];
  /** Las recetas de cada prenda, ya filtradas por el servidor. */
  explosionsByVariation: Record<number, ExplosionOption[]>;
  search: string;
  onSearchChange: (value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onChangeQuantity: (index: number, value: string) => void;
  onSelectExplosion: (index: number, explosion: ExplosionOption | null) => void;
  onSelectVariation: (index: number, variation: VariationOption | null) => void;
  /**
   * Varias prendas para un ítem: el diálogo creó S, M, L y XL de golpe. La
   * primera va a ese ítem y las demás a ítems nuevos justo debajo.
   */
  onSelectVariations: (index: number, variations: VariationOption[]) => void;
  totalQuantity: number;
  /**
   * La orden ya arrancó: se mira pero no se toca.
   *
   * Cambiar qué se produce cuando los talleres ya están trabajando dejaría la
   * ruta, la explosión y el avance apuntando a algo que ya no existe. A partir
   * de ahí lo único que se mueve son los avances.
   */
  readOnly?: boolean;
}

export const ProductionOrderItemsEditor = ({
  items,
  explosions,
  explosionsByVariation,
  search,
  onSearchChange,
  onAddItem,
  onRemoveItem,
  onChangeQuantity,
  onSelectExplosion,
  onSelectVariation,
  onSelectVariations,
  totalQuantity,
  readOnly = false,
}: ProductionOrderItemsEditorProps) => {
  /** Índice del ítem cuya explosión se está creando, o null si no hay ninguno. */
  const [creatingFor, setCreatingFor] = useState<number | null>(null);
  /** Índice del ítem cuyo producto se está eligiendo. */
  const [productFor, setProductFor] = useState<number | null>(null);

  /**
   * Las recetas que el item puede usar.
   *
   * Si su prenda tiene recetas asignadas, se ofrecen SOLO esas: es lo que
   * evita colgarle a un polo la receta de un pantalon por elegir mal en una
   * lista larga.
   *
   * Si no tiene ninguna, se ofrecen todas. Sin ese respaldo, un item cuya
   * prenda todavia no tiene receta se quedaria con el combobox vacio y sin
   * forma de avanzar -- y hasta que alguien vincule la receta, la orden no se
   * podria armar.
   */
  const explosionsFor = (variationId: number | null) => {
    // Buscando manda la búsqueda: si alguien teclea es porque quiere otra
    // receta, y acotarla a las de la prenda sería esconder justo lo que pidió.
    if (search.trim() !== "") return explosions;
    if (variationId === null) return explosions;

    const suyas = explosionsByVariation[variationId];
    return suyas && suyas.length > 0 ? suyas : explosions;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ítems</h2>
        <Button
          type="button"
          variant="outline"
          onClick={onAddItem}
          disabled={readOnly}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Añadir ítem
        </Button>
      </div>

      {/* La tabla rueda dentro de su marco.

          Con quince tallas la lista empujaba la orden entera hacia abajo y
          apretaba lo de dentro: cada fila lleva un boton de producto, dos
          selectores, un input y una explosion, y a partir de cierto alto el
          navegador los estrujaba y dejaban de leerse. Con un tope, las filas
          conservan su alto y lo que se mueve es el scroll.

          El total se queda FUERA: es la cifra que se comprueba, y esconderla
          al final de un scroll obligaria a bajar hasta el fondo para verla.

          Y el scroll es un `overflow-auto` a secas, NO el ScrollArea de Radix.
          Ese envuelve su contenido en un elemento con `display: table`, asi que
          meterle una <table> dentro dejaba dos tablas anidadas: el reparto de
          columnas se iba al garete y las celdas se superponian. Ademas asi el
          `sticky top-0` de TableHead vuelve a funcionar, porque se pega contra
          el contenedor que de verdad hace scroll. */}
      <div className="max-h-[55vh] overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-56">Producto</TableHead>
              <TableHead className="w-40">Categoría</TableHead>
              <TableHead className="w-40">Etiqueta</TableHead>
              {/* La cantidad se recorta si la columna va justa: el input lleva
                  sus flechas dentro y se comian los dos ultimos digitos. */}
              <TableHead className="w-28 text-right">Cantidad</TableHead>
              <TableHead className="w-72">Explosión</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground p-8"
                >
                  Sin ítems. Añade uno para indicar qué se produce en esta orden.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={item.id ?? `new-${index}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 min-w-0 flex-1 justify-start font-normal"
                        disabled={readOnly}
                        onClick={() => setProductFor(index)}
                      >
                        <Package className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                          {item.variationLabel ?? "Sin producto"}
                        </span>
                      </Button>
                      {item.variationId !== null && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          disabled={readOnly}
                          onClick={() => onSelectVariation(index, null)}
                          aria-label="Quitar producto"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {item.variationSku && (
                      <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                        {item.variationSku}
                      </p>
                    )}
                  </TableCell>
                  {/* Categoría y etiquetas van en columnas separadas: mezcladas
                      en una sola, con solo el `variant` distinguiéndolas, había
                      que saberse el código para leer cuál era cuál.

                      Las dos son del producto, no de la variación: todas las
                      tallas de una prenda las comparten. Aquí SOLO se leen: se
                      asignan al elegir o crear el producto, que es el momento en
                      que se está pensando en la prenda. */}
                  <TableCell>
                    {item.categories.length === 0 ? (
                      <span className="text-muted-foreground text-sm">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {item.categories.map((category) => (
                          <Badge key={`cat-${category}`} variant="secondary">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.tags.length === 0 ? (
                      <span className="text-muted-foreground text-sm">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag) => (
                          <Badge key={`tag-${tag}`} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="text-right"
                      value={item.quantity}
                      onChange={(e) => onChangeQuantity(index, e.target.value)}
                      disabled={readOnly}
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell>
                    {/* `min-w-0` es lo que deja funcionar al `truncate` del
                        combobox: sin él, el flex item se estira con el texto y
                        una ficha con nombre largo empujaba la fila entera. */}
                    <div className="flex min-w-0 gap-2">
                      <EntityCombobox
                        className="min-w-0 flex-1"
                        disabled={readOnly}
                        options={explosionsFor(item.variationId)}
                        value={item.explosionId}
                        onSelect={(option) => onSelectExplosion(index, option)}
                        search={search}
                        onSearchChange={onSearchChange}
                        placeholder="Sin explosión"
                        searchPlaceholder="Buscar explosión..."
                        /* Al abrir una orden guardada la descripcion llega
                           entera del backend, sin pasar por el adapter de
                           opciones: se acorta igual para que no se vea de dos
                           formas segun de donde venga. */
                        fallbackLabel={explosionShortLabel(
                          item.explosionId,
                          item.explosionDescription,
                        )}
                      />
                      {item.explosionId !== null ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          disabled={readOnly}
                          onClick={() => onSelectExplosion(index, null)}
                          aria-label="Quitar explosión"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        /* Crear la explosión aquí mismo: si no existe todavía,
                           salir a la pantalla de explosiones y volver era el
                           único motivo para abandonar la orden a medio armar. */
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          disabled={readOnly}
                          onClick={() => setCreatingFor(index)}
                          aria-label="Crear explosión para este ítem"
                          title="Crear explosión"
                        >
                          <FilePlus2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={readOnly}
                      onClick={() => onRemoveItem(index)}
                      aria-label="Quitar ítem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end gap-4 pr-4 text-sm">
        <span className="text-muted-foreground">Cantidad total</span>
        <span className="font-semibold tabular-nums">{totalQuantity}</span>
      </div>

      {/* Se monta al abrir para que arranque limpio en cada ítem. */}
      {creatingFor !== null && (
        <ExplosionQuickCreateDialog
          open
          onOpenChange={(open) => {
            if (!open) setCreatingFor(null);
          }}
          suggestedDescription={items[creatingFor]?.variationLabel ?? undefined}
          variationId={items[creatingFor]?.variationId ?? null}
          onCreated={(explosion) => onSelectExplosion(creatingFor, explosion)}
        />
      )}

      {productFor !== null && (
        <ItemProductDialog
          open
          onOpenChange={(open) => {
            if (!open) setProductFor(null);
          }}
          // Abre sobre la prenda que el ítem ya tenga: pulsar un producto
          // vinculado es casi siempre «me faltó algo», no «quiero otro».
          linkedVariationId={items[productFor]?.variationId ?? null}
          onSelected={(variations) => onSelectVariations(productFor, variations)}
        />
      )}
    </div>
  );
};
