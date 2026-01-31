import { useSales } from "../hooks/useSales";
import SalesHeader from "../components/sales/SalesHeader";
import SalesFilterBar from "../components/sales/SalesFilterBar";
import SalesFilterModal from "../components/sales/SalesFilterModal";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Eye } from "lucide-react";
import { format } from "date-fns";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useNavigate } from "react-router-dom";

const getStatusVariant = (
  statusCode: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (statusCode) {
    case "CFM":
      return "default";
    case "CAN":
      return "destructive";
    case "RES":
      return "secondary";
    default:
      return "outline";
  }
};

const Sales = () => {
  const navigate = useNavigate();
  const {
    sales,
    saleTypes,
    saleStatuses,
    loading,
    search,
    pagination,
    isOpenFilterModal,
    filters,
    selectedSales,
    onSearchChange,
    onPageChange,
    onOrderChange,
    handlePageSizeChange,
    toggleSelectAll,
    toggleSaleSelection,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    onClearFilters,
    goToNewSale,
    goToSaleDetail,
  } = useSales();

  return (
    <div className="space-y-6">
      <SalesHeader selectedSales={selectedSales} handleNewSale={goToNewSale} />

      <Card>
        <CardHeader>
          <SalesFilterBar
            search={search}
            onSearchChange={onSearchChange}
            onOpen={onOpenFilterModal}
            order={filters.order}
            onOrderChange={onOrderChange}
          />
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedSales.length === sales.length && sales.length > 0
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando ventas...
                    </div>
                  </TableCell>
                </TableRow>
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {search
                      ? "No se encontraron ventas"
                      : "No hay ventas registradas"}
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedSales.includes(sale.id)}
                        onCheckedChange={() => toggleSaleSelection(sale.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">#{sale.id}</TableCell>
                    <TableCell>
                      {sale.date
                        ? format(new Date(sale.date), "dd/MM/yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>{sale.documentNumber}</TableCell>
                    <TableCell>
                      {sale.customerName} {sale.customerLastname}
                    </TableCell>
                    <TableCell>
                      {sale.situationName ? (
                        <Badge
                          variant={getStatusVariant(sale.statusCode)}
                          className={
                            sale.statusCode === "RES"
                              ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                              : ""
                          }
                        >
                          {sale.situationName}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      S/ {Number(sale.total).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => goToSaleDetail(sale.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/sales/${sale.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter>
          <PaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>

      <SalesFilterModal
        isOpen={isOpenFilterModal}
        filters={filters}
        saleTypes={saleTypes}
        saleStatuses={saleStatuses}
        onClose={onCloseFilterModal}
        onApply={onApplyFilter}
        onClear={onClearFilters}
      />
    </div>
  );
};

export default Sales;
