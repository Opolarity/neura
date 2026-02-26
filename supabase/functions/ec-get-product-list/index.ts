import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-channel-code'
};

const LEVELS = [
  { min: 150,  max: 749.99,   discount: 0.05 },
  { min: 750,  max: 1499.99,  discount: 0.10 },
  { min: 1500, max: 2999.99,  discount: 0.15 },
  { min: 3000, max: Infinity, discount: 0.30 },
];

function getUserIdFromRequest(req: Request): string | null {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const payload = JSON.parse(atob(auth.slice(7).split('.')[1]));
    if (!payload.sub || payload.role === 'anon' || payload.role === 'service_role') return null;
    return payload.sub;
  } catch {
    return null;
  }
}

async function getLevelDiscount(supabaseClient: any, userId: string | null): Promise<number> {
  if (!userId) return 0;
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('accounts ( customer_profile ( points ) )')
    .eq('UID', userId)
    .maybeSingle();
  const accounts = profile?.accounts as any;
  const accountsObj = Array.isArray(accounts) ? accounts[0] : accounts;
  const customerProfile = accountsObj?.customer_profile;
  const cp = Array.isArray(customerProfile) ? customerProfile[0] : customerProfile;
  const points = cp?.points ?? 0;
  return LEVELS.find(l => points >= l.min && points <= l.max)?.discount ?? 0;
}
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  const channel = req.headers.get('x-channel-code');
  const url = new URL(req.url);
  const search = url.searchParams.get('search') || null;
  const category_id = Number(url.searchParams.get('category_id')) || null;
  const size = Number(url.searchParams.get('size')) || 20;
  const page = Number(url.searchParams.get('page')) || 1;
  const sale_price = url.searchParams.get('sale_price') || false;
  const order = url.searchParams.get('order') || null;
  const userId = getUserIdFromRequest(req);
  try {
    // Create Supabase client
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });

    // Validate channel code
    const channelInfo = await supabaseClient.from('channels').select('*').eq('code', channel).single();
    if (channelInfo.error || !channelInfo.data) {
      console.error('Channel validation error:', channelInfo.error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Código de canal inválido',
        details: channelInfo.error ? channelInfo.error.message : 'No channel found'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Call the stored procedure
    const { data, error } = await supabaseClient.rpc('sp_ec_get_product_list', {
      p_search: search,
      p_category_id: category_id,
      p_sale_price: sale_price,
      p_order: order,
      p_price_list_id: channelInfo.data?.price_list_id,
      p_branch_id: channelInfo.data?.branch_id,
      p_warehouse_id: channelInfo.data?.warehouse_id,
      p_stock_type_id: channelInfo.data?.stock_type_id,
      p_channel_id: channelInfo.data?.id,
      p_sale_type_id: channelInfo.data?.sale_type_id,
      p_size: size,
      p_page: page
    });
    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error al obtener los productos',
        details: error.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Aplicar descuento de nivel si aplica
    const levelDiscount = await getLevelDiscount(supabaseClient, userId);
    if (levelDiscount > 0 && data?.data && Array.isArray(data.data)) {
      data.data = data.data.map((p: any) => ({
        ...p,
        price: Number((p.price * (1 - levelDiscount)).toFixed(2)),
      }));
    }

    // Return the products
    return new Response(JSON.stringify({
      success: true,
      ...data
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error inesperado en el servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
