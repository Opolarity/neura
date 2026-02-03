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
import { ArrowLeft, Loader2 } from "lucide-react";
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

              {/* Cuenta de Negocio (Bloqueada) */}
              <div className="space-y-2">
                <Label htmlFor="business_account">Cuenta de Negocio</Label>
                <Input
                  id="business_account"
                  value={selectedBusinessAccount}
                  disabled
                  className="bg-muted"
                  placeholder="Selecciona un método de pago"
                />
              </div>

              {/* Categoría (Classes del módulo MOV) */}
              <div className="space-y-2">
                <Label htmlFor="movement_class_id">Categoría *</Label>
                <Select
                  onValueChange={(value) => setValue("movement_class_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
    </div>
  );
}
