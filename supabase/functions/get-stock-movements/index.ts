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
        const origin = Number(url.searchParams.get('origin')) || null;
        const user = Number(url.searchParams.get('user')) || null;
        const warehouse = Number(url.searchParams.get('warehouse')) || null;
        const in_out = url.searchParams.get('in_out') || null;
        const start_date = url.searchParams.get('start_date') || null;
        const end_date = url.searchParams.get('end_date') || null;
        const page = Number(url.searchParams.get('page')) || 1;
        const size = Number(url.searchParams.get('size')) || 20;
        const search = url.searchParams.get('search') || null;
        const order = url.searchParams.get('order') || null;


        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        console.log('Fetching inventory data...');


        const { data: movementsstock, error: productserror } = await supabase.rpc('sp_get_stock_movements', {
            p_origin: origin,
            p_user: user,
            p_warehouse: warehouse,
            p_in_out: in_out,
            p_start_date: start_date,
            p_end_date: end_date,
            p_page: page,
            p_size: size,
            p_search: search,
            p_order: order,
        })
        //Retornamos la respuesta
        return new Response(
            JSON.stringify({ movementsstock }),
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