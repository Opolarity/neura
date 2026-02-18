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

    // Get product ID from URL params
    const url = new URL(req.url);
    const productId = url.searchParams.get('id');

    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'Product ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching product with ID: ${productId}`);

    // Get the web price list
    const { data: priceList, error: priceListError } = await supabase
      .from('price_list')
      .select('id')
      .eq('web', true)
      .single();

    if (priceListError) throw priceListError;
    const webPriceListId = priceList.id;

    // Get the product (only if visible on web)
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('web', true)
      .single();

    if (productError) throw productError;
    if (!product) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get categories
    const { data: productCategories } = await supabase
      .from('product_categories')
      .select('category_id, categories(name)')
      .eq('product_id', product.id);

    const categories = productCategories?.map(pc => (pc as any).categories?.name).filter(Boolean) || [];

    // Get all images
    const { data: images } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', product.id)
      .order('image_order');

    // Get term_groups for the product
    const { data: termGroupsMap, error } = await supabase.rpc(
      'get_product_attribute_groups',
      { p_product_id: product.id }
    );


    // Get variations
    const { data: variations } = await supabase
      .from('variations')
      .select('id, sku')
      .eq('product_id', product.id);

    // For each variation, get prices and stock
    const variationsWithDetails = await Promise.all(
      (variations || []).map(async (variation) => {
        const [pricesResult, stockResult] = await Promise.all([
          supabase
            .from('product_price')
            .select('price, sale_price')
            .eq('product_variation_id', variation.id)
            .eq('price_list_id', webPriceListId),
          supabase
            .from('product_stock')
            .select('stock')
            .eq('product_variation_id', variation.id)
            .eq('warhouse_id', 1)
        ]);

        return {
          id: variation.id,
          sku: variation.sku,
          prices: pricesResult.data || [],
          stock: stockResult.data || []
        };
      })
    );

    const productWithDetails = {
      id: product.id,
      title: product.title,
      short_description: product.short_description,
      is_variable: product.is_variable,
      categories,
      images: images || [],
      variations: variationsWithDetails,
      termGroups: termGroupsMap
    };


    return new Response(
      JSON.stringify(productWithDetails),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching product:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});