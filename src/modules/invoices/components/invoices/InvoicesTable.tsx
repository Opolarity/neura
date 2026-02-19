import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Edit, Loader2 } from "lucide-react";
import type { InvoiceRow } from "../../hooks/useInvoices";

interface TableInvoicesProps {
  invoices: InvoiceRow[];
  loading: boolean;
}

export default function InvoicesTable({ invoices, loading }: TableInvoicesProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No se encontraron comprobantes
      </div>
    );
  }

  return (
    <Table>
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
            <TableCell>{item.invoice_type_name}</TableCell>
            <TableCell>{item.tax_serie || "—"}</TableCell>
            <TableCell>{item.order_id || "—"}</TableCell>
            <TableCell>{item.client_name || "—"}</TableCell>
            <TableCell>{item.customer_document_number || "—"}</TableCell>
            <TableCell>S/ {item.total_amount.toFixed(2)}</TableCell>
            <TableCell>
              {new Date(item.created_at).toLocaleDateString("es-PE")}
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
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/invoices/edit/${item.id}`)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
