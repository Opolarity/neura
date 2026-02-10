import React from "react";
import TableInvoices from "../components/invoices/TableInvoices";
import { useInvoices } from "../hooks/useInvoices";
import { Button } from "@/components/ui/button";

const Invoices = () => {
  const { invoice } = useInvoices();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Facturas {invoice}</h1>
      <p className="text-gray-600">Funcionalidad en desarrollo</p>
      <Button>Hola soy un botón</Button>
      <TableInvoices invoice={invoice} />
    </div>
  );
};

export default Invoices;
