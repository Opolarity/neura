import { useSales } from "../hooks/useSales";
import SalesHeader from "../components/sales/SalesHeader";
import SalesFilterBar from "../components/sales/SalesFilterBar";
import SalesFilterModal from "../components/sales/SalesFilterModal";
import { SalePaymentStatusBadge } from "../components/sales/SalePaymentStatusBadge";
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
import { formatDateDisplay } from "@/shared/utils/date";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useNavigate } from "react-router-dom";
import { ComponentPermission } from "@/shared/components/component-permission";

const getStatusClassName = (statusCode: string): string => {
  switch (statusCode.toLowerCase()) {
    case "cfm":
      return "bg-info hover:bg-info/80 text-info-foreground";
    case "com":
      return "bg-success hover:bg-success/80 text-success-foreground";
    case "pen":
      return "bg-warning hover:bg-warning/80 text-warning-foreground";
    case "can":
      return "bg-destructive hover:bg-destructive/80 text-destructive-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

// Checkbox, ID, Fecha, Documento, Cliente, Canal, Estado, Estado de pago,
// Total, Acciones. Si el rol no puede editar, la columna de Acciones no se
// pinta y este número queda uno largo: solo afecta a las filas de "cargando" y
// "no hay ventas", y la columna sobrante colapsa a 0px porque ninguna otra
// fila la ocupa.
const COL_SPAN = 10;

// Code de la columna Acciones, en una constante para que la cabecera y la
// celda no puedan quedar con listas distintas y aparezca un th sin td o al
// revés.
const ACTION_CODES = ["sales.edit"];

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
    <div className="h-full min-h-0 flex flex-col gap-4">
      <SalesHeader selectedSales={selectedSales} handleNewSale={goToNewSale} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <SalesFilterBar
            search={search}
            onSearchChange={onSearchChange}
            onOpen={onOpenFilterModal}
            order={filters.order}
            onOrderChange={onOrderChange}
            hasActiveFilters={hasActiveFilters}
          />
        </CardHeader>

        <CardContent className="p-0 relative flex-1 min-h-0 overflow-hidden">
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
                <TableHead className="w-[200px]">Cliente</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Estado de pago</TableHead>
                <TableHead className="text-right">Total</TableHead>
                {/* Se envuelve el th entero y no su texto: una celda vacía
                    sigue ocupando su ancho y deja un hueco muerto. */}
                <ComponentPermission codeIn={ACTION_CODES}>
                  <TableHead className="text-center">Acciones</TableHead>
                </ComponentPermission>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COL_SPAN} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando ventas...
                    </div>
                  </TableCell>
                </TableRow>
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={COL_SPAN}
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
                        ? formatDateDisplay(sale.date)
                        : "-"}
                    </TableCell>
                    <TableCell>{sale.documentNumber}</TableCell>
                    <TableCell className="max-w-[150px] truncate">
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
                    <TableCell className="text-center">
                      <SalePaymentStatusBadge status={sale.paymentStatus} short />
                    </TableCell>
                    <TableCell className="text-right">
                      S/ {Number(sale.total).toFixed(2)}
                    </TableCell>
                    <ComponentPermission codeIn={ACTION_CODES}>
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
                    </ComponentPermission>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="!p-0">
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
