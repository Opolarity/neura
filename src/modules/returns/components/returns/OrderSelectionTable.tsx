import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import Pagination, { PaginationState } from "@/shared/components/pagination/Pagination";

interface OrderSelectionTableProps {
    items: any[];
    pagination: PaginationState;
    loading: boolean;
    selectedId?: number;
    sourceType: "orders" | "returns";
    onSelect: (item: any) => void;
    onPageChange: (page: number) => void;
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
                            {sourceType === "orders" && <TableHead>ID Venta</TableHead>}
                            <TableHead>{sourceType === "returns" ? "ID Retorno" : "N° Documento"}</TableHead>
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
                                    colSpan={sourceType === "orders" ? 5 : 4}
                                    className="text-center text-muted-foreground py-8"
                                >
                                    No se encontraron resultados
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => {
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
                                        className={`cursor-pointer transition-colors ${selectedId === item.id
                                            ? "bg-primary/10 border-l-4 border-l-primary"
                                            : "hover:bg-accent"
                                            }`}
                                        onClick={() => onSelect(item)}
                                    >
                                        {sourceType === "orders" && (
                                            <TableCell className="text-muted-foreground text-sm">
                                                #{item.id}
                                            </TableCell>
                                        )}
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
            <div className="flex justify-center">
                <Pagination
                    pagination={pagination}
                    onPageChange={onPageChange}
                />
            </div>
        </div>
    );
};
