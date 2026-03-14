import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useCustomerPoints } from "../hooks/useCustomerPoints";
import { CustomerPointsTable } from "../components/CustomerPointsTable";
import { AddPointsDialog } from "../components/AddPointsDialog";

const CustomerPoints = () => {
  const {
    data,
    loading,
    search,
    pagination,
    handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
    reload,
  } = useCustomerPoints();

  const [addDialogOpen, setAddDialogOpen] = useState(false);

  return (
    <div className="p-6">
      <AddPointsDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={reload}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Puntos de Clientes</h1>
          <p className="text-muted-foreground">Ranking de puntos por cliente</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Sumar Puntos
        </Button>
      </div>

      <Card>
        <CardHeader>
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
        <CardContent className="p-0">
          <CustomerPointsTable data={data} loading={loading} />
          <PaginationBar
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerPoints;
