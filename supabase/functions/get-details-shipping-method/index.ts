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
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! }
        }
      }
    );

    const { shippingmethodID } = await req.json();

    if (!shippingmethodID) throw new Error('shippingmethodID is required');

    const { data: shipping_method, error } = await supabase
      .from('shipping_methods')
      .select(`
        id, 
        name, 
        code,
        shipping_costs (
          id, 
          name, 
          country_id, 
          state_id, 
          city_id, 
          neighborhood_id, 
          cost
        )
      `)
      .eq('id', shippingmethodID)
      .single();

    if (error) throw error;
    if (!shipping_method) throw new Error('Shipping method not found');

    const response = {
      shipping_method: {
        id: shipping_method.id,
        name: shipping_method.name || "",
        code: shipping_method.code || null,
        shipping_costs: (shipping_method.shipping_costs || []).map((cost: any) => ({
          id: cost.id,
          name: cost.name || "",
          country_id: cost.country_id || null,
          state_id: cost.state_id || null,
          city_id: cost.city_id || null,
          neighborhood_id: cost.neighborhood_id || null,
          cost: cost.cost || 0
        }))
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