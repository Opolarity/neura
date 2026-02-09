import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReturnSummaryProps {
    isCAM: boolean;
    calculateReturnTotal: () => number;
    calculateExchangeTotal: () => number;
    calculateDifference: () => number;
    shippingReturn: boolean;
    shippingCost: number;
    formatCurrency: (amount: number) => string;
}

export const ReturnSummary = ({
    isCAM,
    calculateReturnTotal,
    calculateExchangeTotal,
    calculateDifference,
    shippingReturn,
    shippingCost,
    formatCurrency
}: ReturnSummaryProps) => {
    if (isCAM) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Resumen de Cambio</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-right">
                        <p>Total Productos Devueltos: {formatCurrency(calculateReturnTotal())}</p>
                        <p>Total Productos Cambio: {formatCurrency(calculateExchangeTotal())}</p>
                        <p className="text-lg font-bold">
                            {calculateDifference() >= 0
                                ? `A Reembolsar: ${formatCurrency(calculateDifference())}`
                                : `Diferencia a Pagar: ${formatCurrency(Math.abs(calculateDifference()))}`}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Resumen de Devolución</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 text-right">
                    <p>Total productos a devolver: {formatCurrency(calculateReturnTotal())}</p>
                    {shippingReturn && <p>Costo de envío a devolver: {formatCurrency(shippingCost)}</p>}
                    <p className="text-lg font-bold">
                        Total a Reembolsar: {formatCurrency(calculateReturnTotal() + (shippingReturn ? shippingCost : 0))}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
