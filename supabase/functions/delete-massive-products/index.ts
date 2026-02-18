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

    const { productIds } = await req.json();

    // Validación: Debe ser array con MÍNIMO 2 elementos
    if (!productIds || !Array.isArray(productIds)) {
      throw new Error('Product IDs array is required');
    }

    if (productIds.length < 2) {
      throw new Error('Bulk delete requires at least 2 product IDs. Use delete-product for single deletions.');
    }

    // Validación adicional: máximo de productos
    if (productIds.length > 100) {
      throw new Error('Maximum 100 products can be deleted at once');
    }

    console.log(`Bulk soft deleting ${productIds.length} products: ${productIds.join(', ')}`);

    /* Obtener variaciones de los productos */
    const { data: variations } = await supabase
      .from('variations')
      .select('id')
      .in('product_id', productIds);

    const variationIds = variations?.map(v => v.id) || [];

    /* Desactivar variaciones */
    if (variationIds.length > 0) {
      const { error: variationsError } = await supabase
        .from('variations')
        .update({ is_active: false })
        .in('id', variationIds);

      if (variationsError) throw variationsError;
    }

    /* Desactivar los productos */
    const { error: productsError } = await supabase
      .from('products')
      .update({ is_active: false })
      .in('id', productIds);

    if (productsError) throw productsError;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Productos eliminados correctamente',
        affectedProducts: productIds.length,
        affectedVariations: variationIds.length,
        productIds: productIds
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Bulk soft delete error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
