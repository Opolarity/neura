import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Check, ChevronsUpDown, Link2, Loader2, Paperclip, Plus, X } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { useCreateMovement, MovementType } from "../hooks/useCreateMovement";
import { useRef, useState } from "react";
import { MovementFilePreviewModal } from "../components/movements/MovementFilePreviewModal";
import { LinkOrdersModal, OrderSummary } from "../components/movements/LinkOrdersModal";
import MovementFundsSource from "../components/movements/MovementFundsSource";
import MovementSummary from "../components/movements/MovementSummary";
import { toast } from "@/hooks/use-toast";

interface AddMovementPageProps {
  movementType: MovementType;
}

export default function AddMovementPage({ movementType }: AddMovementPageProps) {
  const {
    form,
    loading,
    paymentMethods,
    classes,
    currentUserProfile,
    selectedBusinessAccount,
    businessAccountAmount,
    isIncome,
    messages,
    onSubmit,
    goBack,
    businessAccounts,
    needsManualBusinessAccount,
    selectedManualBusinessAccountId,
    setSelectedManualBusinessAccountId,
    selectedPaymentMethod,
    hasAccountSelected,
    fundsAccountName,
    remainingAmount,
    exceedsAvailableAmount,
    classSearchOpen,
    setClassSearchOpen,
    classSearch,
    setClassSearch,
    selectedClassName,
    setSelectedClassName,
    newCategoryDialogOpen,
    setNewCategoryDialogOpen,
    newCategoryName,
    setNewCategoryName,
    creatingCategory,
    handleCreateCategory,
  } = useCreateMovement({ movementType });

  const [attachments, setAttachments] = useState<File[]>([]);
  const handleAddFiles = (files: File[]) => setAttachments((prev) => [...prev, ...files]);
  const handleRemoveFile = (index: number) => setAttachments((prev) => prev.filter((_, i) => i !== index));

  const [useCustomDate, setUseCustomDate] = useState(false);
  const [nowDisplay] = useState(() => {
    const now = new Date();
    return now.toLocaleString("es-PE", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const openFilePicker = () => fileInputRef.current?.click();

  const [linkedOrders, setLinkedOrders] = useState<OrderSummary[]>([]);
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;

  const formatSoles = (value: number) =>
    `S/ ${new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{messages.title}</h1>
          <p className="text-muted-foreground">{messages.subtitle}</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit((data) => {
          if (exceedsAvailableAmount) {
            toast({
              title: "Error",
              description: "El gasto es mayor al disponible.",
              variant: "destructive",
            });
            return;
          }
          // El SP combina p_movement_date (date) con la hora actual de Lima.
          // Se pasa siempre la fecha local de Lima para no saltar a "mañana" (UTC-5).
          const limaDate = new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
          const submittedDate = useCustomDate ? data.movement_date : limaDate;
          onSubmit({ ...data, movement_date: submittedDate }, attachments, linkedOrders.map((o) => o.id));
        })}
      >
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Columna del formulario */}
          <Card className="w-full flex-1">
            <CardContent className="pt-6 space-y-5">
              {/* Fila 2 columnas: Monto | Fecha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">Monto *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className={exceedsAvailableAmount ? "border-destructive" : ""}
                    {...register("amount")}
                  />
                  {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="movement_date">Fecha *</Label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm text-muted-foreground select-none">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 cursor-pointer"
                        checked={useCustomDate}
                        onChange={(e) => setUseCustomDate(e.target.checked)}
                      />
                      Personalizada
                    </label>
                  </div>
                  {useCustomDate ? (
                    <>
                      <Input id="movement_date" type="date" {...register("movement_date")} />
                      {errors.movement_date && (
                        <p className="text-sm text-destructive">{errors.movement_date.message}</p>
                      )}
                    </>
                  ) : (
                    <Input id="movement_date" value={nowDisplay} disabled className="bg-muted" />
                  )}
                </div>
              </div>

              {/* Fila 2 columnas: Método de pago | Cuenta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-2">
                  <Label htmlFor="payment_method_id">Método de pago *</Label>
                  <Select onValueChange={(value) => setValue("payment_method_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id.toString()}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.payment_method_id && (
                    <p className="text-sm text-destructive">{errors.payment_method_id.message}</p>
                  )}
                </div>

                <MovementFundsSource
                  selectedPaymentMethod={selectedPaymentMethod}
                  selectedBusinessAccount={selectedBusinessAccount}
                  needsManualBusinessAccount={needsManualBusinessAccount}
                  businessAccounts={businessAccounts}
                  selectedManualBusinessAccountId={selectedManualBusinessAccountId}
                  setSelectedManualBusinessAccountId={setSelectedManualBusinessAccountId}
                  isIncome={isIncome}
                />
              </div>

              {/* Categoría (ancho completo) */}
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Popover open={classSearchOpen} onOpenChange={setClassSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                      {selectedClassName || "Seleccionar categoría"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Buscar categoría..."
                        value={classSearch}
                        onValueChange={setClassSearch}
                      />
                      <CommandList className="h-[160px] overflow-y-auto">
                        <CommandEmpty>Sin resultados</CommandEmpty>
                        <CommandGroup>
                          {classes
                            .filter((cls) => cls.name.toLowerCase().includes(classSearch.toLowerCase()))
                            .map((cls) => (
                              <CommandItem
                                key={cls.id}
                                value={cls.name}
                                onSelect={() => {
                                  setValue("movement_class_id", cls.id.toString());
                                  setSelectedClassName(cls.name);
                                  setClassSearchOpen(false);
                                  setClassSearch("");
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    form.watch("movement_class_id") === cls.id.toString()
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {cls.name}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                      <div className="border-t p-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2 text-sm"
                          onClick={() => {
                            setClassSearchOpen(false);
                            setNewCategoryDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          Añadir nueva categoría
                        </Button>
                      </div>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.movement_class_id && (
                  <p className="text-sm text-destructive">{errors.movement_class_id.message}</p>
                )}
              </div>

              {/* Descripción (ancho completo, 3 filas) */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder={`Ingresa una descripción del ${isIncome ? "ingreso" : "gasto"}...`}
                  rows={3}
                  {...register("description")}
                />
              </div>

              {/* Separador de respaldo */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Respaldo · Opcional
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Respaldo: Adjuntos | Ventas (ingreso). Colapsa a 1 columna. */}
              <div className={cn("grid gap-6", isIncome ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
                {/* Adjuntos */}
                <div className="space-y-2">
                  <Label>Adjuntos</Label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (files.length) handleAddFiles(files);
                      e.target.value = "";
                    }}
                  />
                  {attachments.length === 0 ? (
                    <Button type="button" variant="outline" className="w-full justify-center gap-2" onClick={openFilePicker}>
                      <Paperclip className="h-4 w-4" />
                      Adjuntar archivo
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                          <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <button
                            type="button"
                            title={file.name}
                            onClick={() => { setPreviewFile(file); setPreviewOpen(true); }}
                            className="flex-1 truncate text-left hover:underline"
                          >
                            {file.name}
                          </button>
                          <button
                            type="button"
                            aria-label="Quitar"
                            onClick={() => handleRemoveFile(index)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-[13px]" onClick={openFilePicker}>
                        <Plus className="h-3.5 w-3.5" />
                        Agregar otro
                      </Button>
                    </div>
                  )}
                </div>

                {/* Ventas vinculadas (solo ingreso) */}
                {isIncome && (
                  <div className="space-y-2">
                    <Label>Ventas vinculadas</Label>
                    {linkedOrders.length === 0 ? (
                      <Button type="button" variant="outline" className="w-full justify-center gap-2" onClick={() => setLinkModalOpen(true)}>
                        <Link2 className="h-4 w-4" />
                        Vincular venta
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        {linkedOrders.map((order) => (
                          <div key={order.id} className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                            <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="flex-1 truncate">#{order.id} · {order.customer_name}</span>
                            <span className="text-muted-foreground shrink-0">{formatSoles(order.total)}</span>
                            <button
                              type="button"
                              aria-label="Quitar"
                              onClick={() => setLinkedOrders((prev) => prev.filter((o) => o.id !== order.id))}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                        <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-[13px]" onClick={() => setLinkModalOpen(true)}>
                          <Plus className="h-3.5 w-3.5" />
                          Vincular otra
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Columna de resumen */}
          <Card className="w-full lg:w-80 shrink-0 lg:sticky lg:top-6">
            <CardContent className="pt-6">
              <MovementSummary
                isIncome={isIncome}
                label={messages.label}
                fundsAccountName={fundsAccountName}
                hasAccountSelected={hasAccountSelected}
                businessAccountAmount={businessAccountAmount}
                remainingAmount={remainingAmount}
                exceedsAvailableAmount={exceedsAvailableAmount}
                currentUserProfile={currentUserProfile}
                loading={loading}
                onCancel={goBack}
              />
            </CardContent>
          </Card>
        </div>
      </form>

      <MovementFilePreviewModal
        open={previewOpen}
        onOpenChange={(open) => { setPreviewOpen(open); if (!open) setPreviewFile(null); }}
        file={previewFile}
      />

      <LinkOrdersModal
        open={linkModalOpen}
        onOpenChange={setLinkModalOpen}
        selectedOrders={linkedOrders}
        onConfirm={setLinkedOrders}
      />

      <Dialog open={newCategoryDialogOpen} onOpenChange={setNewCategoryDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="new-category-name">Nombre *</Label>
            <Input
              id="new-category-name"
              placeholder="Nombre de la categoría"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewCategoryDialogOpen(false);
                setNewCategoryName("");
              }}
              disabled={creatingCategory}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateCategory} disabled={creatingCategory || !newCategoryName.trim()}>
              {creatingCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
