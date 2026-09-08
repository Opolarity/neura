import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  movementClassesApi,
  currentUserProfileApi,
  createMovementApi,
  movementTypesApi,
  createMovementClassApi,
  uploadMovementAttachment,
  createOrderPaymentsForMovement,
  cashBusinessAccountsApi,
  allowedMovementReasonIds,
} from "../services/movements.service";
import {
  MovementFormData,
  PaymentMethodWithAccount,
  MovementClass,
  CurrentUserProfile,
} from "../types/Movements.types";
import { getPaymentMethodsIsActiveTrueAndActiveTrue } from "@/shared/services/service";
import { useUserProfile } from "@/modules/auth/hooks/useUserProfile";
import { getTodayDate } from "@/shared/utils/date";
import { toastError } from "@/shared/utils/toastError";

const movementSchema = z.object({
  amount: z
    .string()
    .min(1, "El monto es requerido")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "El monto debe ser mayor a 0",
    }),
  payment_method_id: z.string().min(1, "El método de pago es requerido"),
  movement_class_id: z.string().min(1, "El motivo es requerido"),
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
  const { user, permissionCodes, isAdmin } = useAuth();
  // La sucursal sale del perfil cacheado una vez por sesión, el mismo
  // mecanismo que ya usan POS, crear venta y devoluciones.
  // `currentUserProfileApi()` sigue vivo, pero solo alimenta el nombre del
  // usuario en el resumen: deja de ser la fuente de la sucursal.
  const { profile } = useUserProfile();

  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodWithAccount[]>([]);
  const [classes, setClasses] = useState<MovementClass[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<CurrentUserProfile | null>(null);
  const [selectedBusinessAccount, setSelectedBusinessAccount] = useState<string>("");
  const [businessAccountAmount, setBusinessAccountAmount] = useState<number>(0);
  const [movementTypeId, setMovementTypeId] = useState<number | null>(null);
  const [businessAccounts, setBusinessAccounts] = useState<{ id: number; name: string; total_amount: number }[]>([]);
  const [needsManualBusinessAccount, setNeedsManualBusinessAccount] = useState(false);
  const [selectedManualBusinessAccountId, setSelectedManualBusinessAccountId] = useState<string>("");
  const [classSearchOpen, setClassSearchOpen] = useState(false);
  const [classSearch, setClassSearch] = useState("");
  const [selectedClassName, setSelectedClassName] = useState("");
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const isIncome = movementType === "income";

  // T-274 — FAIL-CLOSED. "Ver cajas de todas las sucursales" depende SOLO de
  // isAdmin o del permiso movements.accounts.all_branches; no hay ninguna otra
  // vía. Un perfil sin sucursal NO cae en "ve todas": cae en el estado vacío
  // explicativo de MovementFundsSource.
  //
  // "Sucursal válida" se mide por branch_id > 0 y NO por branches.is_active:
  // la fila centinela id 0 está inactiva en main pero activa en develop, así
  // que el id es el único criterio estable en los dos entornos.
  const canSeeAllBranches =
    isAdmin || permissionCodes.includes("movements.accounts.all_branches");
  const userBranchId =
    typeof profile?.branch_id === "number" ? profile.branch_id : null;
  const hasValidBranch = !!userBranchId && userBranchId > 0;
  // Solo bloquea cuando el método de pago exige elegir caja (Efectivo).
  const missingBranch = !canSeeAllBranches && !hasValidBranch;
  const canCreateReason =
    isAdmin || permissionCodes.includes("movements.reasons.create");

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
      movement_date: getTodayDate(),
    },
  });

  const { setValue, watch } = form;
  const selectedPaymentMethodId = watch("payment_method_id");
  const inputAmount = watch("amount");

  // Método de pago seleccionado (objeto completo, para el slot de origen de fondos)
  const selectedPaymentMethod =
    paymentMethods.find((pm) => pm.id.toString() === selectedPaymentMethodId) ?? null;

  // Monto con debounce (150ms) para recalcular el saldo restante en vivo sin saltos
  const [debouncedAmount, setDebouncedAmount] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      const parsed = Number(inputAmount);
      setDebouncedAmount(Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
    }, 150);
    return () => clearTimeout(timer);
  }, [inputAmount]);

  // T-274 — Con método Efectivo, si el usuario no tiene sucursal válida o su
  // sucursal no tiene cajas activas, no hay nada que elegir: se deshabilita el
  // guardado para no disparar una llamada que el servidor va a rechazar igual.
  const cashSelectionBlocked =
    needsManualBusinessAccount && (missingBranch || businessAccounts.length === 0);

  // ¿Hay una cuenta resuelta? (fija por el método, o elegida manualmente)
  const hasAccountSelected = needsManualBusinessAccount
    ? !!selectedManualBusinessAccountId
    : !!selectedBusinessAccount;

  // Nombre de la cuenta resuelta (para el resumen)
  const fundsAccountName = needsManualBusinessAccount
    ? (businessAccounts.find((ba) => ba.id.toString() === selectedManualBusinessAccountId)?.name ?? "")
    : selectedBusinessAccount;

  // Saldo restante: gasto resta, ingreso suma
  const remainingAmount = isIncome
    ? businessAccountAmount + debouncedAmount
    : businessAccountAmount - debouncedAmount;

  // Sobregiro (solo gasto): el monto supera el saldo disponible (bloquea el envío).
  const liveAmount = Number(inputAmount);
  const exceedsAvailableAmount =
    !isIncome &&
    hasAccountSelected &&
    businessAccountAmount > 0 &&
    Number.isFinite(liveAmount) &&
    liveAmount > 0 &&
    liveAmount > businessAccountAmount;

  useEffect(() => {
    fetchData();
  }, [user, movementType, userBranchId, canSeeAllBranches]);

  useEffect(() => {
    if (selectedPaymentMethodId) {
      const selected = paymentMethods.find(
        (pm) => pm.id.toString() === selectedPaymentMethodId
      );
      if (selected) {
        const needsManual = !selected.business_account_id || selected.business_account_id === 0;
        setNeedsManualBusinessAccount(needsManual);
        if (needsManual) {
          setSelectedBusinessAccount("");
          setSelectedManualBusinessAccountId("");
          setBusinessAccountAmount(0);
        } else if (selected.business_accounts) {
          setSelectedBusinessAccount(selected.business_accounts.name);
          setSelectedManualBusinessAccountId("");
          setBusinessAccountAmount(selected.business_accounts.total_amount);
        } else {
          setSelectedBusinessAccount("");
          setBusinessAccountAmount(0);
        }
      }
    } else {
      setSelectedBusinessAccount("");
      setNeedsManualBusinessAccount(false);
      setSelectedManualBusinessAccountId("");
    }
  }, [selectedPaymentMethodId, paymentMethods]);

  useEffect(() => {
    if (needsManualBusinessAccount && selectedManualBusinessAccountId) {
      const selected = businessAccounts.find(
        (ba) => ba.id.toString() === selectedManualBusinessAccountId
      );
      setBusinessAccountAmount(selected ? selected.total_amount : 0);
    } else if (needsManualBusinessAccount) {
      setBusinessAccountAmount(0);
    }
  }, [selectedManualBusinessAccountId, needsManualBusinessAccount, businessAccounts]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const [pmData, classesData, userProfile, movementTypes, baData, allowedReasonIds] =
        await Promise.all([
          getPaymentMethodsIsActiveTrueAndActiveTrue(),
          movementClassesApi(),
          currentUserProfileApi(user.id),
          movementTypesApi(),
          // Solo cajas (types.code = 'CHR') de la sucursal del usuario.
          cashBusinessAccountsApi(userBranchId, canSeeAllBranches),
          allowedMovementReasonIds(),
        ]);

      setPaymentMethods(pmData as any as PaymentMethodWithAccount[]);
      setBusinessAccounts((baData || []).map((ba: any) => ({ id: ba.id, name: ba.name, total_amount: ba.total_amount })));

      // Recorte de motivos por parámetro. Vacío = sin restricción, que es el
      // comportamiento actual. Ninguna clase se desactiva en el catálogo.
      const canSeeAllReasons =
        isAdmin || permissionCodes.includes("movements.reasons.all");
      setClasses(
        allowedReasonIds.length > 0 && !canSeeAllReasons
          ? classesData.filter((c) => allowedReasonIds.includes(c.id))
          : classesData
      );
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
      toastError(error, "No se pudieron cargar los datos");
    }
  };

  const refreshClasses = async () => {
    const classesData = await movementClassesApi();
    setClasses(classesData);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      const created = await createMovementClassApi(newCategoryName.trim());
      await refreshClasses();
      setValue("movement_class_id", created.id.toString());
      setSelectedClassName(created.name);
      setNewCategoryDialogOpen(false);
      setNewCategoryName("");
      toast({ title: "Motivo creado", description: `"${created.name}" fue agregado.`, variant: "success" });
    } catch (error: any) {
      toastError(error, "No se pudo crear el motivo");
    } finally {
      setCreatingCategory(false);
    }
  };

  const onSubmit = async (data: MovementFormData, files: File[] = [], linkedOrderIds: number[] = []) => {
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
      const payload: any = {
        amount: Number(data.amount),
        movement_date: data.movement_date,
        description: data.description,
        payment_method_id: Number(data.payment_method_id),
        movement_type_id: movementTypeId,
        movement_class_id: Number(data.movement_class_id),
      };

      if (needsManualBusinessAccount && selectedManualBusinessAccountId) {
        payload.business_account_id = Number(selectedManualBusinessAccountId);
      }

      if (files.length > 0) {
        const timestamp = Date.now();
        const results = await Promise.allSettled(
          files.map((file, i) => uploadMovementAttachment(file, `${timestamp}-${i}`))
        );
        const uploaded = results
          .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
          .map((r) => r.value);
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          toast({
            title: "Advertencia",
            description: `${failed} archivo(s) no se pudieron subir. El movimiento se creará sin ellos.`,
            variant: "destructive",
          });
        }
        if (uploaded.length > 0) {
          payload.files_url = uploaded;
        }
      }

      const response = await createMovementApi(payload);

      if (linkedOrderIds.length > 0 && response?.movement?.id) {
        const businessAccountId = needsManualBusinessAccount && selectedManualBusinessAccountId
          ? Number(selectedManualBusinessAccountId)
          : null;
        try {
          await createOrderPaymentsForMovement(
            response.movement.id,
            linkedOrderIds,
            Number(data.payment_method_id),
            Number(data.amount),
            data.movement_date,
            businessAccountId,
          );
        } catch (linkError: any) {
          console.error("Error linking orders:", linkError);
          toastError(linkError, "El ingreso fue creado pero no se pudieron vincular las ventas.", "Advertencia");
        }
      }

      toast({
        title: "Éxito",
        description: messages.success,
        variant: "success",
      });

      navigate("/movements");
    } catch (error: any) {
      console.error("Error creating movement:", error);
      toastError(error, messages.error);
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
    missingBranch,
    canCreateReason,
    cashSelectionBlocked,
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
  };
};
