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

    const { warehouseID } = await req.json();

    if (!warehouseID) {
      throw new Error('warehouse ID is required');
    }



    // Fetch warehouse details
    const { data: warehouse, error: warehouseError } = await supabase
      .from('warehouses')
      .select('id, name, country_id, state_id, city_id, neighborhood_id, address, address_reference , web')
      .eq('id', warehouseID)
      .single();

    if (warehouseError) throw warehouseError;
    if (!warehouse) throw new Error('Warehouse not found');

    const response = {
      warehouse: {
        id: warehouse.id,
        name: warehouse.name || "",
        countries: warehouse.country_id || null,
        states: warehouse.state_id || null,
        cities: warehouse.city_id || null,
        neighborhoods: warehouse.neighborhood_id || null,
        address: warehouse.address || "",
        address_reference: warehouse.address_reference || "",
        web: warehouse.web || null,
      }
    };



    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in get-warehouses-details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
