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

    console.log('Fetching warehouse details for ID:', warehouseID);

    // Fetch product basic data
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id, name, warehouses_id, country_id, state_id, city_id, neighborhood_id', 'address', 'address_reference')
      .eq('id', warehouseID)
      .single();

    if (branchesError) throw branchesError;
    if (!branches) throw new Error('Warehouse not found');


    const response = {
      warehouse: {
        id: branches.id,
        name: branches.name,
        branch_id: branches.branch_id,
        country_id: branches.country_id,
        state_id: branches.state_id,
        city_id: branches.city_id,
        neighborhood_id: branches.neighborhood_id,
        address: branches.address,
        address_reference: branches.address_reference,
        is_active: true,
      },

    };

    console.log('Branch details fetched successfully');

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in get-product-details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
