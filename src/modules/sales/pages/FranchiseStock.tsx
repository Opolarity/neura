import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useState } from "react";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useFranchiseStock } from "../hooks/useFranchiseStock";
import FranchiseeEntryModal from "../components/franchise-stock/FranchiseeEntryModal";
import FranchiseStockTable from "../components/franchise-stock/FranchiseStockTable";
import FranchiseStockFilterBar from "../components/franchise-stock/FranchiseStockFilterBar";
import FranchiseStockFilterModal from "../components/franchise-stock/FranchiseStockFilterModal";

/**
 * Stock de franquicias (/stock/products/franchise).
 *
 * Solo lectura: muestra cuánta mercadería de marca Overtake le queda a un
 * franquiciado en cada uno de sus almacenes. El dato vive en el backend de
 * franquiciados y llega por la edge function puente get-franchise-stock.
 */
const FranchiseStock = () => {
  const {
    franchisees,
    loadingFranchisees,
    tenantReference,
    rows,
    warehouses,
    categories,
    loading,
    search,
    pagination,
    isOpenFilterModal,
    filters,
    hasActiveFilters,
    onSelectFranchisee,
    onSearchChange,
    onPageChange,
    handlePageSizeChange,
    onOrderChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
  } = useFranchiseStock();

  // La pantalla arranca pidiendo franquiciado: sin él no hay nada que mostrar.
  // Una vez elegido no vuelve a abrirse — el select de la barra sigue ahí para
  // cambiarlo sin salir.
  const [showEntryModal, setShowEntryModal] = useState(true);

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <FranchiseeEntryModal
        open={showEntryModal}
        franchisees={franchisees}
        loading={loadingFranchisees}
        onAccept={(tenant) => {
          onSelectFranchisee(tenant);
          setShowEntryModal(false);
        }}
      />

      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Stock de franquicias
        </h1>
        <p className="text-muted-foreground">
          Mercadería de Overtake disponible en los almacenes del franquiciado
        </p>
      </div>

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <FranchiseStockFilterBar
            franchisees={franchisees}
            loadingFranchisees={loadingFranchisees}
            tenantReference={tenantReference}
            onSelectFranchisee={onSelectFranchisee}
            search={search}
            onSearchChange={onSearchChange}
            onOpen={onOpenFilterModal}
            order={filters.order}
            onOrderChange={onOrderChange}
            hasActiveFilters={hasActiveFilters}
          />
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <FranchiseStockTable
            rows={rows}
            warehouses={warehouses}
            loading={loading}
            hasFranchisee={!!tenantReference}
          />
        </CardContent>

        <CardFooter className="!p-0">
          <PaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>

      <FranchiseStockFilterModal
        filters={filters}
        categories={categories}
        isOpen={isOpenFilterModal}
        onClose={onCloseFilterModal}
        onApply={onApplyFilter}
      />
    </div>
  );
};

export default FranchiseStock;
