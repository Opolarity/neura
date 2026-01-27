import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
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

    const url = new URL(req.url);
    const countryId = url.searchParams.get('country_id');
    const stateId = url.searchParams.get('state_id');
    const cityId = url.searchParams.get('city_id');

    // If specific location params are provided, return only that cascade
    if (countryId && stateId && cityId) {
      const { data, error } = await supabase
        .from("neighborhoods")
        .select("id, name")
        .eq("country_id", countryId)
        .eq("state_id", stateId)
        .eq("city_id", cityId)
        .order("name");
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (countryId && stateId) {
      const { data, error } = await supabase
        .from("cities")
        .select("id, name")
        .eq("country_id", countryId)
        .eq("state_id", stateId)
        .order("name");
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (countryId) {
      const { data, error } = await supabase
        .from("states")
        .select("id, name")
        .eq("country_id", countryId)
        .order("name");
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Default: Fetch all initial load data
    const [
      rolesRes,
      warehousesRes,
      branchesRes,
      docTypesRes,
      accTypesRes,
      countriesRes
    ] = await Promise.all([
      supabase.from("roles").select("id, name").order("name"),
      supabase.from("warehouses").select("id, name").order("name").neq("id", 0).eq("is_active", true),
      supabase.from("branches").select("id, name, warehouse_id").order("name").neq("id", 0).eq("is_active", true),
      supabase.from("document_types").select("id, name").order("name").neq("id", 0),
      supabase.from("types").select("id, name, modules!inner(id, code)").eq("modules.code", "USE").order("name"),
      supabase.from("countries").select("id, name").order("name")
    ]);

    if (rolesRes.error) throw rolesRes.error;
    if (warehousesRes.error) throw warehousesRes.error;
    if (branchesRes.error) throw branchesRes.error;
    if (docTypesRes.error) throw docTypesRes.error;
    if (accTypesRes.error) throw accTypesRes.error;
    if (countriesRes.error) throw countriesRes.error;

    return new Response(JSON.stringify({
      roles: rolesRes.data,
      warehouses: warehousesRes.data,
      branches: branchesRes.data,
      documentTypes: docTypesRes.data,
      accountTypes: accTypesRes.data,
      countries: countriesRes.data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in get-users-form-data:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});