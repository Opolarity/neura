import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
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

    console.log('Fetching shipping methods for user:', user.id);

    // Fetch all shipping methods with their costs
    const { data: methods, error: methodsError } = await supabase
      .from('shipping_methods')
      .select(`
        id,
        name,
        code,
        created_at,
        shipping_costs (
          id,
          name,
          cost,
          country_id,
          state_id,
          city_id,
          neighborhood_id,
          countries (id, name),
          states (id, name),
          cities (id, name),
          neighborhoods (id, name)
        )
      `)
      .order('created_at', { ascending: false });

    if (methodsError) {
      console.error('Error fetching shipping methods:', methodsError);
      throw methodsError;
    }

    console.log(`Successfully fetched ${methods?.length || 0} shipping methods`);

    return new Response(
      JSON.stringify({ methods }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in get-shipping-methods:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
