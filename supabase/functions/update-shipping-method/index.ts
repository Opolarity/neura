import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShippingCost {
  id?: number;
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

    // Recreate client to run queries as the authenticated user (RLS)
    const token = authHeader.replace('Bearer ', '');
    const db = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    const { id, name, code, costs } = await req.json();

    if (!id) {
      throw new Error('Shipping method ID is required for update');
    }

    if (!name) {
      throw new Error('Name is required');
    }

    if (!costs || !Array.isArray(costs) || costs.length === 0) {
      throw new Error('At least one cost configuration is required');
    }

    if (costs.some((item: ShippingCost) => item.cost < 0)) {
      throw new Error('Shipping cost cannot be negative');
    }

    console.log('Updating shipping method:', id, 'for user:', user.id);

    // Update the shipping method
    const { data: method, error: methodError } = await db
      .from('shipping_methods')
      .update({ name, code })
      .eq('id', id)
      .select()
      .single();

    if (methodError) {
      console.error('Error updating shipping method:', methodError);
      throw methodError;
    }

    console.log('Updated shipping method with ID:', method.id);

    // Delete existing shipping costs for this method
    const { error: deleteError } = await db
      .from('shipping_costs')
      .delete()
      .eq('shipping_method_id', method.id);

    if (deleteError) {
      console.error('Error deleting old shipping costs:', deleteError);
      throw deleteError;
    }

    // Insert new shipping costs
    const costsToInsert = costs.map((cost: ShippingCost) => ({
      name: cost.name,
      cost: cost.cost,
      country_id: cost.country_id,
      state_id: cost.state_id,
      city_id: cost.city_id,
      neighborhood_id: cost.neighborhood_id,
      shipping_method_id: method.id,
    }));

    const { data: createdCosts, error: costsError } = await db
      .from('shipping_costs')
      .insert(costsToInsert)
      .select();

    if (costsError) {
      console.error('Error creating shipping costs:', costsError);
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
    console.error('Error in update-shipping-method:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});