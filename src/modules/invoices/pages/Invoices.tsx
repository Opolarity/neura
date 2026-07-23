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
    <div>
      <InvoicesHeader onOpenOrder = {()=>setIsOrderModalOpen(true)} />

      <OrderSelectionModal
        mode="create"
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
      />
      <Card>
        <CardHeader>
          <InvoicesFilterBar activeFilters={activeFilters} onApply={applyFilters} onClear={clearFilters} invoiceTypes={invoiceTypes} />
        </CardHeader>
        <CardContent>
          <InvoicesTable invoices={invoices} loading={loading} />
        </CardContent>
        <CardFooter>
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
