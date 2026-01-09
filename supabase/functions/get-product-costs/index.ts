/*Importamos la creacion de cliente de supabase*/
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

/*Importamos los headers*/
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Access-Control-Allow-Methods": "POST, OPTIONS",

};

/*Creamos el servidor*/
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {


    const page = Number(req.url.searchParams.get('page') || 1);
    const size = Number(req.url.searchParams.get('size') || 20);
    const search = req.url.searchParams.get('search') || null;
    const mincost = req.url.searchParams.get('mincost') || null;
    const maxcost = req.url.searchParams.get('maxcost') || null;
    const order = req.url.searchParams.get('order') || null;
    const variation = req.url.searchParams.get('variation') || null;

    /*Pedimos los datos a la Base de Datos*/
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    /*Pedimos el token de autenticacion*/
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    /*Validamos el token */
    console.log('Authorization header:', authHeader);

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validar el token
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    //Obtenemos el ID del usuario
    const userId = claimsData.claims.sub;
    console.log('Authenticated user:', userId);



    //Mandamos los parametros a la funcion

    const { data: products, error: productserror } = await supabase.rpc('get_products_costs', {
      p_search: search,
      p_mincost: mincost,
      p_maxcost: maxcost,
      p_order: order,
      p_variation: variation,
    })


    return new Response(JSON.stringify({ products }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching product costs:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
