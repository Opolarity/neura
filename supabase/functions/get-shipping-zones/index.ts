import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  console.log("🚀 get-shipping-zones fue llamada");

  if (req.method === 'OPTIONS') {
    console.log("⚙️ Preflight OPTIONS recibido");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ✅ Usa la SERVICE_ROLE_KEY (no la ANON) para evitar problemas con RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const url = new URL(req.url);
    const countryId = url.searchParams.get('country_id');
    const stateId = url.searchParams.get('state_id');
    const cityId = url.searchParams.get('city_id');

    console.log("📍 Parámetros:", { countryId, stateId, cityId });

    const result: any = {};

    // 🔹 Siempre trae países
    const { data: countries, error: countriesError } = await supabase
      .from('countries')
      .select('id, name')
      .order('name');

    console.log("📦 Countries query result:", countries, "Error:", countriesError);

    if (countriesError) throw countriesError;
    result.countries = countries;

    // 🔹 Si hay countryId, trae departamentos
    if (countryId) {
      const { data: states, error: statesError } = await supabase
        .from('states')
        .select('id, name, country_id')
        .eq('country_id', countryId)
        .order('name');

      if (statesError) throw statesError;
      result.states = states;
    }

    // 🔹 Si hay stateId, trae provincias
    if (stateId && countryId) {
      const { data: cities, error: citiesError } = await supabase
        .from('cities')
        .select('id, name, state_id, country_id')
        .eq('state_id', stateId)
        .eq('country_id', countryId)
        .order('name');

      if (citiesError) throw citiesError;
      result.cities = cities;
    }

    // 🔹 Si hay cityId, trae distritos
    if (cityId && stateId && countryId) {
      const { data: neighborhoods, error: neighborhoodsError } = await supabase
        .from('neighborhoods')
        .select('id, name, city_id, state_id, country_id')
        .eq('city_id', cityId)
        .eq('state_id', stateId)
        .eq('country_id', countryId)
        .order('name');

      if (neighborhoodsError) throw neighborhoodsError;
      result.neighborhoods = neighborhoods;
    }

    console.log("✅ Successfully fetched zones data");

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error("💥 Error en get-shipping-zones:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
