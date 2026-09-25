import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Loader2, Search } from "lucide-react";
import { formatDateTime } from "@/shared/utils/date";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/shared/components/MultiSelect";
import {
  DateRangeFilter,
  type DateRangeValue,
} from "@/shared/components/date-range";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useToast } from "@/hooks/use-toast";
import {
  fetchPendingPayments,
  fetchPendingPaymentFranchises,
  confirmPendingPayment,
  isFullyCoveredByCredit,
  type PendingPaymentFilter,
  type PendingPaymentRow,
} from "../services/PendingPayments.service";
import { FranchisePaymentInvoicesModal } from "./FranchisePaymentInvoicesModal";
import { toastError } from "@/shared/utils/toastError";

interface PagosConfirmarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FILTERS: Array<{ value: PendingPaymentFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Por confirmar" },
  { value: "approved", label: "Confirmados" },
];

const EMPTY_MESSAGE: Record<PendingPaymentFilter, string> = {
  all: "No hay pagos registrados.",
  pending: "No hay pagos pendientes de confirmación.",
  approved: "Todavía no hay pagos confirmados.",
};

const FILTERED_EMPTY_MESSAGE = "No hay pagos que coincidan con los filtros.";

const SEARCH_DEBOUNCE_MS = 500;

export const PagosConfirmarModal = ({
  open,
  onOpenChange,
}: PagosConfirmarModalProps) => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PendingPaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<PendingPaymentFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [franchiseNames, setFranchiseNames] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    startDate: null,
    endDate: null,
  });
  const [franchiseOptions, setFranchiseOptions] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [invoicesPayment, setInvoicesPayment] = useState<PendingPaymentRow | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Con el buscador salen varias consultas seguidas: solo se pinta la última,
  // para que una respuesta lenta no pise a la más reciente.
  const requestIdRef = useRef(0);

  const loadPayments = async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const { rows, total: count } = await fetchPendingPayments({
        status: filter,
        page,
        size,
        search,
        franchiseNames,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      if (requestId !== requestIdRef.current) return;
      setPayments(rows);
      setTotal(count);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error("Error cargando pagos:", err);
      toastError(err, "No se pudo cargar los pagos.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadPayments();
  }, [open, filter, page, size, search, franchiseNames, dateRange]);

  // Las tiendas se recargan en cada apertura: un franquiciado nuevo aparece
  // en el filtro en cuanto manda su primer pago.
  useEffect(() => {
    if (!open) return;
    fetchPendingPaymentFranchises()
      .then(setFranchiseOptions)
      .catch((err) => {
        console.error("Error cargando franquiciados de pagos:", err);
      });
  }, [open]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const franchiseSelectOptions = useMemo(
    () => franchiseOptions.map((name) => ({ label: name, value: name })),
    [franchiseOptions],
  );

  const hasActiveFilters =
    search !== "" ||
    franchiseNames.length > 0 ||
    dateRange.startDate !== null ||
    dateRange.endDate !== null;

  const handleFilterChange = (value: PendingPaymentFilter) => {
    if (value === filter) return;
    setPage(1);
    setFilter(value);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setSearch(value.trim());
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleFranchiseChange = (value: string[]) => {
    setPage(1);
    setFranchiseNames(value);
  };

  const handleDateChange = (range: DateRangeValue) => {
    setPage(1);
    setDateRange(range);
  };

  const handleConfirm = async (payment: PendingPaymentRow) => {
    setConfirmingId(payment.id);
    try {
      await confirmPendingPayment(payment.id);
      toast({
        title: "Pago confirmado",
        description: `El pago de ${payment.franchiseName} por S/ ${payment.totalAmount.toFixed(2)} fue registrado correctamente.`,
        variant: "success",
      });
      await loadPayments();
    } catch (err) {
      console.error("Error confirmando pago:", err);
      toastError(err, "No se pudo confirmar el pago.", "Error al confirmar");
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[880px]">
        <DialogHeader>
          <DialogTitle>Pagos por confirmar</DialogTitle>
          <DialogDescription>
            Revisa los comprobantes y confirma los pagos recibidos de
            franquiciados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por código..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <MultiSelect
              options={franchiseSelectOptions}
              value={franchiseNames}
              onChange={handleFranchiseChange}
              placeholder="Franquiciados"
              showSearch
              showClear
              maxVisible={1}
              className="w-[240px]"
            />
            <Select
              value={filter}
              onValueChange={(value) =>
                handleFilterChange(value as PendingPaymentFilter)
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DateRangeFilter
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={handleDateChange}
            startLabel="Desde"
            endLabel="Hasta"
            layout="inline"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando pagos...
            </div>
          ) : payments.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">
              {hasActiveFilters ? FILTERED_EMPTY_MESSAGE : EMPTY_MESSAGE[filter]}
            </p>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border">
              <Table containerClassName="flex-1 min-h-0">
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Franquiciado</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Comprobantes</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDateTime(payment.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {payment.franchiseName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.movementCode}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <span className="font-semibold">
                          S/ {payment.totalAmount.toFixed(2)}
                        </span>
                        {/* Desglose solo cuando parte (o todo) se cubrió con el
                            crédito de franquicia: DEB sobre la cuenta CRE. */}
                        {payment.creditAmount > 0 && (
                          <div className="mt-1 flex flex-col items-end gap-0.5 text-xs text-muted-foreground">
                            <span>Efectivo S/ {payment.cashAmount.toFixed(2)}</span>
                            <span>
                              Crédito aplicado S/ {payment.creditAmount.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {payment.files.length === 0 &&
                        isFullyCoveredByCredit(payment) ? (
                          // No hubo dinero de por medio: no hay comprobante que
                          // exigir ni revisar.
                          <Badge variant="info">Cubierto con crédito</Badge>
                        ) : payment.files.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            Sin comprobante
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {payment.files.map((url, i) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Badge
                                  variant="outline"
                                  className="cursor-pointer gap-1 hover:bg-muted"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Archivo {i + 1}
                                </Badge>
                              </a>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === "approved" ? "success" : "pending"
                          }
                        >
                          {payment.status === "approved"
                            ? "Confirmado"
                            : "Por confirmar"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {payment.status === "approved" ? (
                          <div className="flex flex-col items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setInvoicesPayment(payment)}
                            >
                              Comprobantes
                            </Button>
                            <span className="whitespace-nowrap text-sm text-muted-foreground">
                              {payment.processedAt
                                ? formatDateTime(payment.processedAt)
                                : "—"}
                            </span>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            disabled={confirmingId === payment.id}
                            onClick={() => handleConfirm(payment)}
                          >
                            {confirmingId === payment.id ? (
                              <>
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                Confirmando...
                              </>
                            ) : (
                              "Confirmar"
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="border-t">
                <PaginationBar
                  pagination={{ p_page: page, p_size: size, total }}
                  onPageChange={setPage}
                  onPageSizeChange={(newSize) => {
                    setPage(1);
                    setSize(newSize);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {invoicesPayment && (
          <FranchisePaymentInvoicesModal
            payment={invoicesPayment}
            open
            onOpenChange={(isOpen) => {
              if (!isOpen) setInvoicesPayment(null);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
