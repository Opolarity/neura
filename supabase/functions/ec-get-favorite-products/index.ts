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

    console.log('Fetching products list...');

    // Get the web price list
    const { data: priceList, error: priceListError } = await supabase
      .from('price_list')
      .select('id')
      .eq('web', true)
      .single();

    if (priceListError) throw priceListError;
    const webPriceListId = priceList.id;

    // Get all products visible on web
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('web', true)
      .eq('is_active', true)
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
          .limit(2);

        // Get term_groups for the product
        const { data: productAttributes } = await supabase
          .from('product_attributes')
          .select('attribute_id, term_groups(id, name)')
          .eq('product_id', product.id);

        // Group term_groups
        const termGroupsMap: { [id: number]: { groupName: string; terms: { id: number; name: string }[] } } = {};
        (productAttributes || []).forEach(pa => {
          const tg = (pa as any).term_groups;
          if (tg && !termGroupsMap[tg.id]) {
            termGroupsMap[tg.id] = {
              groupName: tg.name,
              terms: []
            };
          }
        });

        // Get all terms for these groups
        const termGroupIds = Object.keys(termGroupsMap).map(id => parseInt(id));
        if (termGroupIds.length > 0) {
          const { data: allTerms } = await supabase
            .from('terms')
            .select('id, name, term_group_id')
            .in('term_group_id', termGroupIds);

          (allTerms || []).forEach(term => {
            if (termGroupsMap[term.term_group_id]) {
              termGroupsMap[term.term_group_id].terms.push({
                id: term.id,
                name: term.name
              });
            }
          });
        }

        // Get variations first to get their IDs
        const { data: productVariations } = await supabase
          .from('variations')
          .select('id')
          .eq('product_id', product.id);

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

        return {
          id: product.id,
          title: product.title,
          short_description: product.short_description,
          is_variable: product.is_variable,
          categories,
          images: images || [],
          variations: variationsWithDetails,
          termGroups: Object.values(termGroupsMap)
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