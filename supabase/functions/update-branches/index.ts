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

    const { branch } = await req.json();

    if (!branch || !branch.id) {
      throw new Error('Branch ID is required for update');
    }

    console.log('Updating branch:', branch.id);

    // Update branches table
    const { data, error } = await supabase
      .from('branches')
      .update({
        name: branch.name,
        warehouse_id: branch.warehouse,
        contry_id: branch.countries,
        state_id: branch.states,
        city_id: branch.cities,
        neighborhood_id: branch.neighborhoods,
        address: branch.address || '',
        address_reference: branch.address_reference || '',
      })
      .eq('id', branch.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating branch:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Branch updated successfully',
        branch: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in update-branches:', error);
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
