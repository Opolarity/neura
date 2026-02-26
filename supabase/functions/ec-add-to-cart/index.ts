import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-channel-code',
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const channel = req.headers.get('x-channel-code');


  try {
    //Create Supabase client
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

    const { quantity, cartId, variationId, userId: bodyUserId } = await req.json();
    const userId = bodyUserId || getUserIdFromRequest(req);

    if (!variationId || !quantity) {
      return new Response(
        JSON.stringify({ error: 'productId, variationId and quantity are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Llamar al SP — inserta con precio normal en DB
    const { data, error } = await supabaseClient.rpc('sp_add_to_cart', {
      p_variation_id: variationId,
      p_quantity: quantity,
      p_cart_id: cartId || null,
      p_user_id: userId || null,
      p_price_list_id: channelInfo.data?.price_list_id,
      p_branch_id: channelInfo.data?.branch_id,
      p_warehouse_id: channelInfo.data?.warehouse_id,
      p_stock_type_id: channelInfo.data?.stock_type_id,
      p_sale_type_id: channelInfo.data?.sale_type_id,
    });

    if (error) throw error;

    const itemsForRules = (data.cartItems ?? []).map((item: any) => ({
      variationId: item.product_variation_id,
      productId: item.product.id,          // ← antes: item.variation.product_id (no existe)
      quantity: item.quantity,
      price: item.product_price,
      originalPrice: item.product_price,
    }));


    // 2b. Calcular descuento de nivel si hay usuario
    let levelDiscount = 0;
    if (userId) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('accounts ( customer_profile ( points ) )')
        .eq('UID', userId)
        .maybeSingle();
      const accounts = profile?.accounts as any;
      const accountsObj = Array.isArray(accounts) ? accounts[0] : accounts;
      const customerProfile = accountsObj?.customer_profile;
      const customerProfileObj = Array.isArray(customerProfile) ? customerProfile[0] : customerProfile;
      const points = customerProfileObj?.points ?? 0;
      levelDiscount = LEVELS.find(l => points >= l.min && points <= l.max)?.discount ?? 0;
    }

    // 3. Llamar a apply-price-rules para obtener precios ajustados visualmente
    const { data: rulesResult, error: rulesError } = await supabaseClient.functions.invoke('apply-price-rules', {
      body: { items: itemsForRules, levelDiscount },
    });

    if (rulesError) throw rulesError;

    // 4. Mergear precio ajustado Y precio original de vuelta al cartItems
    const priceMap = new Map(
      (rulesResult.items ?? []).map((item: any) => [item.variationId, item.price])
    );
    const originalPriceMap = new Map(
      (rulesResult.items ?? []).map((item: any) => [item.variationId, item.originalPrice])
    );


    const adjustedCartItems = (data.cartItems ?? []).map((item: any) => ({
      ...item,
      product_price: priceMap.get(item.product_variation_id) ?? item.product_price,
      product_original_price: originalPriceMap.get(item.product_variation_id) ?? item.product_price,
    }));

    // ✨ CAMBIO AQUÍ: Agregamos los regalos al array principal de cartItems para que el frontend los renderice
    const finalCartItems = [...adjustedCartItems, ...(rulesResult.gifts ?? [])];

    return new Response(
      JSON.stringify({ ...data, cartItems: finalCartItems }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );



  } catch (error) {
    console.error('Error adding to cart:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});