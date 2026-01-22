import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from "date-fns";
import { Movements } from '../../types/Movements.types';


interface MovementsTableProps {
    movements: Movements[];
}

type WarehouseDirectionUI = {
    from: string;
    to: string;
};


const MovementsTable = ({ movements }: MovementsTableProps) => {
    function getDirectionUI(
        base: string,
        related: string | null,
        quantity: number
    ): WarehouseDirectionUI | null {
        if (!related) return null;

        return quantity > 0
            ? { from: base, to: related }
            : { from: related, to: base };
    }


    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Almacén</TableHead>
                    <TableHead>Variación</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Tipo Stock</TableHead>
                    <TableHead>Vinculo Stock</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Usuario</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {movements.length === 0 ? (
                    <TableRow>
                        <TableCell
                            colSpan={7}
                            className="text-center py-8 text-muted-foreground"
                        >
                            No se encontraron movimientos
                        </TableCell>
                    </TableRow>
                ) : (
                    movements.map((movement) => {
                        const warehouseDirection = getDirectionUI(
                            movement.warehouse,
                            movement.vinc_warehouse,
                            movement.quantity
                        );

                        const stockTypeDirection = getDirectionUI(
                            movement.stock_type,
                            movement.vinc_stock_type,
                            movement.quantity
                        )
                        return (
                            <TableRow key={movement.movements_id}>
                                <TableCell className="whitespace-nowrap text-xs">
                                    {format(new Date(movement.date.replace(/-/g, '/')), "dd/MM/yyyy")}
                                </TableCell>
                                <TableCell className="font-medium text-sm">
                                    {movement.product}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {movement.warehouse}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    <Badge
                                        key={movement.variation}
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        {movement.variation}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="font-mono">
                                        {movement.quantity}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                    {
                                        stockTypeDirection ? (
                                            <Badge variant="outline" className="font-mono flex gap-1">
                                                {stockTypeDirection.from === stockTypeDirection.to ? stockTypeDirection.from : (
                                                    <>
                                                        <span
                                                            className={
                                                                stockTypeDirection.to === movement.stock_type
                                                                    ? "bg-red-500 px-1 rounded text-white"
                                                                    : ""
                                                            }
                                                        >
                                                            {stockTypeDirection.to}
                                                        </span>

                                                        <span>→</span>

                                                        <span
                                                            className={
                                                                stockTypeDirection.from === movement.stock_type
                                                                    ? "bg-green-500 px-1 rounded text-white"
                                                                    : ""
                                                            }
                                                        >
                                                            {stockTypeDirection.from}
                                                        </span>
                                                    </>
                                                )}
                                            </Badge>
                                        ) : ""
                                    }
                                </TableCell>
                                <TableCell className="text-sm">
                                    {
                                        warehouseDirection ? (
                                            <Badge variant="outline" className="font-mono flex gap-1">
                                                {warehouseDirection.from === warehouseDirection.to ? warehouseDirection.from : (
                                                    <>
                                                        <span
                                                            className={
                                                                warehouseDirection.to === movement.warehouse
                                                                    ? "bg-red-500 px-1 rounded text-white"
                                                                    : ""
                                                            }
                                                        >
                                                            {warehouseDirection.to}
                                                        </span>

                                                        <span>→</span>

                                                        <span
                                                            className={
                                                                warehouseDirection.from === movement.warehouse
                                                                    ? "bg-green-500 px-1 rounded text-white"
                                                                    : ""
                                                            }
                                                        >
                                                            {warehouseDirection.from}
                                                        </span>
                                                    </>
                                                )}
                                            </Badge>
                                        ) : ""
                                    }
                                </TableCell>

                                <TableCell className="text-xs uppercase font-semibold">
                                    <Badge
                                        key={movement.variation}
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        {movement.movement_type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm">{movement.user}</TableCell>
                            </TableRow>
                        )
                    })
                )}
            </TableBody>
        </Table>
    )
}

export default MovementsTable