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

    const { productId } = await req.json();

    if (!productId || typeof productId !== 'number' || isNaN(productId)) {
      throw new Error('Product ID must be a valid number');
    }

    console.log(`Soft deleting product: ${productId}`);

    /* Obtener variaciones del producto */
    const { data: variations } = await supabase
      .from('variations')
      .select('id')
      .eq('product_id', productId);

    const variationIds = variations?.map(v => v.id) || [];

    /* Desactivar variaciones */
    if (variationIds.length > 0) {
      const { error: variationsError } = await supabase
        .from('variations')
        .update({ is_active: false })
        .in('id', variationIds);

      if (variationsError) throw variationsError;
    }

    /* Desactivar el producto */
    const { error: productsError } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', productId);

    if (productsError) throw productsError;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Producto eliminado correctamente',
        affectedVariations: variationIds.length,
        productId: productId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Soft delete error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});