import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Filter, Loader2, RefreshCw, Search } from "lucide-react";
import { PagosConfirmarModal } from "../components/PagosConfirmarModal";
import FranchiseFilterModal from "../components/FranchiseFilterModal";
import {
  fetchFranchiseProducts,
  type FranchiseProductRow,
  type FranchiseProductsFilters,
  type FranchiseSummary,
} from "../services/FranchiseProducts.service";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { PaginationState } from "@/shared/components/pagination/Pagination";

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

const DEFAULT_FILTERS: FranchiseProductsFilters = {
  page: 1,
  size: 20,
  search: undefined,
  franchisee_only: false,
  date_from: undefined,
  date_to: undefined,
};

const FranchiseProducts = () => {
  const [products, setProducts] = useState<FranchiseProductRow[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagosModalOpen, setPagosModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [summary, setSummary] = useState<FranchiseSummary | null>(null);

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

  const handleApplyFilters = (
    dateFrom: string | undefined,
    dateTo: string | undefined,
  ) => {
    const newFilters: FranchiseProductsFilters = {
      ...filters,
      date_from: dateFrom,
      date_to: dateTo,
      page: 1,
    };
    setFilters(newFilters);
    loadProducts(newFilters);
    setFilterModalOpen(false);
  };

  const handleClearFilters = () => {
    const newFilters: FranchiseProductsFilters = {
      ...filters,
      date_from: undefined,
      date_to: undefined,
      page: 1,
    };
    setFilters(newFilters);
    loadProducts(newFilters);
    setFilterModalOpen(false);
  };

  const hasActiveFilters = !!(filters.date_from || filters.date_to);

  const totals = useMemo(
    () =>
      products.reduce(
        (acc, item) => {
          acc.quantity += item.quantity;
          acc.sold += item.soldByFranchise ?? 0;
          acc.paid += item.paidByFranchise ?? 0;
          acc.total += item.total;
          return acc;
        },
        { quantity: 0, sold: 0, paid: 0, total: 0 },
      ),
    [products],
  );

  return (
    <div className="space-y-6">
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
          { label: "Total vendido", value: summary?.totalSold ?? null },
          { label: "Total pagado", value: summary?.totalPaid ?? null },
          { label: "Total por pagar", value: summary?.totalPending ?? null },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <p className="text-sm text-muted-foreground">{label}</p>
            </CardHeader>
            <CardContent>
              {loading && summary === null ? (
                <div className="h-7 w-32 animate-pulse rounded bg-muted" />
              ) : (
                <p className="text-2xl font-bold">
                  {value !== null ? formatCurrency(value) : "-"}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar franquiciado..."
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
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del producto</TableHead>
                  <TableHead>ID de la orden</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Cantidad vendida</TableHead>
                  <TableHead className="text-right">Precio unitario</TableHead>
                  <TableHead className="text-right">Total pagado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Franquiciado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cargando productos...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-8 text-center text-destructive"
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
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
                        {formatCurrency(item.productPrice)}
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
                <tfoot>
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
                    <TableCell />
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(totals.paid)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(totals.total)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </tfoot>
              )}
            </Table>
          </div>
        </CardContent>

        <CardFooter>
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
        dateFrom={filters.date_from}
        dateTo={filters.date_to}
        onClose={() => setFilterModalOpen(false)}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
    </div>
  );
};

export default FranchiseProducts;
