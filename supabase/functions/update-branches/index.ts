import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { branchesID, name, warehouseID, contryID, stateID, cityID, neighborhoodsID, addres, addresreferenc } = payload;

    if (!branchesID || !name || !warehouseID || !contryID || !stateID || !cityID || !neighborhoodsID) {
      return new Response(
        JSON.stringify({ error: 'name , warehouseID , countryID , stateID , cityID is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    console.log('Create branches:', name);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updatebranchesError } = await supabase
      .from('branches')
      .update({
        name: name,
        warehouse_id: warehouseID,
        contry_id: contryID,
        state_id: stateID,
        city_id: cityID,
        neighborhood_id: neighborhoodsID,
        address: addres,
        address_reference: addresreferenc,
        is_active: true
      })
      .eq('id', branchesID)
      .select()
      .single();

    if (updatebranchesError) {
      console.error('Error update branches:', updatebranchesError);
      throw updatebranchesError;
    }

    console.log('branches update successfully');

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in update-branches function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

