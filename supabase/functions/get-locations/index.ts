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
    // Crear cliente Supabase con Service Role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Leer parámetros del body (no query string)
    const { country_id, state_id, city_id } = await req.json().catch(() => ({}));

    console.log("📦 get-locations invocada con:", { country_id, state_id, city_id });

    let responseData: Record<string, any> = {};

    // Nivel 1: Países
    if (!country_id && !state_id && !city_id) {
      const { data, error } = await supabase
        .from('countries')
        .select('id, name')
        .order('name');

      if (error) throw error;
      responseData.countries = data;
    }

    // Nivel 2: Departamentos
    if (country_id && !state_id && !city_id) {
      const { data, error } = await supabase
        .from('states')
        .select('id, name, country_id')
        .eq('country_id', country_id)
        .order('name');

      if (error) throw error;
      responseData.states = data;
    }

    // Nivel 3: Provincias
    if (country_id && state_id && !city_id) {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name, state_id, country_id')
        .eq('country_id', country_id)
        .eq('state_id', state_id)
        .order('name');

      if (error) throw error;
      responseData.cities = data;
    }

    // Nivel 4: Distritos
    if (country_id && state_id && city_id) {
      const { data, error } = await supabase
        .from('neighborhoods')
        .select('id, name, city_id, state_id, country_id')
        .eq('country_id', country_id)
        .eq('state_id', state_id)
        .eq('city_id', city_id)
        .order('name');

      if (error) throw error;
      responseData.neighborhoods = data;
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('❌ Error en get-locations:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
