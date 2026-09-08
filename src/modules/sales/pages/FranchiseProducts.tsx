import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Boxes, Download, Filter, Loader2, RefreshCw, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/shared/hooks/use-toast";
import { PagosConfirmarModal } from "../components/PagosConfirmarModal";
import FranchiseFilterModal, {
  type FranchiseFilterValues,
} from "../components/FranchiseFilterModal";
import { generateFranchiseProductsExcel } from "../utils/generateFranchiseProductsExcel";
import {
  fetchFranchiseProducts,
  type FranchiseeOption,
  type FranchiseProductRow,
  type FranchiseProductsFilters,
  type FranchisePaymentStatus,
  type FranchiseSalesStatus,
  type FranchiseStockStatus,
  type FranchiseSummary,
} from "../services/FranchiseProducts.service";
import type { CategoryOption } from "@/shared/components/category-selector";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { toastError } from "@/shared/utils/toastError";
import { ComponentPermission } from "@/shared/components/component-permission";

const formatCurrency = (value: number | null): string => {
  if (value === null) return "-";
  return `S/ ${value.toFixed(2)}`;
};

const formatNumber = (value: number | null): string => {
  if (value === null) return "-";
  return new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(
    value,
  );
};

const DEFAULT_PAYMENT_STATUSES: FranchisePaymentStatus[] = [
  "unpaid",
  "partial",
];
const DEFAULT_SALES_STATUS: FranchiseSalesStatus = "with_sales";
const DEFAULT_STOCK_STATUS: FranchiseStockStatus = "all";

const DEFAULT_FILTERS: FranchiseProductsFilters = {
  page: 1,
  size: 20,
  search: undefined,
  franchisee_only: false,
  date_from: undefined,
  date_to: undefined,
  payment_statuses: DEFAULT_PAYMENT_STATUSES,
  sales_status: DEFAULT_SALES_STATUS,
  account_ids: [],
  stock_status: DEFAULT_STOCK_STATUS,
  order_id: undefined,
  category_ids: [],
};

const hasDefaultPaymentStatuses = (
  statuses: FranchisePaymentStatus[] | undefined,
): boolean => {
  if (!statuses || statuses.length !== DEFAULT_PAYMENT_STATUSES.length) {
    return false;
  }
  return DEFAULT_PAYMENT_STATUSES.every((status) => statuses.includes(status));
};

const FranchiseProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<FranchiseProductRow[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagosModalOpen, setPagosModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [summary, setSummary] = useState<FranchiseSummary | null>(null);
  const [franchisees, setFranchisees] = useState<FranchiseeOption[]>([]);
  // Los ids filtrados viven en `filters`; acá se guardan los objetos solo para
  // conservar el nombre de cada categoría (el modal y el Excel lo necesitan).
  const [selectedCategories, setSelectedCategories] = useState<CategoryOption[]>(
    [],
  );

  const [filters, setFilters] =
    useState<FranchiseProductsFilters>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProducts = useCallback(async (f: FranchiseProductsFilters) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFranchiseProducts(f);
      setProducts(result.data);
      setPagination(result.pagination);
      setSummary(result.summary);
      setFranchisees(result.franchisees);
    } catch (err) {
      console.error("Error loading franchise products:", err);
      setError("No se pudo cargar el listado de productos de franquicia.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts(filters);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const newFilters: FranchiseProductsFilters = {
        ...filters,
        search: value || undefined,
        page: 1,
      };
      setFilters(newFilters);
      loadProducts(newFilters);
    }, 500);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    loadProducts(newFilters);
  };

  const handlePageSizeChange = (size: number) => {
    const newFilters = { ...filters, size, page: 1 };
    setFilters(newFilters);
    loadProducts(newFilters);
  };

  const handleRefresh = () => loadProducts(filters);

  const handleExportExcel = async () => {
    try {
      setExporting(true);

      let total = pagination.total;
      let exportSummary = summary;

      if (!total) {
        const probe = await fetchFranchiseProducts({
          ...filters,
          page: 1,
          size: 1,
        });
        total = probe.pagination.total;
        exportSummary = probe.summary;
      }

      if (!total) {
        toast({ title: "No hay registros para exportar con los filtros aplicados.", variant: "info" });
        return;
      }

      const result = await fetchFranchiseProducts({
        ...filters,
        page: 1,
        size: total,
      });

      generateFranchiseProductsExcel({
        rows: result.data,
        summary: result.summary ?? exportSummary,
        filters,
        filterLabels: {
          franchisees: selectedFranchiseeNames,
          categories: selectedCategories
            .map((category) => category.name)
            .join(", "),
        },
      });

      toast({ title: `${result.data.length} registros exportados correctamente.`, variant: "success" });
    } catch (err) {
      console.error("Error exporting franchise products:", err);
      toastError(err, "No se pudo generar el Excel. Inténtalo de nuevo.");
    } finally {
      setExporting(false);
    }
  };

  const handleApplyFilters = (values: FranchiseFilterValues) => {
    const newFilters: FranchiseProductsFilters = {
      ...filters,
      date_from: values.dateFrom,
      date_to: values.dateTo,
      payment_statuses: values.paymentStatuses,
      sales_status: values.salesStatus,
      account_ids: values.accountIds,
      stock_status: values.stockStatus,
      order_id: values.orderId,
      category_ids: values.categories.map((category) => category.id),
      page: 1,
    };
    setSelectedCategories(values.categories);
    setFilters(newFilters);
    loadProducts(newFilters);
    setFilterModalOpen(false);
  };

  const handleClearFilters = () => {
    const newFilters: FranchiseProductsFilters = {
      ...filters,
      date_from: undefined,
      date_to: undefined,
      payment_statuses: DEFAULT_PAYMENT_STATUSES,
      sales_status: DEFAULT_SALES_STATUS,
      account_ids: [],
      stock_status: DEFAULT_STOCK_STATUS,
      order_id: undefined,
      category_ids: [],
      page: 1,
    };
    setSelectedCategories([]);
    setFilters(newFilters);
    loadProducts(newFilters);
    setFilterModalOpen(false);
  };

  const hasActiveFilters =
    !!(filters.date_from || filters.date_to) ||
    !hasDefaultPaymentStatuses(filters.payment_statuses) ||
    filters.sales_status !== DEFAULT_SALES_STATUS ||
    !!filters.account_ids?.length ||
    (filters.stock_status ?? DEFAULT_STOCK_STATUS) !== DEFAULT_STOCK_STATUS ||
    !!filters.order_id ||
    !!filters.category_ids?.length;

  const filterValues: FranchiseFilterValues = useMemo(
    () => ({
      dateFrom: filters.date_from,
      dateTo: filters.date_to,
      paymentStatuses: filters.payment_statuses ?? DEFAULT_PAYMENT_STATUSES,
      salesStatus: filters.sales_status ?? DEFAULT_SALES_STATUS,
      accountIds: filters.account_ids ?? [],
      stockStatus: filters.stock_status ?? DEFAULT_STOCK_STATUS,
      orderId: filters.order_id,
      categories: selectedCategories,
    }),
    [filters, selectedCategories],
  );

  // El SP devuelve toda cuenta con consignaciones; el filtro solo lista las que
  // son franquiciadas (las que tienen tenant_reference).
  const franchiseeOptions = useMemo(
    () => franchisees.filter((franchisee) => franchisee.isFranchisee),
    [franchisees],
  );

  const selectedFranchiseeNames = useMemo(
    () =>
      franchiseeOptions
        .filter((franchisee) => filters.account_ids?.includes(franchisee.id))
        .map((franchisee) => franchisee.name)
        .join(", "),
    [franchiseeOptions, filters.account_ids],
  );

  const totals = useMemo(
    () =>
      products.reduce(
        (acc, item) => {
          acc.quantity += item.quantity;
          acc.sold += item.soldByFranchise ?? 0;
          // Neto de promociones. Viene valorizado por evento desde el SP:
          // cada venta a su precio, no precio vigente x cantidad.
          acc.soldAmount += item.soldAmount;
          acc.promoDiscount += item.franchiseDiscount;
          acc.paid += item.paidByFranchise ?? 0;
          acc.total += item.total;
          return acc;
        },
        {
          quantity: 0,
          sold: 0,
          soldAmount: 0,
          promoDiscount: 0,
          paid: 0,
          total: 0,
        },
      ),
    [products],
  );

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Productos de Franquicia
          </h1>
          <p className="text-muted-foreground">
            Order products recibidos por franquicia.
          </p>
        </div>
        <div className="flex gap-2">
          <ComponentPermission codeIn={["franchise_stock.list"]}>
            <Button
              variant="outline"
              onClick={() => navigate("/stock/products/franchise")}
            >
              <Boxes className="mr-2 h-4 w-4" />
              Inventario
            </Button>
          </ComponentPermission>
          <Button
            variant="outline"
            onClick={() => setPagosModalOpen(true)}
          >
            Pagos por confirmar
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total enviado", value: summary?.totalSent ?? null },
          // Con filtro de fecha, "vendido" es lo del rango; "pagado" y "por
          // pagar" siguen siendo acumulados de la línea (los pagos no se
          // pueden atribuir a una fecha), así que se rotulan para que nadie
          // los sume contra el vendido del rango.
          {
            label: summary?.dateFilterActive
              ? "Total vendido (en el rango)"
              : "Total vendido",
            value: summary?.totalSold ?? null,
          },
          {
            label: summary?.dateFilterActive
              ? "Total pagado (del rango)"
              : "Total pagado",
            value: summary?.totalPaid ?? null,
          },
          {
            label: summary?.dateFilterActive
              ? "Total por pagar (del rango)"
              : "Total por pagar",
            value: summary?.totalPending ?? null,
          },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="!p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              {loading && summary === null ? (
                <div className="mt-1 h-7 w-32 animate-pulse rounded bg-muted" />
              ) : (
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {value !== null ? formatCurrency(value) : "-"}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar producto o SKU..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setFilterModalOpen(true)}
              className={hasActiveFilters ? "border-primary text-primary" : ""}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={loading || exporting}
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {exporting ? "Generando..." : "Descargar Excel"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del producto</TableHead>
                <TableHead>ID de la orden</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Cantidad vendida</TableHead>
                <TableHead className="text-right">Dscto. promo</TableHead>
                <TableHead className="text-right">Monto vendido</TableHead>
                <TableHead className="text-right">Total pagado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Franquiciado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando productos...
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-8 text-center text-destructive"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No hay productos recibidos por franquicia.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="min-w-[220px] font-medium">
                      {item.productName}
                    </TableCell>
                    <TableCell>#{item.orderId}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(item.quantity)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(item.soldByFranchise)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.franchiseDiscount > 0
                        ? formatCurrency(item.franchiseDiscount)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.soldAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.paidByFranchise)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.total)}
                    </TableCell>
                    <TableCell className="min-w-[180px]">
                      {item.franchiseName ?? "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {products.length > 0 && !loading && !error && (
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">
                    Totales (página)
                  </TableCell>
                  <TableCell />
                  <TableCell className="text-right font-semibold">
                    {formatNumber(totals.quantity)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatNumber(totals.sold)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(totals.promoDiscount)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(totals.soldAmount)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(totals.paid)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(totals.total)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>

        <CardFooter className="!p-0">
          <PaginationBar
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>

      <PagosConfirmarModal
        open={pagosModalOpen}
        onOpenChange={setPagosModalOpen}
      />

      <FranchiseFilterModal
        isOpen={filterModalOpen}
        values={filterValues}
        franchisees={franchiseeOptions}
        onClose={() => setFilterModalOpen(false)}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
    </div>
  );
};

export default FranchiseProducts;
