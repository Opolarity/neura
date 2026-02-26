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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const authHeader = req.headers.get('Authorization');

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const size = Number(url.searchParams.get('size')) || 20;
    const search = url.searchParams.get('search') || null;
    const warehouse = Number(url.searchParams.get('warehouse')) || null;
    const types = Number(url.searchParams.get('types')) || 9;
    const order = url.searchParams.get('order') || null;
    const minstock = Number(url.searchParams.get('minstock')) || null;
    const maxstock = Number(url.searchParams.get('maxstock')) || null;

    console.log(`Fetching inventory... Mode: ${authHeader ? 'Authenticated' : 'Anonymous'}`);

    const { data: inventory, error: inventoryError } = await supabase.rpc('sp_get_inventory', {
      p_page: page,
      p_size: size,
      p_search: search,
      p_warehouse: warehouse,
      p_types: types,
      p_order: order,
      p_min_stock: minstock,
      p_max_stock: maxstock,
    });

    if (inventoryError) throw inventoryError;

    return new Response(JSON.stringify(inventory), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching inventory:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});