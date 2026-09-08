import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card.tsx";
import InvoicesFilterBar from "../components/invoices/InvoicesFilterBar.tsx";
import InvoicesTable from "../components/invoices/InvoicesTable";
import { useInvoices } from "../hooks/useInvoices";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar.tsx";
import { useState } from "react";
import OrderSelectionModal from "../components/invoices/OrderSelectionModal";
import InvoicesHeader from "../components/invoices/InvoicesHeader.tsx";

const Invoices = () => {
  const { invoices, loading, pagination, onPageChange, onPageSizeChange, activeFilters, applyFilters, clearFilters, invoiceTypes } = useInvoices();
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <InvoicesHeader onOpenOrder = {()=>setIsOrderModalOpen(true)} />

      <OrderSelectionModal
        mode="create"
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
      />
      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <InvoicesFilterBar activeFilters={activeFilters} onApply={applyFilters} onClear={clearFilters} invoiceTypes={invoiceTypes} />
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <InvoicesTable invoices={invoices} loading={loading} invoiceTypes={invoiceTypes} />
        </CardContent>
        <CardFooter className="!p-0">
          <PaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </CardFooter>
      </Card>
    </div>
  );
};

export default Invoices;
