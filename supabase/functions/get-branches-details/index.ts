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

    const { branchID } = await req.json();

    if (!branchID) {
      throw new Error('branch ID is required');
    }



    // Fetch warehouse details
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('id, name, warehouse_id, country_id, state_id, city_id, neighborhood_id, address, address_reference')
      .eq('id', branchID)
      .single();

    if (branchError) throw branchError;
    if (!branch) throw new Error('Branch not found');

    const response = {
      branch: {
        id: branch.id,
        name: branch.name || "",
        warehouse: branch.warehouse_id,
        countries: branch.country_id || null,
        states: branch.state_id || null,
        cities: branch.city_id || null,
        neighborhoods: branch.neighborhood_id || null,
        address: branch.address || "",
        address_reference: branch.address_reference || "",
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
