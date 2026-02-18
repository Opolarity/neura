import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // 1. Manejo de CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Validar que sea un método POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Método no permitido. Usa POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Extraer datos del Body
    const body = await req.json().catch(() => ({}));
    
    // Mapeo de variables desde el JSON recibido
    const {
      search = null,
      category_id = null,
      size = null,
      sale_price = false,
      order = null,
      product_ids = [] // Si viene vacío, el SP decidirá si filtrar o no
    } = body;

    // 4. Inicializar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // 5. Llamada al Stored Procedure con los datos del POST
    const { data, error } = await supabaseClient
      .rpc('sp_ec_get_product_ids', {
         p_search: search,
         p_category_id: category_id,
         p_size: size,
         p_sale_price: sale_price,
         p_product_ids: product_ids,
         p_order: order,
      })

    if (error) throw error;

    // 6. Respuesta exitosa
    return new Response(
      JSON.stringify({ success: true, data }),
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