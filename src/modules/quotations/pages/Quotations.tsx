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
import { Button } from "@/components/ui/button";
import { TooltipIconButton } from "@/shared/components/tooltip-icon-button/TooltipIconButton";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Eye, ListFilter, Loader2, SquarePen, Search } from "lucide-react";
import { formatDateDisplay } from "@/shared/utils/date";
import { formatCurrency } from "@/shared/utils/currency";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useNavigate } from "react-router-dom";
import QuotationsHeader from "../components/quotations/QuotationsHeader";
import { QuotationsFilterModal } from "../components/quotations/QuotationsFilterModal";

/**
 * La situación de la cotización (la más temprana de sus líneas), por código:
 * se pinta por variante del Badge. Códigos SPS de personalizado.
 */
const SITUACION_VARIANT: Record<string, NonNullable<BadgeProps["variant"]>> = {
  "INQUO-HDN": "pending",
  "QUOT-HDN": "pending",
  "SENDP-HDN": "info",
  "PROC-HDN": "info",
  "REC-PHY": "success",
  "PAID-PHY": "success",
  "CAN-HDN": "destructive-soft",
};

/** Sin situación conocida, el estado (PEN / COM / CAN de SPS en personalizado). */
const ESTADO_VARIANT: Record<string, NonNullable<BadgeProps["variant"]>> = {
  PEN: "info",
  COM: "success",
  CAN: "destructive-soft",
};

/** El pago, calculado: como en las ventas, a medias sigue siendo Pendiente. */
const PAGO: Record<"PAID" | "PENDING", { label: string; variant: NonNullable<BadgeProps["variant"]> }> = {
  PENDING: { label: "Pendiente", variant: "warning" },
  PAID: { label: "Pagado", variant: "success" },
};

const COLUMNAS = 9;

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
    handleApplyFilters,
    hasActiveFilters,
  } = useQuotations();
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const [inputValue, setInputValue] = useState(search);

  useEffect(() => {
    setInputValue(search);
  }, [search]);

  const handleSearch = () => {
    onSearchChange(inputValue);
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      {/* Todas son externas (a un proveedor): «Nueva» va directo al formulario. */}
      <QuotationsHeader onCreate={() => navigate("/quotations/new")} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          {/* La barra de siempre (neura-styles): búsqueda, lupa y «Filtrar» con
              icono y texto. El orden va en el pop-up. */}
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por código, descripción o proveedor..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-72"
              />
              <Button variant="outline" onClick={handleSearch} aria-label="Buscar">
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <TooltipIconButton
              onClick={() => setFilterModalOpen(true)}
              variant={hasActiveFilters ? "default" : "outline"}
              icon={<ListFilter className="w-4 h-4" />}
              label="Filtrar"
            />
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
                <TableHead>Código</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && quotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLUMNAS} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando cotizaciones...
                    </div>
                  </TableCell>
                </TableRow>
              ) : quotations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={COLUMNAS}
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
                    <TableCell className="font-medium">{q.code ?? `#${q.id}`}</TableCell>
                    <TableCell>
                      {q.createdAt ? formatDateDisplay(q.createdAt) : "—"}
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
                    <TableCell className="text-right tabular-nums">
                      {q.price !== null ? formatCurrency(Number(q.price)) : "—"}
                    </TableCell>
                    <TableCell>
                      {q.situationName ? (
                        <Badge variant={SITUACION_VARIANT[q.situationCode ?? ""] ?? "outline"}>
                          {q.situationName}
                        </Badge>
                      ) : q.statusName ? (
                        <Badge variant={ESTADO_VARIANT[q.statusCode ?? ""] ?? "outline"}>
                          {q.statusName}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {q.paymentStatus ? (
                        <Badge
                          variant={PAGO[q.paymentStatus].variant}
                          title={`Pagado ${formatCurrency(q.paid)} de ${formatCurrency(q.payable)}`}
                        >
                          {PAGO[q.paymentStatus].label}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
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

      <QuotationsFilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={handleApplyFilters}
        filters={filters}
      />
    </div>
  );
};

export default Quotations;
