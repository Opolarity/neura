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
import { Loader2, SquarePen, Eye } from "lucide-react";
import { format } from "date-fns";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useNavigate } from "react-router-dom";

const getStatusClassName = (statusCode: string): string => {
  switch (statusCode.toLowerCase()) {
    case "cfm":
      return "bg-teal-400 hover:bg-teal-500 text-white";
    case "com":
      return "bg-green-500 hover:bg-green-600 text-white";
    case "pen":
      return "bg-yellow-400 hover:bg-yellow-500 text-white";
    case "drf":
      return "bg-cyan-200 hover:bg-cyan-300 text-cyan-900";
    case "can":
      return "bg-red-500 hover:bg-red-600 text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const Sales = () => {
  const navigate = useNavigate();
  const {
    sales,
    saleTypes,
    saleSituations,
    loading,
    search,
    pagination,
    isOpenFilterModal,
    filters,
    selectedSales,
    hasActiveFilters,
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
            hasActiveFilters={hasActiveFilters}
          />
        </CardHeader>

        <CardContent className="p-0 relative">
          {loading && sales.length > 0 && (
            <div className="absolute inset-0 z-50 bg-background/80 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
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
                <TableHead>Canal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando ventas...
                    </div>
                  </TableCell>
                </TableRow>
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
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
                    <TableCell>{sale.saleTypeName || "-"}</TableCell>
                    <TableCell>
                      {sale.situationName ? (
                        <Badge className={getStatusClassName(sale.statusCode)}>
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
                          variant="outline"
                          size="sm"
                          onClick={() => goToSaleDetail(sale.id)}
                        >
                          <SquarePen className="w-4 h-4" />
                        </Button>
                        {/*<Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/sales/${sale.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>*/}
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
        saleSituations={saleSituations}
        onClose={onCloseFilterModal}
        onApply={onApplyFilter}
        onClear={onClearFilters}
      />
    </div>
  );
};

export default Sales;
