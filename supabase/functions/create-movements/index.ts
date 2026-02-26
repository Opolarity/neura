import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing environment variables");
    }

    const authHeader = req.headers.get("Authorization");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    let userId = null;
    let branchId = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && user) {
        userId = user.id;
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("branch_id")
          .eq("UID", userId)
          .single();
        
        branchId = profile?.branch_id;
      }
    }

    const input = await req.json();

    if (!input.amount || input.amount <= 0) throw new Error("El monto debe ser mayor a 0");
    if (!input.payment_method_id) throw new Error("Se requiere payment_method_id");

    console.log(`Creating movement... Mode: ${authHeader ? 'Authenticated' : 'Anonymous'}`);

    const { data, error } = await supabase.rpc("sp_create_movement", {
      p_user_id: userId,                                  
      p_branch_id: branchId,              
      p_amount: input.amount,                       
      p_movement_date: input.movement_date,        
      p_description: input.description || null,    
      p_payment_method_id: input.payment_method_id,
      p_movement_type_id: input.movement_type_id,  
      p_movement_class_id: input.movement_class_id 
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, movement: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in create-movement:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});