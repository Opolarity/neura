import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ProductionOrderClassOption,
  ProductionOrderStatus,
} from "../../types/productionOrders.types";
import {
  PRODUCTION_ORDER_STATUSES,
  productionOrderStatusBadge,
} from "../../utils/productionOrderStatus";
import { SimpleCategory } from "@/modules/products/types/Categories.types";
import {
  ProductionItemStatus,
  ProductionPlanFilters,
} from "../../types/productionPlan.types";
import {
  PRODUCTION_ITEM_STATUSES,
  productionItemStatusBadge,
} from "../../utils/productionItemStatus";

const ALL = "all";

interface ProductionPlanFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ProductionPlanFilters) => void;
  filters: ProductionPlanFilters;
  classes: ProductionOrderClassOption[];
  categories: SimpleCategory[];
  /**
   * A qué vuelve «Limpiar» el estado de prenda.
   *
   * En el Plan Maestro es PENDIENTE, no vacío: limpiar tiene que devolver la
   * pantalla a como abre, y como abre es por lo pendiente. En la pestaña de
   * una orden se limpia a vacío, que ahí sí es el estado de partida.
   */
  defaultStatus?: ProductionItemStatus | null;
}

export const ProductionPlanFilterModal = ({
  isOpen,
  onClose,
  onApply,
  filters,
  classes,
  categories,
  defaultStatus = null,
}: ProductionPlanFilterModalProps) => {
  const [localFilters, setLocalFilters] =
    useState<ProductionPlanFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  /**
   * «Todos los estados» sin nada más al lado dejaría la lista sin acotar, y el
   * Plan Maestro no se mira entero: el hook lo devolvería a PENDIENTE. Se
   * avisa aquí en vez de dejar que el aviso llegue después de aplicar.
   *
   * Solo en el Plan Maestro —`defaultStatus` puesto—: dentro de una orden, la
   * orden ya es el filtro y ahí sí se ven todas sus prendas.
   */
  const quedariaSinAcotar =
    defaultStatus !== null &&
    !localFilters.status &&
    !localFilters.production_order_status &&
    !localFilters.category_id &&
    !localFilters.production_order_class_id &&
    !localFilters.promised_from &&
    !localFilters.promised_to &&
    !(localFilters.search ?? "").trim();

  // Limpiar devuelve la pantalla a como abre, no a vacío: en el Plan Maestro
  // eso es lo pendiente, y dejarlo sin estado seria cargar el historico entero
  // justo con el boton que se pulsa para simplificar.
  const handleClear = () =>
    setLocalFilters({
      ...localFilters,
      status: defaultStatus ?? null,
      production_order_status: null,
      category_id: null,
      production_order_class_id: null,
      promised_from: null,
      promised_to: null,
    });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filtrar el Plan Maestro</DialogTitle>
        </DialogHeader>

        {/* Mismo tope de altura y scroll interno que el resto de modales de
            filtros del módulo. */}
        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">
              <div className="space-y-2">
                <Label htmlFor="plan-status">Estado de la prenda</Label>
                <Select
                  value={localFilters.status ?? ALL}
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      status:
                        value === ALL ? null : (value as ProductionItemStatus),
                    })
                  }
                >
                  <SelectTrigger id="plan-status">
                    <SelectValue placeholder="Seleccione estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos los estados</SelectItem>
                    {/* Los rótulos salen del mismo sitio que los badges de la
                        tabla: filtrar por «Culminado» y ver «Culminado». */}
                    {PRODUCTION_ITEM_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {productionItemStatusBadge(status).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  La lista ya viene ordenada Pendiente, En progreso, Culminado.
                  Aquí se deja uno solo.
                </p>
                {quedariaSinAcotar && (
                  <p className="text-warning text-xs">
                    Sin ningún filtro la lista sería el histórico entero, así
                    que volvería a lo pendiente. Acota por otra cosa —categoría,
                    clase, entrega— o busca, y entonces sí se ven todos los
                    estados.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-order-status">Estado de la orden</Label>
                {/* Dos filtros y no uno: el de la prenda responde «qué falta
                    por recibir» y el de la orden «por dónde va la producción».
                    Comparten el valor IN_PROGRESS, así que separarlos por
                    rótulo es lo que evita creer que uno no filtra. */}
                <Select
                  value={localFilters.production_order_status ?? ALL}
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      production_order_status:
                        value === ALL ? null : (value as ProductionOrderStatus),
                    })
                  }
                >
                  <SelectTrigger id="plan-order-status">
                    <SelectValue placeholder="Seleccione estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos los estados</SelectItem>
                    {PRODUCTION_ORDER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {productionOrderStatusBadge(status).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-category">Categoría</Label>
                {/* La categoría es del PRODUCTO, así que filtra prendas y no
                    órdenes: una orden puede quedarse con solo algunas de sus
                    filas. Es el filtro que sustituye a la idea de filtrar por
                    talla -- las tallas se ven todas, sin elegir. */}
                <Select
                  value={
                    localFilters.category_id
                      ? localFilters.category_id.toString()
                      : ALL
                  }
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      category_id: value === ALL ? null : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger id="plan-category">
                    <SelectValue placeholder="Seleccione categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todas las categorías</SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-class">Clase de orden</Label>
                <Select
                  value={
                    localFilters.production_order_class_id
                      ? localFilters.production_order_class_id.toString()
                      : ALL
                  }
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      production_order_class_id:
                        value === ALL ? null : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger id="plan-class">
                    <SelectValue placeholder="Seleccione clase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todas las clases</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Va al final y vacío por defecto: el plan abre entero y
                  ordenado por estado, y acotar por fecha es lo último que se
                  pregunta en un flujo de producción. */}
              <div className="space-y-2">
                <Label>Entrega comprometida</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id="plan-promised-from"
                    type="date"
                    aria-label="Entrega desde"
                    value={localFilters.promised_from ?? ""}
                    onChange={(event) =>
                      setLocalFilters({
                        ...localFilters,
                        promised_from: event.target.value || null,
                      })
                    }
                  />
                  <Input
                    id="plan-promised-to"
                    type="date"
                    aria-label="Entrega hasta"
                    value={localFilters.promised_to ?? ""}
                    onChange={(event) =>
                      setLocalFilters({
                        ...localFilters,
                        promised_to: event.target.value || null,
                      })
                    }
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  Vacío no acota nada. Con un rango, las órdenes sin fecha de
                  entrega quedan fuera.
                </p>
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClear}>
              Limpiar
            </Button>
            <Button onClick={handleApply}>Aplicar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
