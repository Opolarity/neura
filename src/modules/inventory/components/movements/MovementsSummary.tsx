import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingDown, TrendingUp } from "lucide-react";

interface MovementsSummaryProps {
    summary: {
        totalMovements: number;
        totalOutflow: number;
        manualMovements: number;
    };
}

export const MovementsSummary: React.FC<MovementsSummaryProps> = ({ summary }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Movimientos
                    </CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summary.totalMovements}</div>
                    <p className="text-xs text-muted-foreground">
                        Registros en el periodo
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Salidas por Ventas
                    </CardTitle>
                    <TrendingDown className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summary.totalOutflow}</div>
                    <p className="text-xs text-muted-foreground">Unidades vendidas</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Movimientos Manuales
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {summary.manualMovements}
                    </div>
                    <p className="text-xs text-muted-foreground">Ajustes manuales</p>
                </CardContent>
            </Card>
        </div>
    );
};
