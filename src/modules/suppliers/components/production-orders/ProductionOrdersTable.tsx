import { Loader2, SquarePen } from "lucide-react";
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
import { ProductionOrder } from "../../types/productionOrders.types";
import { productionOrderStatusBadge } from "../../utils/productionOrderStatus";
import { productionOrderTypeBadge } from "../../utils/productionOrderType";

interface ProductionOrdersTableProps {
  orders: ProductionOrder[];
  loading: boolean;
  onEdit: (order: ProductionOrder) => void;
}

const formatDate = (value: string) => (value ? formatDateDisplay(value) : "—");

export const ProductionOrdersTable = ({
  orders,
  loading,
  onEdit,
}: ProductionOrdersTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          {/* Lo que identifica la orden de un vistazo: OP para producción, OM
              para muestra. El id se queda porque es lo que llevan las rutas. */}
          <TableHead className="w-28">Código</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Clase</TableHead>
          {/* Origen: Consignación (Overtake) o Producción (OP real). */}
          <TableHead>Tipo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Ítems</TableHead>
          <TableHead className="text-right">Cantidad</TableHead>
          <TableHead>Creado</TableHead>
          <TableHead className="w-16" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && orders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={10} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando órdenes...
              </div>
            </TableCell>
          </TableRow>
        ) : orders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={10} className="text-center text-muted-foreground p-10">
              No se encontraron órdenes de producción
            </TableCell>
          </TableRow>
        ) : (
          orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.id}</TableCell>
              <TableCell className="font-medium tabular-nums">
                {order.code ?? "—"}
              </TableCell>
              <TableCell>
                <div>{order.name}</div>
                {order.description && (
                  <div className="text-muted-foreground text-xs truncate max-w-[220px]">
                    {order.description}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {order.productionOrderClassName ? (
                  <Badge variant="secondary">{order.productionOrderClassName}</Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell>
                {/* Origen. Las históricas sin type no pintan badge. */}
                {productionOrderTypeBadge(order.type) ? (
                  <Badge variant={productionOrderTypeBadge(order.type)!.variant}>
                    {productionOrderTypeBadge(order.type)!.label}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell>
                {/* Calculado por el backend a partir de los servicios
                    vinculados: aquí solo se pinta. */}
                <Badge variant={productionOrderStatusBadge(order.status).variant}>
                  {productionOrderStatusBadge(order.status).label}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{order.itemsCount}</TableCell>
              {/* Las ordenes antiguas (creadas por sp_create_consignment_intake)
                  tienen quantity NULL porque nunca paso por items: sin items,
                  la cantidad es 0. */}
              <TableCell className="text-right">{order.quantity ?? 0}</TableCell>
              <TableCell>{formatDate(order.createdAt)}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(order)}
                  aria-label={`Editar orden ${order.name}`}
                >
                  <SquarePen className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
