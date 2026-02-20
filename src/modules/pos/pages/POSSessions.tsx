import { usePOSSessions } from "../hooks/usePOSSessions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Eye, ListFilter, X } from "lucide-react";
import { format } from "date-fns";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/modules/sales/adapters/POS.adapter";

const POSSessions = () => {
  const navigate = useNavigate();
  const {
    sessions,
    loading,
    search,
    filters,
    pagination,
    filtersOpen,
    setFiltersOpen,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    differenceType,
    setDifferenceType,
    salesMin,
    setSalesMin,
    salesMax,
    setSalesMax,
    activeFilterCount,
    onSearchChange,
    onOrderChange,
    onApplyFilters,
    onClearFilters,
    onPageChange,
    handlePageSizeChange,
    goToOpenPOS,
  } = usePOSSessions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Sesiones de Caja</h1>
          <p className="text-muted-foreground mt-1">
            Historial de sesiones del punto de venta
          </p>
        </div>
        <Button onClick={goToOpenPOS}>Ir a Punto de Venta</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                type="text"
                placeholder="Buscar por usuario, sucursal..."
                className="pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              />
            </div>

            <Button
              variant={filtersOpen ? "default" : "outline"}
              className="gap-2"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <ListFilter className="w-4 h-4" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            <Select
              value={filters.orderBy}
              onValueChange={onOrderChange}
            >
              <SelectTrigger className="w-auto min-w-[200px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Fecha (más reciente)</SelectItem>
                <SelectItem value="date-asc">Fecha (más antigua)</SelectItem>
                <SelectItem value="sales-desc">Ventas (mayor a menor)</SelectItem>
                <SelectItem value="sales-asc">Ventas (menor a mayor)</SelectItem>
                <SelectItem value="opening-diff-desc">Dif. apertura (mayor)</SelectItem>
                <SelectItem value="opening-diff-asc">Dif. apertura (menor)</SelectItem>
                <SelectItem value="closing-diff-desc">Dif. cierre (mayor)</SelectItem>
                <SelectItem value="closing-diff-asc">Dif. cierre (menor)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Panel */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleContent>
              <div className="mt-4 p-4 border border-border rounded-lg bg-muted/30 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Rango de Fecha</Label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        placeholder="Desde"
                        className="flex-1"
                      />
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        placeholder="Hasta"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Difference Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Diferencia</Label>
                    <Select
                      value={differenceType || "all"}
                      onValueChange={(v) => setDifferenceType(v === "all" ? "" : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="none">Sin diferencia</SelectItem>
                        <SelectItem value="opening">Diferencia en apertura</SelectItem>
                        <SelectItem value="closing">Diferencia en cierre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sales Range */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Total de ventas</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={salesMin}
                        onChange={(e) => setSalesMin(e.target.value)}
                        placeholder="Mín"
                        min="0"
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={salesMax}
                        onChange={(e) => setSalesMax(e.target.value)}
                        placeholder="Máx"
                        min="0"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={onClearFilters}>
                    <X className="w-4 h-4 mr-1" />
                    Limpiar
                  </Button>
                  <Button size="sm" onClick={onApplyFilters}>
                    Aplicar filtros
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sucursal</TableHead>
                <TableHead>Apertura</TableHead>
                <TableHead>Cierre</TableHead>
                <TableHead className="text-right">Dif. Apertura</TableHead>
                <TableHead className="text-right">Dif. Cierre</TableHead>
                <TableHead className="text-right">Total Ventas</TableHead>
                <TableHead className="text-right">Monto Cierre</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando sesiones...
                    </div>
                  </TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {search
                      ? "No se encontraron sesiones"
                      : "No hay sesiones registradas"}
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{session.branchName}</TableCell>
                    <TableCell>
                      {format(new Date(session.openedAt), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      {session.closedAt
                        ? format(
                            new Date(session.closedAt),
                            "dd/MM/yyyy HH:mm"
                          )
                        : session.statusCode === "OPE" ? (
                            <Badge variant="default">Abierto</Badge>
                          ) : (
                            "—"
                          )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          session.openingDifference < 0
                            ? "text-destructive"
                            : session.openingDifference > 0
                            ? "text-green-600"
                            : ""
                        }
                      >
                        S/ {formatCurrency(session.openingDifference)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {session.difference !== null ? (
                        <span
                          className={
                            session.difference < 0
                              ? "text-destructive"
                              : session.difference > 0
                              ? "text-green-600"
                              : ""
                          }
                        >
                          S/ {formatCurrency(session.difference)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {session.totalSales !== null
                        ? `S/ ${formatCurrency(session.totalSales)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {session.closingAmount !== null
                        ? `S/ ${formatCurrency(session.closingAmount)}`
                        : "—"}
                    </TableCell>
                    <TableCell>{session.userName}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Future: navigate to session detail
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
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
    </div>
  );
};

export default POSSessions;
