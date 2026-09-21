import { useState, useEffect } from "react";
import { useQuotations } from "../hooks/useQuotations";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, SquarePen, Search } from "lucide-react";
import { format } from "date-fns";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useNavigate } from "react-router-dom";
import QuotationsHeader from "../components/quotations/QuotationsHeader";

const Quotations = () => {
  const navigate = useNavigate();
  const {
    quotations,
    loading,
    search,
    pagination,
    filters,
    onSearchChange,
    onPageChange,
    handlePageSizeChange,
    onOrderChange,
  } = useQuotations();

  const [inputValue, setInputValue] = useState(search);

  useEffect(() => {
    setInputValue(search);
  }, [search]);

  const handleSearch = () => {
    onSearchChange(inputValue);
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <QuotationsHeader onCreate={() => navigate("/quotations/new")} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex gap-2 w-64">
              <Input
                placeholder="Buscar por descripción o proveedor..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <Button variant="outline" onClick={handleSearch}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <Select value={filters.order} onValueChange={onOrderChange}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at_desc">
                  Más reciente primero
                </SelectItem>
                <SelectItem value="created_at_asc">
                  Más antiguo primero
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0 relative flex-1 min-h-0 overflow-hidden">
          {loading && quotations.length > 0 && (
            <div className="absolute inset-0 z-50 bg-background/80 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && quotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando cotizaciones...
                    </div>
                  </TableCell>
                </TableRow>
              ) : quotations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {search
                      ? "No se encontraron cotizaciones con esa búsqueda"
                      : "No hay cotizaciones registradas"}
                  </TableCell>
                </TableRow>
              ) : (
                quotations.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">#{q.id}</TableCell>
                    <TableCell>
                      {q.createdAt
                        ? format(new Date(q.createdAt), "dd/MM/yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell>{q.supplierName}</TableCell>
                    <TableCell
                      className="max-w-[300px] truncate"
                      title={q.description}
                    >
                      {q.description}
                    </TableCell>
                    <TableCell className="text-right">
                      {q.quantity !== null ? q.quantity : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {q.price !== null
                        ? `S/ ${Number(q.price).toFixed(2)}`
                        : "—"}
                    </TableCell>
                    <TableCell>{q.statusName ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/quotations/view/${q.id}`)}
                          title="Ver cotización"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/quotations/edit/${q.id}`)}
                          title="Editar cotización"
                        >
                          <SquarePen className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
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
    </div>
  );
};

export default Quotations;
