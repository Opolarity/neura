import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { buildEndpoint } from "@/shared/utils/query";
import { franchiseLineSalesAdapter } from "../adapters/FranchiseSaleAdjustment.adapter";
import type {
  AdjustFranchiseSalePayload,
  FranchiseLineSales,
  FranchiseLineSalesResponse,
} from "../types/FranchiseSaleAdjustment.types";

export const fetchFranchiseLineSales = async (
  orderProductId: number,
): Promise<FranchiseLineSales> => {
  const data = await invokeFunction<FranchiseLineSalesResponse>(
    buildEndpoint("get-franchise-line-sales", { order_product_id: orderProductId }),
    { method: "GET" },
  );
  return franchiseLineSalesAdapter(data);
};

export const adjustFranchiseSale = async ({
  saleId,
  newUnitPrice,
  reason,
  adjustmentKey,
}: AdjustFranchiseSalePayload): Promise<void> => {
  await invokeFunction("fch-adjust-sale-price", {
    method: "POST",
    body: {
      sale_id: saleId,
      new_unit_price: newUnitPrice,
      reason,
      adjustment_key: adjustmentKey,
    },
  });
};
