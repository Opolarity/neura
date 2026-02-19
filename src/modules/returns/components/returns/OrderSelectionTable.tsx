import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { PaginationState } from "@/shared/components/pagination/Pagination";

interface OrderSelectionTableProps {
    items: any[];
    pagination: PaginationState;
    loading: boolean;
    selectedId?: number;
    sourceType: "orders" | "returns";
    onSelect: (item: any) => void;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    formatCurrency: (amount: number) => string;
}

export const OrderSelectionTable = ({
    items,
    pagination,
    loading,
    selectedId,
    sourceType,
    onSelect,
    onPageChange,
    onPageSizeChange,
    formatCurrency,
}: OrderSelectionTableProps) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>N° Documento</TableHead>
                            <TableHead>
                                {sourceType === "returns" ? "Doc. Cliente" : "Cliente"}
                            </TableHead>
                            <TableHead className="text-right">
                                {sourceType === "returns" ? "Monto Devuelto" : "Total"}
                            </TableHead>
                            <TableHead>Fecha</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="text-center text-muted-foreground py-8"
                                >
                                    No se encontraron resultados
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => {
                                // SP orders fields: id, date, customer_name (concat), document_number, total
                                // SP returns fields: id, customer_document_number, total_refund_amount, total_exchange_difference
                                const docNumber = item.document_number || `#${item.id}`;
                                const clientLabel =
                                    item.customer_name ||
                                    item.customer_document_number ||
                                    "-";
                                const amount = item.total ?? item.total_refund_amount ?? 0;
                                const dateStr = item.date || item.created_at;

                                return (
                                    <TableRow
                                        key={item.id}
                                        className={`cursor-pointer transition-colors ${
                                            selectedId === item.id
                                                ? "bg-primary/10 border-l-4 border-l-primary"
                                                : "hover:bg-accent"
                                        }`}
                                        onClick={() => onSelect(item)}
                                    >
                                        <TableCell className="font-medium">
                                            {docNumber}
                                        </TableCell>
                                        <TableCell>{clientLabel}</TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(amount)}
                                        </TableCell>
                                        <TableCell>
                                            {dateStr
                                                ? new Date(dateStr).toLocaleDateString()
                                                : "-"}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
            <PaginationBar
                pagination={pagination}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
            />
        </div>
    );
};
