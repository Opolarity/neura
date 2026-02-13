import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { StockType } from "../../types/StockTypes.types";
import { Loader2 } from "lucide-react";

interface StockTypesTableProps {
    stockTypes: StockType[];
    loading: boolean;
}

const StockTypesTable = ({ stockTypes, loading }: StockTypesTableProps) => {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nombre</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={2} className="text-center py-8">
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Cargando tipos de stock...
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : stockTypes.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={2} className="text-center h-24 text-muted-foreground">
                                No hay tipos de stock
                            </TableCell>
                        </TableRow>
                    ) : (
                        stockTypes.map((type) => (
                            <TableRow key={type.id}>
                                <TableCell>{type.id}</TableCell>
                                <TableCell>{type.name}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default StockTypesTable;
