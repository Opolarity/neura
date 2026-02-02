import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Parseamos el body (asegúrate de que el servicio envíe POST)
    const { branchID } = await req.json();

    if (!branchID) throw new Error('branchID is required');

    const { data: branch, error } = await supabase
      .from('branches')
      .select('id, name, warehouse_id, contry_id, state_id, city_id, neighborhood_id, address, address_reference')
      .eq('id', branchID)
      .single();

    if (error) throw error;

    const response = {
      branch: {
        id: branch.id,
        name: branch.name || "",
        warehouse: branch.warehouse_id || null,
        countries: branch.contry_id || null,
        states: branch.state_id || null,
        cities: branch.city_id || null,
        neighborhoods: branch.neighborhood_id || null,
        address: branch.address || "",
        address_reference: branch.address_reference || ""
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});