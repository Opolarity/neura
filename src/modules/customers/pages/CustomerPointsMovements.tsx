import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useCustomerPointsMovements } from "../hooks/useCustomerPointsMovements";
import { CustomerPointsMovementsTable } from "../components/CustomerPointsMovementsTable";
import { AddPointsDialog } from "../components/AddPointsDialog";

const CustomerPointsMovements = () => {
  const {
    data,
    loading,
    search,
    pagination,
    handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
    reload,
  } = useCustomerPointsMovements();

  const [addDialogOpen, setAddDialogOpen] = useState(false);

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <AddPointsDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={reload}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Movimientos de Puntos</h1>
          <p className="text-muted-foreground">Historial de movimientos de puntos por cliente</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Sumar Puntos
        </Button>
      </div>

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o documento..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <CustomerPointsMovementsTable data={data} loading={loading} />
        </CardContent>
        <CardFooter className="!p-0">
          <PaginationBar
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>
    </div>
  );
};

export default CustomerPointsMovements;
