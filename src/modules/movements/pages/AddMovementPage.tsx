import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/modules/auth/hooks/useAuth";
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
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  paymentMethodsWithAccountApi,
  movementClassesApi,
  currentUserProfileApi,
  createMovementApi,
  movementTypesApi,
} from "../services/movements.service";
import {
  MovementFormData,
  PaymentMethodWithAccount,
  MovementClass,
  CurrentUserProfile,
  MovementType,
} from "../types/Movements.types";

const movementSchema = z.object({
  amount: z
    .string()
    .min(1, "El monto es requerido")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "El monto debe ser mayor a 0",
    }),
  payment_method_id: z.string().min(1, "El método de pago es requerido"),
  movement_class_id: z.string().min(1, "La categoría es requerida"),
  user_id: z.string().optional(),
  description: z.string().optional(),
  movement_date: z.string().min(1, "La fecha es requerida"),
});

interface AddMovementPageProps {
  movementType: "income" | "expense";
}

export default function AddMovementPage({ movementType }: AddMovementPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodWithAccount[]>([]);
  const [classes, setClasses] = useState<MovementClass[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<CurrentUserProfile | null>(null);
  const [selectedBusinessAccount, setSelectedBusinessAccount] = useState<string>("");
  const [movementTypeId, setMovementTypeId] = useState<number | null>(null);

  const isIncome = movementType === "income";
  const title = isIncome ? "Añadir Ingreso" : "Añadir Gasto";
  const subtitle = isIncome
    ? "Registra un nuevo ingreso en el sistema"
    : "Registra un nuevo gasto en el sistema";
  const successMessage = isIncome
    ? "Ingreso registrado correctamente"
    : "Gasto registrado correctamente";
  const errorMessage = isIncome
    ? "No se pudo registrar el ingreso"
    : "No se pudo registrar el gasto";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      movement_date: new Date().toISOString().split("T")[0],
    },
  });

  const selectedPaymentMethodId = watch("payment_method_id");

  useEffect(() => {
    fetchData();
  }, [user, movementType]);

  useEffect(() => {
    if (selectedPaymentMethodId) {
      const selected = paymentMethods.find(
        (pm) => pm.id.toString() === selectedPaymentMethodId
      );
      if (selected && selected.business_accounts) {
        setSelectedBusinessAccount(selected.business_accounts.name);
      } else {
        setSelectedBusinessAccount("");
      }
    } else {
      setSelectedBusinessAccount("");
    }
  }, [selectedPaymentMethodId, paymentMethods]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch all data in parallel
      const [pmData, classesData, userProfile, movementTypes] = await Promise.all([
        paymentMethodsWithAccountApi(),
        movementClassesApi(),
        currentUserProfileApi(user.id),
        movementTypesApi(),
      ]);

      setPaymentMethods(pmData);
      setClasses(classesData);
      setCurrentUserProfile(userProfile);

      // Find movement type based on whether it's income or expense
      const typeName = isIncome ? "Ingreso" : "Egreso";
      const movementTypeData = movementTypes.find((mt) => mt.name === typeName);

      if (!movementTypeData) {
        throw new Error(
          `No se encontró el tipo de movimiento "${typeName}". Por favor, contacta al administrador.`
        );
      }

      setMovementTypeId(movementTypeData.id);
      setValue("user_id", user.id);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los datos",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: MovementFormData) => {
    if (!user || !movementTypeId) {
      toast({
        title: "Error",
        description: "No se pudo determinar el tipo de movimiento",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await createMovementApi({
        amount: Number(data.amount),
        movement_date: data.movement_date,
        description: data.description,
        payment_method_id: Number(data.payment_method_id),
        movement_type_id: movementTypeId,
        movement_class_id: Number(data.movement_class_id),
      });

      toast({
        title: "Éxito",
        description: successMessage,
      });

      navigate("/movements");
    } catch (error: any) {
      console.error("Error creating movement:", error);
      toast({
        title: "Error",
        description: error.message || errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Información del {isIncome ? "Ingreso" : "Gasto"}
          </CardTitle>
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
                  onValueChange={(value) =>
                    setValue("payment_method_id", value)
                  }
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
                  onValueChange={(value) =>
                    setValue("movement_class_id", value)
                  }
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
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar {isIncome ? "Ingreso" : "Gasto"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
