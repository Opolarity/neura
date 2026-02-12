import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { OrderChannelType } from "../../types/OrderChannelTypes.types";

interface OrderChannelTypesTableProps {
    orderChannelTypes: OrderChannelType[];
    loading: boolean;
}

const OrderChannelTypesTable = ({ orderChannelTypes, loading }: OrderChannelTypesTableProps) => {
    if (loading) {
        return <div className="p-4 text-center">Cargando...</div>;
    }

    if (orderChannelTypes.length === 0) {
        return <div className="p-4 text-center text-muted-foreground">No hay tipos de canales de pedido registrados.</div>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Código</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orderChannelTypes.map((type) => (
                        <TableRow key={type.id}>
                            <TableCell className="font-medium">{type.id}</TableCell>
                            <TableCell>{type.name}</TableCell>
                            <TableCell>{type.code}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default OrderChannelTypesTable;
