import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShippingCost {
  name: string;
  cost: number;
  country_id?: number;
  state_id?: number;
  city_id?: number;
  neighborhood_id?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get auth header for user verification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { name, code, costs } = await req.json();
    if (!name || !costs || !Array.isArray(costs) || costs.length === 0) {
      throw new Error('Name and at least one cost configuration are required');
    }

    console.log('Creating shipping method:', name, 'for user:', user.id);

    // Create the shipping method
    const { data: method, error: methodError } = await supabase
      .from('shipping_methods')
      .insert([{ name, code }])
      .select()
      .single();

    if (methodError) {
      console.error('Error creating shipping method:', methodError);
      throw methodError;
    }

    console.log('Created shipping method with ID:', method.id);

    // Create the shipping costs
    const costsToInsert = costs.map((cost: ShippingCost) => ({
      ...cost,
      shipping_method_id: method.id,
    }));

    const { data: createdCosts, error: costsError } = await supabase
      .from('shipping_costs')
      .insert(costsToInsert)
      .select();

    if (costsError) {
      console.error('Error creating shipping costs:', costsError);
      // Try to rollback the method creation
      await supabase.from('shipping_methods').delete().eq('id', method.id);
      throw costsError;
    }

    console.log(`Created ${createdCosts.length} shipping costs`);

    return new Response(
      JSON.stringify({ method, costs: createdCosts }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-shipping-method:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
