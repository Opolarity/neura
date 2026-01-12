import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching categories product count...');

    const url = new URL(req.url)
    const page = Number(url.searchParams.get('page')) || 1;
    const size = Number(url.searchParams.get('size')) || 20;
    const search = url.searchParams.get('search') || null;
    const description = url.searchParams.get('description') === 'true' ? true : (url.searchParams.get('description') === 'false' ? false : null);
    const image = url.searchParams.get('image') === 'true' ? true : (url.searchParams.get('image') === 'false' ? false : null);
    const parentcategory = url.searchParams.get('parentcategory') === 'true' ? true : (url.searchParams.get('parentcategory') === 'false' ? false : null);
    const minproducts = Number(url.searchParams.get('minproducts')) || 0;
    const maxproducts = Number(url.searchParams.get('maxproducts')) || 0;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: categoryProductCounts, error: categoryProductCountsError } = await supabase.rpc('sp_get_categories_product_count', {
      p_page: page,
      p_size: size,
      p_search: search,
      p_description: description,
      p_image: image,
      p_parentcategory: parentcategory,
      p_min_products: minproducts,
      p_max_products: maxproducts,
    })

    if (categoryProductCountsError) {
      throw categoryProductCountsError;
    }

    return new Response(
      JSON.stringify(categoryProductCounts),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in get-categories-product-count function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
