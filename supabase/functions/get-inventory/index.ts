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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching inventory data...');

    // Get all variations with product info
    const { data: variations, error: variationsError } = await supabase
      .from('variations')
      .select(`
        id,
        sku,
        product_id,
        products (
          id,
          title
        )
      `);

    if (variationsError) throw variationsError;

    // Get all warehouses
    const { data: warehouses, error: warehousesError } = await supabase
      .from('warehouses')
      .select('id, name');

    if (warehousesError) throw warehousesError;

    // Get all stock data
    const { data: stock, error: stockError } = await supabase
      .from('product_stock')
      .select('product_variation_id, warehouse_id, stock');

    if (stockError) throw stockError;

    // Get variation terms to build variation name
    const { data: variationTerms, error: termsError } = await supabase
      .from('variation_terms')
      .select(`
        product_variation_id,
        term_id,
        terms (
          name,
          term_group_id,
          term_groups (
            name
          )
        )
      `);

    if (termsError) throw termsError;

    // Build inventory data structure
    const inventory = variations.map((variation: any) => {
      // Build variation name from terms
      const terms = variationTerms
        .filter((vt: any) => vt.product_variation_id === variation.id)
        .map((vt: any) => vt.terms.name)
        .join(' - ');

      const variationName = terms || 'Sin variación';

      // Get stock for each warehouse
      const stockByWarehouse = warehouses.map((warehouse: any) => {
        const stockData = stock.find(
          (s: any) => s.product_variation_id === variation.id && s.warehouse_id === warehouse.id
        );

        return {
          warehouse_id: warehouse.id,
          warehouse_name: warehouse.name,
          stock: stockData?.stock || 0,
        };
      });

      return {
        variation_id: variation.id,
        sku: variation.sku || 'N/A',
        product_name: variation.products?.title || 'Sin nombre',
        variation_name: variationName,
        stock_by_warehouse: stockByWarehouse,
      };
    });

    console.log(`Inventory data fetched: ${inventory.length} variations`);

    return new Response(JSON.stringify({ inventory, warehouses }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
