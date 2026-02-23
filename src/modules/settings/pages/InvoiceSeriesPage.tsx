import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInvoiceSeries } from "../hooks/useInvoiceSeries";
import InvoiceSeriesTable from "../components/invoice-series/InvoiceSeriesTable";

const InvoiceSeriesPage = () => {
  const navigate = useNavigate();
  const { series, loading } = useInvoiceSeries();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Series de Facturación
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra las series de comprobantes electrónicos
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => navigate("/invoices/series/add")}
        >
          <Plus className="w-4 h-4" />
          Nueva Serie
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
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
