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

    const { productId } = await req.json();

    if (!productId) {
      throw new Error('Product ID is required');
    }

    console.log(`Fetching product details for ID: ${productId}`);

    // Get product basic info
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError) throw productError;
    if (!productData) throw new Error('Product not found');

    // Get categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('product_categories')
      .select('category_id')
      .eq('product_id', productId);

    if (categoriesError) throw categoriesError;

    // Get images
    const { data: imagesData, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('image_order');

    if (imagesError) throw imagesError;

    // Get variations
    const { data: variationsData, error: variationsError } = await supabase
      .from('variations')
      .select('*')
      .eq('product_id', productId);

    if (variationsError) throw variationsError;

    // For each variation, get terms, prices, stock, and images
    const variationsWithDetails = await Promise.all(
      (variationsData || []).map(async (variation) => {
        const [termsResult, pricesResult, stockResult, variationImagesResult] = await Promise.all([
          supabase
            .from('variation_terms')
            .select('term_id')
            .eq('product_variation_id', variation.id),
          supabase
            .from('product_price')
            .select('*')
            .eq('product_variation_id', variation.id),
          supabase
            .from('product_stock')
            .select('*')
            .eq('product_variation_id', variation.id),
          supabase
            .from('product_variation_images')
            .select('product_image_id')
            .eq('product_variation_id', variation.id)
        ]);

        return {
          ...variation,
          terms: termsResult.data?.map(t => t.term_id) || [],
          prices: pricesResult.data || [],
          stock: stockResult.data || [],
          images: variationImagesResult.data?.map(vi => vi.product_image_id) || []
        };
      })
    );

    console.log('Product details fetched successfully');

    return new Response(
      JSON.stringify({
        product: productData,
        categories: categoriesData?.map(c => c.category_id) || [],
        images: imagesData || [],
        variations: variationsWithDetails
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching product details:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
