import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { useCreateMovement, MovementType } from "../hooks/useCreateMovement";

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
    isIncome,
    messages,
    onSubmit,
    goBack,
    businessAccounts,
    needsManualBusinessAccount,
    selectedManualBusinessAccountId,
    setSelectedManualBusinessAccountId,
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

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;

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

      <Card>
        <CardHeader>
          <CardTitle>Información del {messages.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monto */}
              <div className="space-y-2">
                <Label htmlFor="amount">Monto *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("amount")}
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              {/* Fecha */}
              <div className="space-y-2">
                <Label htmlFor="movement_date">Fecha *</Label>
                <Input
                  id="movement_date"
                  type="date"
                  {...register("movement_date")}
                />
                {errors.movement_date && (
                  <p className="text-sm text-destructive">
                    {errors.movement_date.message}
                  </p>
                )}
              </div>

              {/* Método de Pago */}
              <div className="space-y-2">
                <Label htmlFor="payment_method_id">Método de Pago *</Label>
                <Select
                  onValueChange={(value) => setValue("payment_method_id", value)}
                >
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
                  <p className="text-sm text-destructive">
                    {errors.payment_method_id.message}
                  </p>
                )}
              </div>

              {/* Cuenta de Negocio */}
              <div className="space-y-2">
                <Label htmlFor="business_account">Cuenta de Negocio{needsManualBusinessAccount ? " *" : ""}</Label>
                {needsManualBusinessAccount ? (
                  <Select
                    value={selectedManualBusinessAccountId}
                    onValueChange={setSelectedManualBusinessAccountId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cuenta de negocio" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessAccounts.map((ba) => (
                        <SelectItem key={ba.id} value={ba.id.toString()}>
                          {ba.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="business_account"
                    value={selectedBusinessAccount || "No especificado"}
                    disabled
                    className="bg-muted"
                    placeholder="Selecciona un método de pago"
                  />
                )}
              </div>

              {/* Categoría (Classes del módulo MOV) */}
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Popover open={classSearchOpen} onOpenChange={setClassSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
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
                            .filter((cls) =>
                              cls.name.toLowerCase().includes(classSearch.toLowerCase())
                            )
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
                  <p className="text-sm text-destructive">
                    {errors.movement_class_id.message}
                  </p>
                )}
              </div>

              {/* Usuario (Bloqueado - Usuario actual) */}
              <div className="space-y-2">
                <Label htmlFor="user_id">Usuario</Label>
                <Input
                  id="user_id"
                  value={
                    currentUserProfile
                      ? `${currentUserProfile.name} ${currentUserProfile.last_name}`
                      : "Cargando..."
                  }
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder={`Ingresa una descripción del ${
                  isIncome ? "ingreso" : "gasto"
                }...`}
                rows={4}
                {...register("description")}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar {messages.label}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
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
            <Button
              onClick={handleCreateCategory}
              disabled={creatingCategory || !newCategoryName.trim()}
            >
              {creatingCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
