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
    const { name, warehouseID, contryID, stateID, cityID, neighborhoodsID, addres, addresreferenc } = payload;

    if (!name || !warehouseID || !contryID || !stateID || !cityID || !neighborhoodsID) {
      return new Response(
        JSON.stringify({ error: 'name , warehouseID , countryID , stateID , cityID is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    console.log('Create branches:', name);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!; // El JWT del usuario

    // 2. Creas el cliente usando la Anon Key y pasando la identidad del usuario
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { error: createbranchesError } = await supabase
      .from('branches')
      .insert({
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
      .select()
      .single();

    if (createbranchesError) {
      console.error('Error create branches:', createbranchesError);
      throw createbranchesError;
    }

    console.log('branches created successfully');

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in create-branches function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

