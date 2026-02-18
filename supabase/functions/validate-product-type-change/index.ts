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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { productId, newIsVariable } = await req.json();

    if (!productId) {
      throw new Error('Product ID is required');
    }

    console.log(`Validating type change for product ${productId} to isVariable: ${newIsVariable}`);

    // Get current product state
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('is_variable')
      .eq('id', productId)
      .single();

    if (productError) throw productError;

    // If changing from variable to simple, check for orders
    if (product.is_variable && !newIsVariable) {
      // Get variations for this product
      const { data: variations, error: variationsError } = await supabase
        .from('variations')
        .select('id')
        .eq('product_id', productId);

      if (variationsError) throw variationsError;

      if (variations && variations.length > 0) {
        const variationIds = variations.map(v => v.id);

        // Check if any variation has orders
        const { data: orderProducts, error: orderError } = await supabase
          .from('order_products')
          .select('id')
          .in('product_variation_id', variationIds)
          .limit(1);

        if (orderError) throw orderError;

        if (orderProducts && orderProducts.length > 0) {
          return new Response(
            JSON.stringify({ 
              canChange: false, 
              reason: 'Cannot change product type because it has associated orders' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    console.log('Product type can be changed');

    return new Response(
      JSON.stringify({ canChange: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error validating product type change:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
