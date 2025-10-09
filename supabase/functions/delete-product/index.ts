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

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new Error('Product IDs array is required');
    }

    console.log(`Deleting ${productIds.length} product(s): ${productIds.join(', ')}`);

    // Check if any product has associated orders
    const { data: variations } = await supabase
      .from('variations')
      .select('id')
      .in('product_id', productIds);

    if (variations && variations.length > 0) {
      const variationIds = variations.map(v => v.id);
      
      const { data: orderProducts } = await supabase
        .from('order_products')
        .select('id')
        .in('product_variation_id', variationIds)
        .limit(1);

      if (orderProducts && orderProducts.length > 0) {
        throw new Error('Cannot delete products that have associated orders');
      }
    }

    // Get all variation IDs for these products
    const { data: allVariations } = await supabase
      .from('variations')
      .select('id')
      .in('product_id', productIds);

    const allVariationIds = allVariations?.map(v => v.id) || [];

    // Delete in correct order (respecting foreign keys)
    if (allVariationIds.length > 0) {
      // Delete variation-related data
      await Promise.all([
        supabase.from('product_variation_images').delete().in('product_variation_id', allVariationIds),
        supabase.from('variation_terms').delete().in('product_variation_id', allVariationIds),
        supabase.from('product_price').delete().in('product_variation_id', allVariationIds),
        supabase.from('product_stock').delete().in('product_variation_id', allVariationIds)
      ]);

      // Delete variations
      const { error: variationsError } = await supabase
        .from('variations')
        .delete()
        .in('id', allVariationIds);

      if (variationsError) throw variationsError;
    }

    // Delete product-related data
    await Promise.all([
      supabase.from('product_categories').delete().in('product_id', productIds),
      supabase.from('product_images').delete().in('product_id', productIds)
    ]);

    // Finally, delete the products
    const { error: productsError } = await supabase
      .from('products')
      .delete()
      .in('id', productIds);

    if (productsError) throw productsError;

    console.log('Products deleted successfully');

    return new Response(
      JSON.stringify({ success: true, deletedCount: productIds.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting products:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
