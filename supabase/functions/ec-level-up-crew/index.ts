import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { orderId, accountId } = await req.json();

    // Validación básica
    if (!orderId || !accountId) {
      return new Response(
        JSON.stringify({ error: 'orderId and accountId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase.rpc('sp_ec_level_up_crew', {
      p_order_id:   orderId,
      p_account_id: accountId,
    });

    if (error) {
      console.error('RPC Error:', error);
      throw new Error(`Failed to add points: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        success:       true,
        pointsAdded:   data?.points_added   ?? 0,
        amountSpent:   data?.amount_spent    ?? 0,
        ordersQuantity: data?.orders_quantity ?? 0,
        message:       data?.message         ?? 'OK',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Global Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});