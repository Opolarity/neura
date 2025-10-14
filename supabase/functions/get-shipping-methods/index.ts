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
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') || '',
          },
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

    // Enrich shipping_costs with location names using ID lookups to ensure names are present even without FK relationships
    const allCosts = (methods ?? []).flatMap((m: any) => m.shipping_costs ?? []);

    const countryIds = [...new Set(allCosts.map((c: any) => c.country_id).filter((v: any) => v != null))];
    const stateIds = [...new Set(allCosts.map((c: any) => c.state_id).filter((v: any) => v != null))];
    const cityIds = [...new Set(allCosts.map((c: any) => c.city_id).filter((v: any) => v != null))];
    const neighborhoodIds = [...new Set(allCosts.map((c: any) => c.neighborhood_id).filter((v: any) => v != null))];

    const [countriesRes, statesRes, citiesRes, neighborhoodsRes] = await Promise.all([
      countryIds.length ? supabase.from('countries').select('id, name').in('id', countryIds) : Promise.resolve({ data: [], error: null }),
      stateIds.length ? supabase.from('states').select('id, name').in('id', stateIds) : Promise.resolve({ data: [], error: null }),
      cityIds.length ? supabase.from('cities').select('id, name').in('id', cityIds) : Promise.resolve({ data: [], error: null }),
      neighborhoodIds.length ? supabase.from('neighborhoods').select('id, name').in('id', neighborhoodIds) : Promise.resolve({ data: [], error: null }),
    ]);

    if (countriesRes.error || statesRes.error || citiesRes.error || neighborhoodsRes.error) {
      console.error('Error looking up location names', {
        countries: countriesRes.error,
        states: statesRes.error,
        cities: citiesRes.error,
        neighborhoods: neighborhoodsRes.error,
      });
    }

    const countryMap = new Map((countriesRes.data || []).map((r: any) => [r.id, r.name]));
    const stateMap = new Map((statesRes.data || []).map((r: any) => [r.id, r.name]));
    const cityMap = new Map((citiesRes.data || []).map((r: any) => [r.id, r.name]));
    const neighborhoodMap = new Map((neighborhoodsRes.data || []).map((r: any) => [r.id, r.name]));

    const enrichedMethods = (methods ?? []).map((m: any) => ({
      ...m,
      shipping_costs: (m.shipping_costs ?? []).map((c: any) => ({
        ...c,
        countries: c.country_id != null ? { id: c.country_id, name: countryMap.get(c.country_id) || null } : null,
        states: c.state_id != null ? { id: c.state_id, name: stateMap.get(c.state_id) || null } : null,
        cities: c.city_id != null ? { id: c.city_id, name: cityMap.get(c.city_id) || null } : null,
        neighborhoods: c.neighborhood_id != null ? { id: c.neighborhood_id, name: neighborhoodMap.get(c.neighborhood_id) || null } : null,
      })),
    }));

    return new Response(
      JSON.stringify({ methods: enrichedMethods }),
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
