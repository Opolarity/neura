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

    // Get request body
    const {webPriceListId, webWarehouseId, productId, selectedTerms } = await req.json();

    console.log('terms: ', selectedTerms);

    if (!webWarehouseId || !productId || !selectedTerms ) {
      return new Response(
        JSON.stringify({ error: 'carId, productVariationId and quantity are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: productName, error: errorProductName } = await supabase
      .from('products')
      .select('title')
      .eq('id', productId)
      .single();

      if (errorProductName) throw errorProductName;

    const { data: productVariation, error } = await supabase.rpc(
      'get_variation_by_terms',
      { p_product_id: productId, terms_id: Object.values(selectedTerms)}
    );

    const productVariationId = productVariation.id;

    // Get terms dats
    const { data: termsData, error: termsError } = await supabase
      .from('terms')
      .select('*')
      .in('id', selectedTerms)

    if (termsError) throw termsError;

    // Get product price for the variation
    const { data: priceData, error: priceError } = await supabase
      .from('product_price')
      .select('price, sale_price')
      .eq('product_variation_id', productVariationId)
      .eq('price_list_id', webPriceListId)
      .single();

    if (priceError) throw priceError;

    // Get variation images
    const { data: variationImage, error: variationImageError } = await supabase
      .from('product_variation_images')
      .select('product_images ( image_url )')
      .eq('product_variation_id', productVariationId)

    if (variationImageError) throw variationImageError;

    const productPrice = priceData.sale_price || priceData.price;

      // Get variation images
      const { data: productImage, error: productImageError } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId)

      if (productImageError) throw productImageError;
  
      // Get variation stock
      const { data: variationStock, error: variationStockError } = await supabase
        .from('product_stock')
        .select('stock')
        .eq('product_variation_id', productVariationId)
        .eq('warehouse_id', webWarehouseId)
        .single();

      if (variationStockError) throw variationStockError;

      console.log('productVariationId', productVariationId);
      console.log('productId', productId);
      console.log('productName', productName);
      console.log('productPrice', productPrice);
      console.log('variationStock', variationStock);
      console.log('terms', termsData);
      console.log('variationImage', variationImage);
      console.log('productImage', productImage);

    const variation = {
      id: productVariationId,
      productId: productId,
      name: productName,
      price: productPrice,
      stock: variationStock,
      terms: (termsData || []).map((t: any) => ({ id: t.id, name: t.name })),
      images: variationImage || productImage || [],
    };

    return new Response(
      JSON.stringify(variation),
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