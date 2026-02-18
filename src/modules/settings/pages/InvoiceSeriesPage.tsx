import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useInvoiceSeries } from "../hooks/useInvoiceSeries";
import InvoiceSeriesTable from "../components/invoice-series/InvoiceSeriesTable";
import { InvoiceSeriesFormDialog } from "../components/invoice-series/InvoiceSeriesFormDialog";

const InvoiceSeriesPage = () => {
  const {
    series,
    accounts,
    providers,
    loading,
    saving,
    openFormModal,
    editingItem,
    saveSerie,
    handleEditItemChange,
    handleOpenChange,
  } = useInvoiceSeries();

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
          onClick={() => {
            handleEditItemChange(null);
            handleOpenChange(true);
          }}
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
            onEditItem={handleEditItemChange}
            onOpenChange={handleOpenChange}
          />
        </CardContent>
      </Card>

      <InvoiceSeriesFormDialog
        key={editingItem?.id ?? "new"}
        open={openFormModal}
        item={editingItem}
        saving={saving}
        accounts={accounts}
        providers={providers}
        onSaved={saveSerie}
        onOpenChange={handleOpenChange}
      />
    </div>
  );
};

export default InvoiceSeriesPage;
