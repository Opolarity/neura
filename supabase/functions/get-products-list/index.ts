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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    console.log('Authorization header:', authHeader);

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validar el token
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const userId = claimsData.claims.sub;
    console.log('Authenticated user:', userId);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('warehouse_id')
      .eq('UID', userId)

    console.log('Profile:', profile);


    console.log('Fetching products list...');



    // Get all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (productsError) throw productsError;

    // For each product, get categories, images, and variations with prices/stock
    const productsWithDetails = await Promise.all(
      (products || []).map(async (product) => {
        // Get categories
        const { data: productCategories } = await supabase
          .from('product_categories')
          .select('category_id, categories(name)')
          .eq('product_id', product.id);

        const categories = productCategories?.map(pc => (pc as any).categories?.name).filter(Boolean) || [];

        // Get first image
        const { data: images } = await supabase
          .from('product_images')
          .select('image_url')
          .eq('product_id', product.id)
          .order('image_order')
          .limit(1);

        // Get variations
        const { data: variations } = await supabase
          .from('variations')
          .select('id, sku')
          .eq('product_id', product.id);

        // For each variation, get prices and stock
        const variationsWithDetails = await Promise.all(
          (variations || []).map(async (variation) => {
            const [pricesResult, stockResult, termResult] = await Promise.all([
              supabase
                .from('product_price')
                .select('price, sale_price')
                .eq('product_variation_id', variation.id),
              supabase
                .from('product_stock')
                .select('stock')
                .eq('product_variation_id', variation.id)
                .eq('warehouse_id', profile.warhouse_id),

              supabase
                .from('variation_terms')
                .select('term_id , terms(name)')
                .eq('product_variation_id', variation.id)


            ]);

            return {
              id: variation.id,
              sku: variation.sku,
              prices: pricesResult.data || [],
              stock: stockResult.data || [],
              terms: termResult.data || [],

            };
          })
        );

        return {
          id: product.id,
          title: product.title,
          short_description: product.short_description,
          is_variable: product.is_variable,
          categories,
          images: images || [],
          variations: variationsWithDetails
        };
      })
    );

    console.log(`Fetched ${productsWithDetails.length} products`);

    return new Response(
      JSON.stringify({ products: productsWithDetails }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching products list:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
