import { useNavigate } from "react-router-dom";
import { formatDateTime } from "@/shared/utils/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Code, Edit, Eye, FileText, Loader2, Printer } from "lucide-react";
import type { InvoiceItem, InvoiceType } from "../../types/Invoices.types";
import { ComponentPermission } from "@/shared/components/component-permission";
import { useInvoicePrint } from "../../hooks/useInvoicePrint";

// Los de tipo "Comprobante" no se emiten a SUNAT, así que nunca tienen pdf_url:
// su PDF se genera en el cliente con el mismo ticket que usa el POS.
const INTERNAL_INVOICE_TYPE_CODE = "INV";

// Codes de la columna ACCIONES, en una constante para que la cabecera y la
// celda no puedan quedar con listas distintas y aparezca un th sin td o al
// revés.
const ACTION_CODES = [
  "invoices.view",
  "invoices.edit",
  "invoices.print",
  "invoices.download",
];

interface TableInvoicesProps {
  invoices: InvoiceItem[];
  loading: boolean;
  invoiceTypes?: InvoiceType[];
}

const downloadXml = (item: InvoiceItem) => {
  const link = document.createElement("a");
  link.href = item.xmlUrl!;
  link.download = `comprobante-${item.invoiceNumber || item.id}.xml`;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export default function InvoicesTable({ invoices = [], loading, invoiceTypes = [] }: TableInvoicesProps) {
  const navigate = useNavigate();
  const { printInvoice, printingId } = useInvoicePrint();

  // El listado solo trae el id del tipo; el code viene del catálogo para no
  // depender de ids en duro, que pueden diferir entre entornos.
  const internalTypeIds = new Set(
    invoiceTypes
      .filter((type) => type.code === INTERNAL_INVOICE_TYPE_CODE)
      .map((type) => type.id)
  );

  if (loading && invoices.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
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
    <div className="relative h-full">
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
          {/* Se envuelve el th entero y no su texto: una celda vacía sigue
              ocupando su ancho y deja un hueco muerto. */}
          <ComponentPermission codeIn={ACTION_CODES}>
            <TableHead>ACCIONES</TableHead>
          </ComponentPermission>
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
              <Badge variant={item.declared ? "success" : "warning"}>
                {item.declared ? "Declarado" : "Pendiente"}
              </Badge>
            </TableCell>
            <ComponentPermission codeIn={ACTION_CODES}>
              <TableCell>
                <div className="flex items-center gap-1">
                  <ComponentPermission codeIn={["invoices.view"]}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/invoices/view/${item.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </ComponentPermission>
                  {!item.declared && (
                    <ComponentPermission codeIn={["invoices.edit"]}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/invoices/edit/${item.id}`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </ComponentPermission>
                  )}
                  {internalTypeIds.has(item.invoiceTypeId) && (
                    <ComponentPermission codeIn={["invoices.print"]}>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Imprimir PDF"
                        disabled={printingId === item.id}
                        onClick={() => printInvoice(item.id)}
                      >
                        {printingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Printer className="w-4 h-4" />
                        )}
                      </Button>
                    </ComponentPermission>
                  )}
                  {item.pdfUrl && (
                    <ComponentPermission codeIn={["invoices.print"]}>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Ver PDF"
                        onClick={() => window.open(item.pdfUrl!, "_blank", "noopener,noreferrer")}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    </ComponentPermission>
                  )}
                  {item.xmlUrl && (
                    <ComponentPermission codeIn={["invoices.download"]}>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Descargar XML"
                        onClick={() => downloadXml(item)}
                      >
                        <Code className="w-4 h-4" />
                      </Button>
                    </ComponentPermission>
                  )}
                </div>
              </TableCell>
            </ComponentPermission>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}
