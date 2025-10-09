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

    console.log('Fetching product form initial data...');

    // Fetch all initial data in parallel
    const [categoriesResult, termGroupsResult, termsResult, priceListsResult, warehousesResult] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('term_groups').select('*').order('name'),
      supabase.from('terms').select('*').order('name'),
      supabase.from('price_list').select('*').order('name'),
      supabase.from('warehouses').select('*').order('name')
    ]);

    if (categoriesResult.error) throw categoriesResult.error;
    if (termGroupsResult.error) throw termGroupsResult.error;
    if (termsResult.error) throw termsResult.error;
    if (priceListsResult.error) throw priceListsResult.error;
    if (warehousesResult.error) throw warehousesResult.error;

    console.log('Form data fetched successfully');

    return new Response(
      JSON.stringify({
        categories: categoriesResult.data,
        termGroups: termGroupsResult.data,
        terms: termsResult.data,
        priceLists: priceListsResult.data,
        warehouses: warehousesResult.data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching form data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
