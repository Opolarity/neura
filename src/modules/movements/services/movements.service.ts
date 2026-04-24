import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/utils";
import {
  MovementApiResponse,
  MovementFilters,
  MovementType,
  MovementCategory,
  PaymentMethod,
  BusinessAccount,
  PaymentMethodWithAccount,
  MovementClass,
  CurrentUserProfile,
  CreateMovementPayload,
  CreateMovementResponse,
} from "../types/Movements.types";

export const movementsApi = async (
  filters: MovementFilters = {}
): Promise<MovementApiResponse> => {
  const endpoint = buildEndpoint("get-movements", filters);

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  console.log("Movements API response:", data);
  console.log("Movements API error:", error);

  if (error) {
    console.error("Error fetching movements:", error);
    throw error;
  }

  // Check if response contains an error from the edge function
  if (data?.error) {
    console.error("Edge function error:", data.error);
    throw new Error(data.error);
  }

  return (
    data ?? {
      movements: {
        data: [],
        page: { p_page: 1, p_size: 20, total: 0 },
      },
    }
  );
};

export const movementTypesApi = async (): Promise<MovementType[]> => {
  const { data, error } = await (supabase as any)
    .from("types")
    .select(
      `
    id,
    name,
    modules!inner (
      id
    )
  `,
    )
    .eq("modules.code", "MOV");

  if (error) throw error;
  return data ?? [];
};

export const movementCategoriesApi = async (): Promise<MovementCategory[]> => {
  const { data, error } = await (supabase as any)
    .from("classes")
    .select("id, name")
    .order("name");

  if (error) throw error;
  return data ?? [];
};



// =============================================================================
// SERVICIOS PARA EL FORMULARIO DE MOVIMIENTOS
// =============================================================================

export const paymentMethodsWithAccountApi = async (): Promise<
  PaymentMethodWithAccount[]
> => {
  const { data, error } = await (supabase as any)
    .from("payment_methods")
    .select("id, name, business_account_id, business_accounts(name)")
    .eq("active", true)
    .order("name");

  if (error) throw error;
  return data ?? [];
};

export const movementClassesApi = async (): Promise<MovementClass[]> => {
  // First get the module id for 'MOV'
  const { data: moduleData, error: moduleError } = await (supabase as any)
    .from("modules")
    .select("id")
    .eq("code", "MOV")
    .single();

  if (moduleError) throw moduleError;

  // Then get classes for that module
  const { data, error } = await (supabase as any)
    .from("classes")
    .select("id, name, code")
    .eq("module_id", moduleData.id)
    .order("name");

  if (error) throw error;
  return data ?? [];
};

export const currentUserProfileApi = async (
  userId: string
): Promise<CurrentUserProfile> => {
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("UID, accounts:account_id(name, last_name)")
    .eq("UID", userId)
    .single();

  if (error) throw error;

  return {
    UID: data.UID,
    name: data.accounts?.name || "",
    last_name: data.accounts?.last_name || "",
  };
};

export const createMovementClassApi = async (name: string): Promise<MovementClass> => {
  const { data, error } = await (supabase as any)
    .from("classes")
    .insert({ name, module_id: 9, code: "MOV" })
    .select("id, name, code")
    .single();

  if (error) throw error;
  return data;
};

export const uploadMovementAttachment = async (
  file: File,
  fileName: string,
): Promise<string> => {
  const fileExt = file.name.split(".").pop() || "jpg";
  const filePath = `movements/vouchers/${fileName}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("PrivateData")
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("sales").getPublicUrl(filePath);

  return publicUrl;
};

export const createMovementApi = async (
  payload: CreateMovementPayload
): Promise<CreateMovementResponse> => {
  const { data, error } = await supabase.functions.invoke("create-movements", {
    method: "POST",
    body: payload,
  });

  if (error) {
    console.error("Error creating movement:", error);
    throw error;
  }

  if (data?.error) {
    console.error("Edge function error:", data.error);
    throw new Error(data.error);
  }

  return data;
};

export const movementSalesChannels = async (): Promise<{ id: number; name: string }[]> => {
  const { data, error } = await supabase
    .from("sale_types")
    .select("id,name")
    .eq("is_active", true);

  if (error) throw error;
  return data ?? [];
};

export const getMovementDetails = async (id: number) => {
  const { data, error } = await supabase.functions.invoke("get-movements-details", {
    body: {id}
  })

  if (error) throw error;
  return data ?? [];
};

async function sha256Hex(str: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const sendFranchiseePayment = async (params: {
  movementId: number;
  amount: number;
  description: string;
  filesUrl: string[];
  movementDate: string;
  franchiseAccount: { tenant_reference: string; document_number: string; document_type_code: string };
  orderIds: number[];
}): Promise<void> => {
  const { movementId, amount, description, filesUrl, movementDate, franchiseAccount, orderIds } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión activa");

  const { data: profileData, error: profileError } = await (supabase as any)
    .from("profiles")
    .select("accounts:account_id(document_number, document_types:document_type_id(code))")
    .eq("UID", user.id)
    .single();

  if (profileError) throw profileError;

  const userAccount = profileData?.accounts;
  const userDocType = userAccount?.document_types?.code ?? "";
  const userDocNumber = userAccount?.document_number ?? "";

  const hashPayload = {
    tenant_code: franchiseAccount.tenant_reference,
    supplier_document_type: franchiseAccount.document_type_code,
    supplier_document_number: franchiseAccount.document_number,
    user_document_type: userDocType,
    user_document_number: userDocNumber,
  };

  const secret = import.meta.env.VITE_CONSIGNMENT_API_SECRET ?? "";
  const signature = await sha256Hex(JSON.stringify(hashPayload) + secret);

  const dateStr = movementDate.split("T")[0];
  const quotationCode = orderIds.map(String).join(",");

  const body = {
    quotation_code: quotationCode,
    branch_code: "BR-01",
    payments: [
      {
        amount,
        description,
        payment_method_code: "YAPE",
        files_url: filesUrl,
        voucher_url: filesUrl[0] ?? null,
        date: dateStr,
      },
    ],
  };

  const response = await fetch(
    "https://demo.supabase.neura.pe/functions/v1/supplier_quotations_payments",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${signature}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error al enviar: ${response.status} ${errText}`);
  }

  const { error: updateError } = await (supabase as any)
    .from("movements")
    .update({ franchisee_sended: new Date().toISOString() })
    .eq("id", movementId);

  if (updateError) throw updateError;
};

export const createOrderPaymentsForMovement = async (
  movementId: number,
  orderIds: number[],
  paymentMethodId: number,
  amount: number,
  date: string,
  businessAccountId: number | null,
) => {
  const rows = orderIds.map((orderId) => ({
    order_id: orderId,
    movement_id: movementId,
    payment_method_id: paymentMethodId,
    amount,
    date,
    business_acount_id: businessAccountId ?? null,
  }));
  const { error } = await supabase.from("order_payment").insert(rows);
  if (error) throw error;
};