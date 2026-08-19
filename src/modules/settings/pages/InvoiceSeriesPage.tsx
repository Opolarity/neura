import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInvoiceSeries } from "../hooks/useInvoiceSeries";
import InvoiceSeriesTable from "../components/invoice-series/InvoiceSeriesTable";
import { ComponentPermission } from "@/shared/components/component-permission";

const InvoiceSeriesPage = () => {
  const navigate = useNavigate();
  const { series, loading } = useInvoiceSeries();

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Series de Facturación
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra las series de comprobantes electrónicos
          </p>
        </div>
        {/* El botón lleva a /invoices/series/add, ya protegida con
            invoice_series.create: se reutiliza ese code para no ofrecer un
            botón que acaba en una pantalla bloqueada. */}
        <ComponentPermission codeIn={["invoice_series.create"]}>
          <Button
            className="gap-2"
            onClick={() => navigate("/invoices/series/add")}
          >
            <Plus className="w-4 h-4" />
            Nueva Serie
          </Button>
        </ComponentPermission>
      </div>

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <InvoiceSeriesTable
            loading={loading}
            series={series}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceSeriesPage;
