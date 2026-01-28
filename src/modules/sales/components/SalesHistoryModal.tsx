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
import { OrdersSituationsById } from "../types";
import { format } from "date-fns";

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Historial de ventas</DialogTitle>
          <DialogDescription>
            Aquí podrás ver el historial de cambios de la venta.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Table>
            <TableHeader>
              <TableHead>#</TableHead>
              <TableHead>Situación</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableHeader>
            <TableBody>
              {orders.map((order, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{order.situation_name}</TableCell>
                  <TableCell>{order.statuses_name}</TableCell>
                  <TableCell>
                    {format(
                      new Date(
                        order.created_at.split("T")[0].replace(/-/g, "/"),
                      ),
                      "dd/MM/yyyy",
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

//hola
