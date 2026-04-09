import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card.tsx";
import InvoicesFilterBar from "../components/invoices/InvoicesFilterBar.tsx";
import InvoicesTable from "../components/invoices/InvoicesTable";
import { useInvoices } from "../hooks/useInvoices";
import { Button } from "@/components/ui/button";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar.tsx";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus } from "lucide-react";
import OrderSelectionModal from "../components/invoices/OrderSelectionModal";

const Invoices = () => {
  const { invoices, loading, pagination, onPageChange, onPageSizeChange } = useInvoices();
  const navigate = useNavigate();
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">FACTURACIÓN</h1>
          <p className="text-gray-600">
            Gestiona y consulta los comprobantes emitidos en el sistema
          </p>
        </div>


        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex gap-2">
                <Plus className="h-4 w-4" />
                Nueva Factura
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate("/invoices/add")}>
                Factura Vacía
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsOrderModalOpen(true)}>
                A partir de un pedido
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <OrderSelectionModal 
        mode="create"
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSelect={(orderId) => {
          navigate(`/invoices/add?orderId=${orderId}`);
        }}
      />
      <Card>
        <CardHeader>
          <InvoicesFilterBar />
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
