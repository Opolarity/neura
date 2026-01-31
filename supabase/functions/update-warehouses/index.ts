import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
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

    const { warehouse } = await req.json();

    if (!warehouse || !warehouse.id) {
      throw new Error('Warehouse ID is required for update');
    }

    console.log('Updating warehouse:', warehouse.id);

    // Update warehouses table
    const { data, error } = await supabase
      .from('warehouses')
      .update({
        name: warehouse.name,
        country_id: warehouse.countries,
        state_id: warehouse.states,
        city_id: warehouse.cities,
        neighborhood_id: warehouse.neighborhoods,
        address: warehouse.address || '',
        address_reference: warehouse.address_reference || '',
        web: warehouse.web ?? false,
      })
      .eq('id', warehouse.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating warehouse:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Warehouse updated successfully',
        warehouse: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in update-warehouse:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
