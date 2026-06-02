import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { PagosConfirmarModal } from "../components/PagosConfirmarModal";
import {
  fetchFranchiseProducts,
  type FranchiseProductRow,
} from "../services/FranchiseProducts.service";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const FranchiseProducts = () => {
  const [products, setProducts] = useState<FranchiseProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagosModalOpen, setPagosModalOpen] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filterFranchisee, setFilterFranchisee] = useState<
    "all" | "franchisee"
  >("all");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFranchiseProducts();
      setProducts(data);
    } catch (err) {
      console.error("Error loading franchise products:", err);
      setError("No se pudo cargar el listado de productos de franquicia.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const lowerSearch = searchText.toLowerCase();
    return products.filter((p) => {
      if (filterFranchisee === "franchisee" && !p.isFranchisee) return false;
      if (
        lowerSearch &&
        !p.productName.toLowerCase().includes(lowerSearch) &&
        !(p.franchiseName ?? "").toLowerCase().includes(lowerSearch)
      )
        return false;
      return true;
    });
  }, [products, filterFranchisee, searchText]);

  const paginatedProducts = useMemo(
    () => filteredProducts.slice((page - 1) * pageSize, page * pageSize),
    [filteredProducts, page, pageSize],
  );

  const pagination: PaginationState = {
    p_page: page,
    p_size: pageSize,
    total: filteredProducts.length,
  };

  const totals = useMemo(
    () =>
      filteredProducts.reduce(
        (acc, item) => {
          acc.quantity += item.quantity;
          acc.sold += item.soldByFranchise ?? 0;
          acc.paid += item.paidByFranchise ?? 0;
          acc.total += item.total;
          return acc;
        },
        { quantity: 0, sold: 0, paid: 0, total: 0 },
      ),
    [filteredProducts],
  );

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    setPage(1);
  };

  const handleFranchiseeFilterChange = (value: "all" | "franchisee") => {
    setFilterFranchisee(value);
    setPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

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
          <Button variant="outline" onClick={loadProducts} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Actualizar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por producto o franquiciado..."
                value={searchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={filterFranchisee}
              onValueChange={(v) =>
                handleFranchiseeFilterChange(v as "all" | "franchisee")
              }
            >
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Franquiciado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="franchisee">Solo franquiciados</SelectItem>
              </SelectContent>
            </Select>
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
                ) : paginatedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No hay productos recibidos por franquicia.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((item) => (
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
              {filteredProducts.length > 0 && !loading && !error && (
                <tfoot>
                  <TableRow>
                    <TableCell className="font-semibold">Totales</TableCell>
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
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>

      <PagosConfirmarModal
        open={pagosModalOpen}
        onOpenChange={setPagosModalOpen}
      />
    </div>
  );
};

export default FranchiseProducts;
