import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const description = url.searchParams.get('description') || null;
    const image = url.searchParams.get('image') || null;
    const parentcategory = url.searchParams.get('parentcategory') || null;
    const minproducts = Number(url.searchParams.get('minproducts')) || null;
    const maxproducts = Number(url.searchParams.get('maxproducts')) || null;
    const order = url.searchParams.get('order') || null;

    console.log(`Fetching categories... Mode: ${authHeader ? 'Authenticated' : 'Anonymous'}`);

    const { data: categoryProductCounts, error: rpcError } = await supabase.rpc('sp_get_categories_product_count', {
      p_page: page,
      p_size: size,
      p_search: search,
      p_description: description,
      p_image: image,
      p_parentcategory: parentcategory,
      p_min_products: minproducts,
      p_max_products: maxproducts,
      p_order: order,
    });

    if (rpcError) throw rpcError;

    return new Response(
      JSON.stringify(categoryProductCounts),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in function:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});