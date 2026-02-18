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
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page') || 1);
    const size = Number(url.searchParams.get('size') || 20);
    const search = url.searchParams.get('search') || null;
    const mincost = Number(url.searchParams.get('mincost')) || null;
    const maxcost = Number(url.searchParams.get('maxcost')) || null;
    const cost = url.searchParams.get('cost') || null;
    const order = url.searchParams.get('order') || null;
    const variation = Number(url.searchParams.get('variation')) || null;


    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching product costs data...');

    //Mandamos los parametros a la funcion
    const { data: productsdata, error: productserror } = await supabase.rpc('sp_get_products_costs', {
      p_search: search,
      p_min_cost: mincost,
      p_max_cost: maxcost,
      p_cost: cost,
      p_order: order,
      p_variation: variation,
      p_page: page,
      p_size: size,
    })

    //Validamos si hubo error
    if (productserror) throw productserror;

    //Retornamos la respuesta
    return new Response(JSON.stringify({ products: productsdata }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching product costs:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});