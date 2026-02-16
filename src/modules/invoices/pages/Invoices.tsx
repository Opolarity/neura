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

const Invoices = () => {
  const { invoice } = useInvoices();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">FACTURACIÓN</h1>
          <p className="text-gray-600">
            Gestiona y consulta los comprobantes emitidos en el sistema
          </p>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          Nueva Factura
        </Button>
      </div>
      <Card>
        <CardHeader>
          <InvoicesFilterBar  />
        </CardHeader>
        <CardContent>
          <InvoicesTable invoice={invoice} />
        </CardContent>
        <CardFooter>
          <PaginationBar pagination={{p_page:1, p_size:20,total:20 }} onPageChange={() => {}} onPageSizeChange={() => {}} />
        </CardFooter>
      </Card>
    </div>
  );
};

export default Invoices;
