import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-channel-code',
}

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
  // 1. Manejo de CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const channel = req.headers.get('x-channel-code');


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
      product_ids = [], // Si viene vacío, el SP decidirá si filtrar o no
    } = body;
    const userId = getUserIdFromRequest(req);

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

    // 5. Llamada al Stored Procedure con los datos del POST
    const { data, error } = await supabaseClient
      .rpc('sp_ec_get_product_ids', {
        p_search: search,
        p_category_id: category_id,
        p_size: size,
        p_sale_price: sale_price,
        p_product_ids: product_ids,
        p_order: order,
        p_price_list_id: channelInfo.data?.price_list_id,
        p_branch_id: channelInfo.data?.branch_id,
        p_warehouse_id: channelInfo.data?.warehouse_id,
        p_channel_id: channelInfo.data?.id,
        p_stock_type_id: channelInfo.data?.stock_type_id,
        p_sale_type_id: channelInfo.data?.sale_type_id,
      })

    if (error) throw error;

    // Aplicar descuento de nivel si aplica
    const levelDiscount = await getLevelDiscount(supabaseClient, userId);
    if (levelDiscount > 0 && data?.data && Array.isArray(data.data)) {
      data.data = data.data.map((p: any) => ({
        ...p,
        price: p.price != null ? Number((p.price * (1 - levelDiscount)).toFixed(2)) : p.price,
      }));
    }

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