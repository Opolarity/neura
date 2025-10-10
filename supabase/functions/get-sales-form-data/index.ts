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

    console.log('Fetching sales form data...');

    // Fetch all required data in parallel
    const [
      documentTypesResult,
      saleTypesResult,
      shippingMethodsResult,
      countriesResult,
      statesResult,
      citiesResult,
      neighborhoodsResult,
      productsResult,
      paymentMethodsResult,
    ] = await Promise.all([
      supabase.from('document_types').select('*').order('name'),
      supabase.from('sale_types').select('*').order('name'),
      supabase.from('shipping_methods').select('*').order('name'),
      supabase.from('countries').select('*').order('name'),
      supabase.from('states').select('*').order('name'),
      supabase.from('cities').select('*').order('name'),
      supabase.from('neighborhoods').select('*').order('name'),
      supabase.from('products').select('id, title, is_variable').order('title'),
      supabase.from('payment_methods').select('*').eq('active', true).order('name'),
    ]);

    // Check for errors
    if (documentTypesResult.error) throw documentTypesResult.error;
    if (saleTypesResult.error) throw saleTypesResult.error;
    if (shippingMethodsResult.error) throw shippingMethodsResult.error;
    if (countriesResult.error) throw countriesResult.error;
    if (statesResult.error) throw statesResult.error;
    if (citiesResult.error) throw citiesResult.error;
    if (neighborhoodsResult.error) throw neighborhoodsResult.error;
    if (productsResult.error) throw productsResult.error;
    if (paymentMethodsResult.error) throw paymentMethodsResult.error;

    // For each product, get variations with prices and stock
    const productsWithVariations = await Promise.all(
      productsResult.data.map(async (product) => {
        const { data: variations, error: variationsError } = await supabase
          .from('variations')
          .select('id, sku')
          .eq('product_id', product.id);

        if (variationsError) {
          console.error('Error fetching variations:', variationsError);
          return { ...product, variations: [] };
        }

        // Get prices and stock for each variation
        const variationsWithDetails = await Promise.all(
          variations.map(async (variation) => {
            const [pricesResult, stockResult, termsResult] = await Promise.all([
              supabase
                .from('product_price')
                .select('*, price_list(name)')
                .eq('product_variation_id', variation.id),
              supabase
                .from('product_stock')
                .select('*, warehouses(name)')
                .eq('product_variation_id', variation.id),
              supabase
                .from('variation_terms')
                .select('*, terms(name, term_groups(name))')
                .eq('product_variation_id', variation.id),
            ]);

            return {
              ...variation,
              prices: pricesResult.data || [],
              stock: stockResult.data || [],
              terms: termsResult.data || [],
            };
          })
        );

        return {
          ...product,
          variations: variationsWithDetails,
        };
      })
    );

    console.log('Sales form data fetched successfully');

    return new Response(
      JSON.stringify({
        documentTypes: documentTypesResult.data,
        saleTypes: saleTypesResult.data,
        shippingMethods: shippingMethodsResult.data,
        countries: countriesResult.data,
        states: statesResult.data,
        cities: citiesResult.data,
        neighborhoods: neighborhoodsResult.data,
        products: productsWithVariations,
        paymentMethods: paymentMethodsResult.data,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching sales form data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
