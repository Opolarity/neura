import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OrdersSituationsById } from "../types";
import { formatDateDisplay } from "@/shared/utils/date";

interface SalesHistoryModalProps {
  orders: OrdersSituationsById[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SalesHistoryModal = ({
  orders,
  open,
  onOpenChange,
}: SalesHistoryModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Historial de ventas</DialogTitle>
          <DialogDescription>
            Aquí podrás ver el historial de cambios de la venta.
          </DialogDescription>
        </DialogHeader>
        {/* Tope de altura + scroll interno, mismo patrón que los modales de
            filtro: el historial crece con cada cambio de la venta y sin esto
            el modal se estiraba hasta salirse de la pantalla. El max-h va en
            un contenedor propio, no en el ScrollArea. El pr-4 aparta la tabla
            de la barra de scroll. */}
        <div className="max-h-[50vh]">
          {/* El viewport de Radix envuelve el contenido en un div con
              display: table, que deja a la tabla crecer a su ancho natural y
              la recorta: el ScrollArea solo trae barra vertical. En block, el
              ancho vuelve a estar limitado y el overflow-auto de Table recupera
              el scroll horizontal.

              type="always" deja la barra siempre visible: el default "hover"
              la oculta si el puntero no está encima. El thumb solo aparece si
              el contenido desborda. */}
          <ScrollArea
            type="always"
            className="h-full [&>[data-radix-scroll-area-viewport]>div]:!block"
          >
            <div className="space-y-4 py-4 pl-1 pr-4">
              <Table>
                <TableHeader>
                  <TableHead>#</TableHead>
                  <TableHead>Situación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableHeader>
                <TableBody>
                  {orders.map((order, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{order.situation_name}</TableCell>
                      <TableCell>{order.statuses_name}</TableCell>
                      <TableCell>{order.created_by_name}</TableCell>
                      <TableCell>
                        {formatDateDisplay(order.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

//hola
