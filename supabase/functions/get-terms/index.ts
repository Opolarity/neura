import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    console.log('Fetching categories product count...');
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const size = Number(url.searchParams.get('size')) || 20;
    const search = url.searchParams.get('search') || null;
    const min_pr = Number(url.searchParams.get('min_pr')) || null;
    const max_pr = Number(url.searchParams.get('max_pr')) || null;
    const group = Number(url.searchParams.get('group')) || null;
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: terms, error: terms_error } = await supabase.rpc('sp_get_terms', {
      p_page: page,
      p_size: size,
      p_search: search,
      p_min_pr: min_pr,
      p_max_pr: max_pr,
      p_group: group
    });
    if (terms_error) {
      throw terms_error;
    }
    return new Response(JSON.stringify(terms), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error in get-categories-product-count function:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
