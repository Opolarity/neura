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

    const url = new URL(req.url);
    const countryId = url.searchParams.get('country_id');
    const stateId = url.searchParams.get('state_id');
    const cityId = url.searchParams.get('city_id');

    console.log('Fetching zones - country:', countryId, 'state:', stateId, 'city:', cityId);

    let result: any = {};

    // Always fetch countries
    const { data: countries, error: countriesError } = await supabase
      .from('countries')
      .select('id, name')
      .order('name');

    if (countriesError) {
      console.error('Error fetching countries:', countriesError);
      throw countriesError;
    }

    result.countries = countries;

    // If country is selected, fetch states
    if (countryId) {
      const { data: states, error: statesError } = await supabase
        .from('states')
        .select('id, name, country_id')
        .eq('country_id', countryId)
        .order('name');

      if (statesError) {
        console.error('Error fetching states:', statesError);
        throw statesError;
      }

      result.states = states;
    }

    // If state is selected, fetch cities
    if (stateId && countryId) {
      const { data: cities, error: citiesError } = await supabase
        .from('cities')
        .select('id, name, state_id, country_id')
        .eq('state_id', stateId)
        .eq('country_id', countryId)
        .order('name');

      if (citiesError) {
        console.error('Error fetching cities:', citiesError);
        throw citiesError;
      }

      result.cities = cities;
    }

    // If city is selected, fetch neighborhoods
    if (cityId && stateId && countryId) {
      const { data: neighborhoods, error: neighborhoodsError } = await supabase
        .from('neighborhoods')
        .select('id, name, city_id, state_id, country_id')
        .eq('city_id', cityId)
        .eq('state_id', stateId)
        .eq('country_id', countryId)
        .order('name');

      if (neighborhoodsError) {
        console.error('Error fetching neighborhoods:', neighborhoodsError);
        throw neighborhoodsError;
      }

      result.neighborhoods = neighborhoods;
    }

    console.log('Successfully fetched zones data');

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in get-shipping-zones:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
