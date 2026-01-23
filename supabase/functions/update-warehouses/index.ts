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
    const { warehousesID, name, countryID, stateID, cityID, neighborhoodsID, addres, addresreferenc, web } = payload;

    if (!warehousesID || !name || !countryID || !stateID || !cityID || !neighborhoodsID) {
      return new Response(
        JSON.stringify({ error: 'name , warehouseID , countryID , stateID , cityID is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    console.log('Update warehouses:', name);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: createwarehousesError } = await supabase
      .from('warehouses')
      .update({
        name: name,
        country_id: countryID,
        state_id: stateID,
        city_id: cityID,
        neighborhood_id: neighborhoodsID,
        address: addres,
        address_reference: addresreferenc,
        web: web,
        is_active: true
      })
      .eq('id', warehousesID)
      .select()
      .single();

    if (createwarehousesError) {
      console.error('Error update warehouses:', createwarehousesError);
      throw createwarehousesError;
    }

    console.log('warehouses update successfully');

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in update-warehouses function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

