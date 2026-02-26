import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Manejo de CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {


    let categories_ids: number[] | null = null;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        categories_ids = body.ids || body.categories_ids || null;
      } catch (e) {
        console.error("Error parseando JSON:", e.message);
      }
    }

    if (!categories_ids || (Array.isArray(categories_ids) && categories_ids.length === 0)) {
      return new Response(
        JSON.stringify({ success: true, data: [] }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Llamada al Stored Procedure
    const { data, error } = await supabaseClient
      .rpc('sp_ec_get_categories_ids', {
        p_categories_ids: categories_ids
      })

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, ...data }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error procesando solicitud',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})