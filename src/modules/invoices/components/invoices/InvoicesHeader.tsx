import { Button } from "@/components/ui/button";

function InvoicesHeader() {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">FACTURACIÓN</h1>
        <p className="text-gray-600">
          Gestiona y consulta los comprobantes emitidos en el sistema
        </p>
      </div>

      <Button>Nueva Factura</Button>
    </div>
  );
}
export default InvoicesHeader;
