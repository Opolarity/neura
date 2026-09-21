import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/shared/utils/currency";
import { SupplierPaymentsTotals } from "../../types/supplierPayments.types";

interface SupplierPaymentsHeaderProps {
  totals: SupplierPaymentsTotals;
}

/**
 * Tres cifras y el título.
 *
 * Son de TODO lo filtrado, no de la página que se está mirando: la pregunta
 * que trae a alguien a esta pantalla es «cuánto debo», y una cifra que
 * cambiara al pasar de página no la respondería.
 */
const SupplierPaymentsHeader = ({ totals }: SupplierPaymentsHeaderProps) => {
  const cifras = [
    { label: "Por pagar", value: totals.balance, destacado: true },
    { label: "Pagado", value: totals.paid, destacado: false },
    // Exigible, no recibido: desde «En proceso» el servicio ya se debe.
    { label: "Total exigible", value: totals.payable, destacado: false },
  ];

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold text-foreground">
        Pagos a proveedores
      </h1>

      {/* Debajo del titulo y a todo el ancho, en tres columnas iguales: las
          tres cifras son la misma pregunta vista de tres formas, y apretarlas
          a la derecha las dejaba como un adorno del encabezado. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cifras.map((cifra) => (
          <Card key={cifra.label}>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {cifra.label}
              </div>
              <div
                className={
                  cifra.destacado
                    ? "text-2xl font-bold text-destructive tabular-nums"
                    : "text-2xl font-semibold tabular-nums"
                }
              >
                {formatCurrency(cifra.value)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SupplierPaymentsHeader;
