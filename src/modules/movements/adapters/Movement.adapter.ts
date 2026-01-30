import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Movement,
  MovementApiResponse,
  MovementTypeValue,
  PaginationState,
  MovementSummary,
} from "../types/Movements.types";

const formatCurrency = (amount: number): string => {
  return amount.toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: es });
  } catch {
    return dateString;
  }
};

export const movementAdapter = (response: MovementApiResponse) => {
  const rawData = response.movements;

  // Handle different possible response structures
  let movementsData: any;
  if (rawData && typeof rawData === "object") {
    if ("movements" in rawData) {
      movementsData = rawData.movements;
    } else if ("data" in rawData) {
      movementsData = rawData;
    } else if (Array.isArray(rawData)) {
      movementsData = { data: rawData, page: { page: 1, size: 20, total: rawData.length } };
    } else {
      movementsData = rawData;
    }
  } else {
    movementsData = { data: [], page: { page: 1, size: 20, total: 0 } };
  }

  const dataArray = Array.isArray(movementsData) ? movementsData : (movementsData?.data ?? []);

  const formattedMovements: Movement[] = dataArray.map(
    (item) => ({
      id: item.id,
      date: formatDate(item.movement_date),
      rawDate: item.movement_date,
      type: item.type as MovementTypeValue,
      category: item.class || "-",
      description: item.description || "-",
      paymentMethod: item.payment_method || "-",
      businessAccount: item.business_account || "-",
      branch: item.branches || "-",
      user: item.user || "-",
      amount: item.amount,
      formattedAmount: formatCurrency(item.amount),
    })
  );

  const pagination: PaginationState = {
    p_page: movementsData?.page?.page ?? 1,
    p_size: movementsData?.page?.size ?? 20,
    total: movementsData?.page?.total ?? dataArray.length,
  };

  return { movements: formattedMovements, pagination };
};

export const calculateMovementSummary = (
  movements: Movement[]
): MovementSummary => {
  const totalIncome = movements
    .filter((m) => m.type === "Ingreso")
    .reduce((sum, m) => sum + m.amount, 0);

  const totalExpense = movements
    .filter((m) => m.type === "Egreso")
    .reduce((sum, m) => sum + m.amount, 0);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
};
