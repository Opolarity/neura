import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const size = parseInt(url.searchParams.get("size") || "20");
    const search = url.searchParams.get("search") || "";
    const showParam = url.searchParams.get("show");
    const accountType = url.searchParams.get("account_type");
    const order = url.searchParams.get("order") || "desc";

    const offset = (page - 1) * size;

    // Build base query for accounts with stats - use inner join to only get accounts with types
    let query = supabase
      .from("accounts")
      .select(`
        id,
        name,
        middle_name,
        last_name,
        last_name2,
        document_type_id,
        document_number,
        show,
        account_types!inner(
          types!inner(name)
        )
      `, { count: "exact" });

    // Apply filters
    if (showParam !== null && showParam !== "") {
      query = query.eq("show", showParam === "true");
    }

    if (accountType) {
      query = query.eq("account_types.account_type_id", parseInt(accountType));
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,document_number.ilike.%${search}%,last_name.ilike.%${search}%`
      );
    }

    // Apply ordering
    query = query.order("id", { ascending: order === "asc" });

    // Apply pagination
    query = query.range(offset, offset + size - 1);

    const { data: accounts, error: accountsError, count } = await query;

    if (accountsError) {
      console.error("Error fetching accounts:", accountsError);
      throw accountsError;
    }

    // Get purchase stats for all accounts
    const accountIds = accounts?.map((a) => a.id) || [];
    const documentNumbers = accounts?.map((a) => a.document_number) || [];

    // Get order stats by document_number
    const { data: orderStats, error: statsError } = await supabase
      .from("orders")
      .select("document_number, total")
      .in("document_number", documentNumbers);

    if (statsError) {
      console.error("Error fetching order stats:", statsError);
    }

    // Calculate stats per document_number
    const statsMap: Record<string, { total_purchases: number; total_spent: number }> = {};
    orderStats?.forEach((order) => {
      if (!statsMap[order.document_number]) {
        statsMap[order.document_number] = { total_purchases: 0, total_spent: 0 };
      }
      statsMap[order.document_number].total_purchases += 1;
      statsMap[order.document_number].total_spent += parseFloat(order.total) || 0;
    });

    // Format response
    const formattedAccounts = accounts?.map((account: any) => {
      const typeName = account.account_types?.[0]?.types?.name || "";
      const stats = statsMap[account.document_number] || { total_purchases: 0, total_spent: 0 };

      return {
        id: account.id,
        name: account.name,
        middle_name: account.middle_name,
        last_name: account.last_name,
        last_name2: account.last_name2,
        document_type_id: account.document_type_id,
        document_number: account.document_number,
        show: account.show,
        types_name: typeName,
        total_purchases: stats.total_purchases,
        total_spent: stats.total_spent,
      };
    }) || [];

    const response = {
      accountsdata: {
        data: formattedAccounts,
        page: {
          page,
          size,
          total: count || 0,
        },
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in get-accounts:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
