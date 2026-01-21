import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    // Fetch all data in parallel
    const [
      categoriesResult,
      termGroupsResult,
      termsResult,
      priceListsResult,
      warehousesResult,
      stockModuleResult
    ] = await Promise.all([
      supabase.from('categories').select('id, name, parent_category').order('name'),
      supabase.from('term_groups').select('id, name').order('name'),
      supabase.from('terms').select('id, name, term_group_id').order('name'),
      supabase.from('price_list').select('id, name, code').order('id'),
      supabase.from('warehouses').select('id, name').order('id'),
      // Get the inventory module ID by code 'STK'
      supabase.from('modules').select('id').eq('code', 'STK').single()
    ]);

    if (categoriesResult.error) throw categoriesResult.error;
    if (termGroupsResult.error) throw termGroupsResult.error;
    if (termsResult.error) throw termsResult.error;
    if (priceListsResult.error) throw priceListsResult.error;
    if (warehousesResult.error) throw warehousesResult.error;

    // Fetch stock types using the module ID
    let stockTypes: { id: number; code: string; name: string }[] = [];
    if (stockModuleResult.data) {
      const { data: stockTypesData, error: stockTypesError } = await supabase
        .from('types')
        .select('id, code, name')
        .eq('module_id', stockModuleResult.data.id)
        .order('id');
      
      if (stockTypesError) {
        console.error('Error fetching stock types:', stockTypesError);
      } else {
        stockTypes = stockTypesData || [];
      }
    }

    console.log('Form data fetched successfully');
    console.log('Stock types found:', stockTypes.length);

    return new Response(JSON.stringify({
      categories: categoriesResult.data || [],
      termGroups: termGroupsResult.data || [],
      terms: termsResult.data || [],
      priceLists: priceListsResult.data || [],
      warehouses: warehousesResult.data || [],
      stockTypes: stockTypes
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in get-product-form-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
