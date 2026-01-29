import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Movements } from '../../types/Movements.types';


interface MovementsTableProps {
    movements: Movements[];
    loading: boolean;
}

type WarehouseDirectionUI = {
    from: string;
    to: string;
};


const MovementsTable = ({ movements, loading }: MovementsTableProps) => {
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
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Cargando movimientos...
                            </div>
                        </TableCell>
                    </TableRow>
                ) : movements.length === 0 ? (
                    <TableRow>
                        <TableCell
                            colSpan={8}
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
                                    {movement.variation}
                                </TableCell>
                                <TableCell className="text-sm">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md ${
                                        movement.quantity > 0
                                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                            : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                                    }`}>
                                        {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                                    </span>
                                </TableCell>
                                <TableCell className="text-sm">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                        {movement.movement_type}
                                    </span>
                                </TableCell>
                                <TableCell className="text-sm">
                                    {
                                        stockTypeDirection ? (
                                            <div className="flex items-center gap-1.5">
                                                {stockTypeDirection.from === stockTypeDirection.to ? (
                                                    stockTypeDirection.from
                                                ) : (
                                                    <>
                                                        <span className={
                                                            stockTypeDirection.to === movement.stock_type
                                                                ? "inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                                                                : ""
                                                        }>
                                                            {stockTypeDirection.to}
                                                        </span>
                                                        <span className="text-muted-foreground">→</span>
                                                        <span className={
                                                            stockTypeDirection.from === movement.stock_type
                                                                ? "inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                                                                : ""
                                                        }>
                                                            {stockTypeDirection.from}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        ) : movement.stock_type
                                    }
                                </TableCell>
                                <TableCell className="text-sm">
                                    {
                                        warehouseDirection ? (
                                            <div className="flex items-center gap-1.5">
                                                {warehouseDirection.from === warehouseDirection.to ? (
                                                    warehouseDirection.from
                                                ) : (
                                                    <>
                                                        <span className={
                                                            warehouseDirection.to === movement.warehouse
                                                                ? "inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                                                                : ""
                                                        }>
                                                            {warehouseDirection.to}
                                                        </span>
                                                        <span className="text-muted-foreground">→</span>
                                                        <span className={
                                                            warehouseDirection.from === movement.warehouse
                                                                ? "inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                                                                : ""
                                                        }>
                                                            {warehouseDirection.from}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        ) : movement.warehouse
                                    }
                                </TableCell>





                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                    {format(new Date(movement.date.replace(/-/g, '/')), "dd/MM/yyyy")}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{movement.user}</TableCell>
                            </TableRow>
                        )
                    })
                )}
            </TableBody>
        </Table>
    )
}

export default MovementsTable