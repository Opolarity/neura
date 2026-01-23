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

                    <TableHead>Producto</TableHead>
                    <TableHead>Variación</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Tipo Movimiento</TableHead>
                    <TableHead>Almacén</TableHead>
                    <TableHead>Fecha</TableHead>
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
                                <TableCell className="font-medium text-sm">
                                    {movement.product}
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
                                    <Badge variant="outline" className={`font-mono ${movement.quantity > 0 ? "bg-green-300" : "bg-red-300"}`}>
                                        {movement.quantity}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs uppercase font-semibold">
                                    <Badge
                                        key={movement.movement_type}
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        {movement.movement_type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                    {
                                        stockTypeDirection ? (
                                            <>
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

                                                        <span> → </span>

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
                                            </>
                                        ) : movement.stock_type
                                    }
                                </TableCell>
                                <TableCell className="text-sm">
                                    {
                                        warehouseDirection ? (
                                            <>
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

                                                        <span> → </span>

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
                                            </>
                                        ) : movement.warehouse
                                    }
                                </TableCell>





                                <TableCell className="whitespace-nowrap text-xs">
                                    {format(new Date(movement.date.replace(/-/g, '/')), "dd/MM/yyyy")}
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