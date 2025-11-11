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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching product costs data...');

    // Get all variations with product info and cost
    const { data: variations, error: variationsError } = await supabase
      .from('variations')
      .select(`
        id,
        sku,
        product_cost,
        product_id,
        products (
          id,
          title
        )
      `);

    if (variationsError) throw variationsError;

    // Get variation terms to build variation name
    const { data: variationTerms, error: termsError } = await supabase
      .from('variation_terms')
      .select(`
        product_variation_id,
        term_id,
        terms (
          name,
          term_group_id,
          term_groups (
            name
          )
        )
      `);

    if (termsError) throw termsError;

    // Build product costs data structure
    const products = variations.map((variation: any) => {
      // Build variation name from terms
      const terms = variationTerms
        .filter((vt: any) => vt.product_variation_id === variation.id)
        .map((vt: any) => vt.terms.name)
        .join(' - ');

      const variationName = terms || 'Sin variación';

      return {
        variation_id: variation.id,
        sku: variation.sku || 'N/A',
        product_name: variation.products?.title || 'Sin nombre',
        variation_name: variationName,
        product_cost: variation.product_cost,
      };
    });

    console.log(`Product costs data fetched: ${products.length} variations`);

    return new Response(JSON.stringify({ products }), {
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
