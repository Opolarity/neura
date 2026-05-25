import { useNavigate } from "react-router-dom";
import { formatDateTime } from "@/shared/utils/date";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Edit, Eye, Loader2 } from "lucide-react";
import type { InvoiceItem } from "../../types/Invoices.types";

interface TableInvoicesProps {
  invoices: InvoiceItem[];
  loading: boolean;
}

export default function InvoicesTable({ invoices = [], loading }: TableInvoicesProps) {
  const navigate = useNavigate();

  if (loading && invoices.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!loading && invoices.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No se encontraron comprobantes
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute top-0 left-0 right-0 h-0.5 z-10 bg-primary animate-pulse rounded-full" />
      )}
      <Table className={loading ? "opacity-50 pointer-events-none" : ""}>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>TIPO</TableHead>
          <TableHead>SERIE</TableHead>
          <TableHead>ORDEN</TableHead>
          <TableHead>CLIENTE</TableHead>
          <TableHead>DOCUMENTO</TableHead>
          <TableHead>TOTAL</TableHead>
          <TableHead>FECHA</TableHead>
          <TableHead>ESTADO</TableHead>
          <TableHead>ACCIONES</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {invoices.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.id}</TableCell>
            <TableCell>{item.invoiceTypeName}</TableCell>
            <TableCell>{item.taxSerie || "—"}</TableCell>
            <TableCell>{item.orderId || "—"}</TableCell>
            <TableCell>{item.clientName || "—"}</TableCell>
            <TableCell>{item.customerDocumentNumber || "—"}</TableCell>
            <TableCell>S/ {item.totalAmount.toFixed(2)}</TableCell>
            <TableCell>
              {formatDateTime(item.createdAt)}
            </TableCell>
            <TableCell>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.declared
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {item.declared ? "Declarado" : "Pendiente"}
              </span>
            </TableCell>
            <TableCell className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/invoices/view/${item.id}`)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              {!item.declared && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/invoices/edit/${item.id}`)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}
