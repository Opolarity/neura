import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReturnProduct {
  product_variation_id: number;
  quantity: number;
  product_amount: number;
  output: boolean;
  vinculated_index?: number | null;
}

interface PaymentMethod {
  payment_method_id: number;
  amount: number;
  voucher_url?: string | null;
}

interface CreateReturnPayload {
  order_id: number;
  return_type_id: number;
  return_type_code: string;
  customer_document_number: string;
  customer_document_type_id: number;
  reason: string;
  shipping_return: boolean;
  shipping_cost?: number;
  situation_id: number;
  situation_code: string;
  status_id: number;
  module_id: number;
  total_refund_amount: number;
  total_exchange_difference: number;
  return_products: ReturnProduct[];
  payment_methods?: PaymentMethod[]; // Array de métodos de pago (opcional)
  business_account_id: number;
  branch_id: number;
  warehouse_id: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    if (!user) throw new Error("Unauthorized");

    const payload: CreateReturnPayload = await req.json();

    // Normalizar: si no viene payment_methods o viene vacío, asegurar array vacío
    if (!payload.payment_methods) {
      payload.payment_methods = [];
    }

    const { data, error } = await supabase.rpc("sp_create_return", {
      p_payload: payload,
      p_user_id: user.id,
    });

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    // 👇 distinguir entre Error nativo y cualquier otro objeto
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: corsHeaders }
    );
  }
});