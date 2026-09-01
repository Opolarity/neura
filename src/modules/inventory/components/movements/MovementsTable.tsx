import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button';
import { formatDateDisplay } from "@/shared/utils/date";
import { Loader2, Eye, LockOpen } from "lucide-react";
import { Movements } from '../../types/Movements.types';
import { ComponentPermission } from '@/shared/components/component-permission';


interface MovementsTableProps {
    movements: Movements[];
    loading: boolean;
    onViewDetail: (id: number) => void;
}

type WarehouseDirectionUI = {
    from: string;
    to: string;
};


// Producto, Variación, Cantidad, candado, Origen, Tipo Movimiento, Almacén,
// Fecha, Usuario, Acciones. Si el rol no puede ver el detalle, la columna de
// Acciones no se pinta y este número queda uno largo: solo afecta a las filas
// de "cargando" y "no se encontraron", y la columna sobrante colapsa a 0px
// porque ninguna otra fila la ocupa.
const COL_SPAN = 10;

// Code de la columna Acciones, en una constante para que la cabecera y la
// celda no puedan quedar con listas distintas y aparezca un th sin td o al
// revés.
const ACTION_CODES = ["inventory_movements.view"];

const MovementsTable = ({ movements, loading, onViewDetail }: MovementsTableProps) => {
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
                    {/* Columna estrecha solo para el candado de "pendiente": va aparte
                        para que las filas culminadas no se descuadren. */}
                    <TableHead className="w-6 px-0" />
                    <TableHead>Origen</TableHead>
                    <TableHead>Tipo Movimiento</TableHead>
                    <TableHead>Almacén</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                    {/* Se envuelve el th entero y no su texto: una celda vacía
                        sigue ocupando su ancho y deja un hueco muerto. */}
                    <ComponentPermission codeIn={ACTION_CODES}>
                        <TableHead>Acciones</TableHead>
                    </ComponentPermission>

                </TableRow>
            </TableHeader>
            <TableBody>
                {loading && movements.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={COL_SPAN} className="text-center py-8">
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Cargando movimientos...
                            </div>
                        </TableCell>
                    </TableRow>
                ) : movements.length === 0 ? (
                    <TableRow>
                        <TableCell
                            colSpan={COL_SPAN}
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
                                            ? "bg-success/15 text-success"
                                            : "bg-destructive/15 text-destructive"
                                    }`}>
                                        {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                                    </span>
                                </TableCell>
                                <TableCell className="w-6 px-0">
                                    {!movement.completed && (
                                        <span
                                            title="Movimiento pendiente"
                                            aria-label="Movimiento pendiente"
                                            className="inline-flex"
                                        >
                                            <LockOpen className="h-4 w-4 text-amber-500" />
                                        </span>
                                    )}
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
                                    {formatDateDisplay(movement.date)}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{movement.user}</TableCell>
                                <ComponentPermission codeIn={ACTION_CODES}>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            title="Ver detalle del movimiento"
                                            onClick={() => onViewDetail(movement.movements_id)}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </ComponentPermission>
                            </TableRow>
                        )
                    })
                )}
            </TableBody>
        </Table>
    )
}

export default MovementsTable