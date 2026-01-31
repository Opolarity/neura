import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("authorization")?.split(" ")[1];
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile for branch and warehouse
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("branch_id, warehouse_id")
      .eq("UID", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const input = await req.json();
    const { action } = input;

    // =============================================
    // ACTION: OPEN - Open a new cash session
    // =============================================
    if (action === "open") {
      const { openingAmount, notes, businessAccountId } = input;

      if (!businessAccountId) {
        return new Response(
          JSON.stringify({ error: "businessAccountId is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data, error } = await supabase.rpc("sp_open_pos_session", {
        p_user_id: user.id,
        p_warehouse_id: profile.warehouse_id,
        p_branch_id: profile.branch_id,
        p_opening_amount: openingAmount || 0,
        p_business_account_id: businessAccountId,
        p_notes: notes || null,
      });

      if (error) {
        console.error("Error opening cash session:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to open cash session",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify({ success: true, session: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =============================================
    // ACTION: CLOSE - Close an existing cash session
    // =============================================
    if (action === "close") {
      const { sessionId, closingAmount, notes } = input;

      if (!sessionId || closingAmount === undefined) {
        return new Response(
          JSON.stringify({
            error: "sessionId and closingAmount are required",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data, error } = await supabase.rpc("sp_close_pos_session", {
        p_user_id: user.id,
        p_session_id: sessionId,
        p_closing_amount: closingAmount,
        p_notes: notes || null,
      });

      if (error) {
        console.error("Error closing cash session:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to close cash session",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify({ success: true, session: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =============================================
    // ACTION: GET-ACTIVE - Get the active cash session
    // =============================================    
    if (action === "get-active") {
      const { data, error } = await supabase
        .from("pos_sessions")
        .select("*, status:statuses(*)")
        .eq("branch_id", profile.branch_id)
        .eq("warehouse_id", profile.warehouse_id)
        .eq("user_id", user.id)
        .eq("status_id", input.openTypeId)
        .maybeSingle();

      if (error) {
        console.error("Error getting active cash session:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to get active cash session",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Return null session if no active session found (this is valid)
      return new Response(JSON.stringify({ success: true, session: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Invalid action
    return new Response(
      JSON.stringify({
        error: "Invalid action. Valid actions: open, close, get-active",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in manage-cash-session:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
