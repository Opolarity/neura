import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReturnSummaryProps {
    isCAM: boolean;
    orderTotal?: number;
    calculateReturnTotal: () => number;
    calculateExchangeTotal: () => number;
    shippingReturn: boolean;
    shippingCost: number;
    formatCurrency: (amount: number) => string;
}

export const ReturnSummary = ({
    isCAM,
    orderTotal = 0,
    calculateReturnTotal,
    calculateExchangeTotal,
    shippingReturn,
    shippingCost,
    formatCurrency
}: ReturnSummaryProps) => {
    if (isCAM) {
        const camReturnTotal = calculateReturnTotal() + (shippingReturn ? shippingCost : 0);
        const camDifference = calculateExchangeTotal() - camReturnTotal;
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Resumen de Cambio</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-right">
                        <p>Total Productos Devueltos: {formatCurrency(calculateReturnTotal())}</p>
                        {shippingReturn && (
                            <p>Costo de envío a devolver: {formatCurrency(shippingCost)}</p>
                        )}
                        <p>Total Productos Cambio: {formatCurrency(calculateExchangeTotal())}</p>
                        <p className={`text-lg font-bold ${camDifference < 0 ? 'text-red-500' : camDifference > 0 ? 'text-emerald-500' : ''}`}>
                            {camDifference < 0
                                ? `A Reembolsar: ${formatCurrency(camDifference)}`
                                : `Diferencia a Pagar: ${formatCurrency(camDifference)}`}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const productsTotal = calculateReturnTotal();
    const refundWithShipping = productsTotal + (shippingReturn ? shippingCost : 0);
    const orderDifference = Math.max(0, (orderTotal - shippingCost) - productsTotal);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Resumen de Devolución</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 text-right">
                    <p>Total productos a devolver: {formatCurrency(productsTotal)}</p>
                    {shippingReturn && (
                        <p>Costo de envío a devolver: {formatCurrency(shippingCost)}</p>
                    )}
                    <p className="text-lg font-bold text-red-500">
                        Total a reembolsar: {formatCurrency(-refundWithShipping)}
                    </p>
                    {orderTotal > 0 && (
                        <p className="text-muted-foreground text-sm">
                            Diferencia con la orden: {formatCurrency(orderDifference)}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
