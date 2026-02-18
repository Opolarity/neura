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


    const url = new URL(req.url)
    const page = Number(url.searchParams.get('page')) || 1;
    const size = Number(url.searchParams.get('size')) || 20;
    const search = url.searchParams.get('search') || null;
    const mintotal = Number(url.searchParams.get('mintotal')) || null;
    const maxtotal = Number(url.searchParams.get('maxtotal')) || null;
    const minfecha = url.searchParams.get('minfecha') || null;
    const maxfecha = url.searchParams.get('maxfecha') || null;
    const status = Number(url.searchParams.get('status')) || null;
    const channel = Number(url.searchParams.get('channel')) || null;



    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching inventory data...');


    const { data: listorder, error: inventoryError } = await supabase.rpc('sp_get_list_orders', {
      p_page: page,
      p_size: size,
      p_search: search,
      p_mintotal: mintotal,
      p_maxtotal: maxtotal,
      p_minfecha: minfecha,
      p_maxfecha: maxfecha,
      p_status: status,
      p_channel: channel,
    })
    return new Response(JSON.stringify(listorder), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
