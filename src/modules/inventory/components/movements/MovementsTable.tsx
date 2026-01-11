import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { StockMovement } from "../../inventory.types";

interface MovementsTableProps {
    movements: StockMovement[];
}

export const MovementsTable: React.FC<MovementsTableProps> = ({ movements }) => {
    if (movements.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No se encontraron movimientos
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Variación</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Almacén</TableHead>
                        <TableHead>Origen</TableHead>
                        <TableHead>Usuario</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {movements.map((movement) => (
                        <TableRow key={movement.id}>
                            <TableCell className="whitespace-nowrap">
                                {format(
                                    new Date(movement.created_at),
                                    "dd/MM/yyyy HH:mm"
                                )}
                            </TableCell>
                            <TableCell className="font-medium">
                                {movement.variations.products.title}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {movement.variations.variation_terms.map((vt) => (
                                        <Badge
                                            key={vt.terms.id}
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {vt.terms.name}
                                        </Badge>
                                    ))}
                                    {movement.variations.variation_terms.length === 0 && (
                                        <span className="text-muted-foreground text-sm">
                                            -
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="font-mono">
                                    {movement.quantity}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm">
                                    {movement.out_warehouse_id ===
                                        movement.in_warehouse_id ? (
                                        movement.out_warehouse.name
                                    ) : (
                                        <>
                                            {movement.out_warehouse.name} →{" "}
                                            {movement.in_warehouse.name}
                                        </>
                                    )}
                                </span>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm">
                                    {movement.types.name}
                                    {(movement.order_id || movement.return_id) && (
                                        <> #{movement.order_id || movement.return_id}</>
                                    )}
                                </span>
                            </TableCell>
                            <TableCell className="text-sm">
                                {movement.profiles.name} {movement.profiles.last_name}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
