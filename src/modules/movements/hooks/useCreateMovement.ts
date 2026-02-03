import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
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

export type MovementType = "income" | "expense";

interface UseCreateMovementProps {
  movementType: MovementType;
}

export const useCreateMovement = ({ movementType }: UseCreateMovementProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodWithAccount[]>([]);
  const [classes, setClasses] = useState<MovementClass[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<CurrentUserProfile | null>(null);
  const [selectedBusinessAccount, setSelectedBusinessAccount] = useState<string>("");
  const [movementTypeId, setMovementTypeId] = useState<number | null>(null);

  const isIncome = movementType === "income";

  const messages = {
    title: isIncome ? "Añadir Ingreso" : "Añadir Gasto",
    subtitle: isIncome
      ? "Registra un nuevo ingreso en el sistema"
      : "Registra un nuevo gasto en el sistema",
    success: isIncome
      ? "Ingreso registrado correctamente"
      : "Gasto registrado correctamente",
    error: isIncome
      ? "No se pudo registrar el ingreso"
      : "No se pudo registrar el gasto",
    label: isIncome ? "Ingreso" : "Gasto",
  };

  const form = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      movement_date: new Date().toISOString().split("T")[0],
    },
  });

  const { setValue, watch } = form;
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
      const [pmData, classesData, userProfile, movementTypes] = await Promise.all([
        paymentMethodsWithAccountApi(),
        movementClassesApi(),
        currentUserProfileApi(user.id),
        movementTypesApi(),
      ]);

      setPaymentMethods(pmData);
      setClasses(classesData);
      setCurrentUserProfile(userProfile);

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
        description: messages.success,
      });

      navigate("/movements");
    } catch (error: any) {
      console.error("Error creating movement:", error);
      toast({
        title: "Error",
        description: error.message || messages.error,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate("/movements");
  };

  return {
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
  };
};
