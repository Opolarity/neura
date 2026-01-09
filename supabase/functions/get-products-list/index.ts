/*Importamos la creacion de cliente de supabase*/
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

/*Importamos los headers*/
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/*Creamos el servidor*/
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {

    /*Pedimos los parametros de la URL*/
    const url = new URL(req.url)
    const minprice = Number(url.searchParams.get('minprice')) || null;
    const maxprice = Number(url.searchParams.get('maxprice')) || null;
    const category = url.searchParams.get('category') || null;
    const status = Boolean(url.searchParams.get('status')) || null;
    const web = Boolean(url.searchParams.get('web')) || null;
    const minstock = Number(url.searchParams.get('minstock')) || null;
    const maxstock = Number(url.searchParams.get('maxstock')) || null;
    const order = url.searchParams.get('order') || null;
    const p_page = Number(url.searchParams.get('page')) || 1;
    const p_size = Number(url.searchParams.get('size')) || 20;
    const search = url.searchParams.get('search') || null;

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
    const { data: productsdata, error: productserror } = await supabase.rpc('get_products_list', {
      p_min_price: minprice,
      p_max_price: maxprice,
      p_category: category,
      p_status: status,
      p_web: web,
      p_minstock: minstock,
      p_maxstock: maxstock,
      p_order: order,
      p_search: search,
    })

    //Validamos si hubo error
    if (productserror) throw productserror;

    //Retornamos la respuesta
    return new Response(
      JSON.stringify({ products: productsdata }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching products list:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
