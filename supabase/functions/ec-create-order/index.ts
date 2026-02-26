import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-channel-code',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const channel = req.headers.get('x-channel-code');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') }
        }
      }
    );

    // Validate channel code
    const channelInfo = await supabase.from('channels').select('*').eq('code', channel).single();
    if (channelInfo.error || !channelInfo.data) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Código de canal inválido',
        details: channelInfo.error ? channelInfo.error.message : 'No channel found'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { cartId, customerInfo, shippingInfo } = await req.json();

    if (!cartId || !customerInfo || !customerInfo.documentNumber) {
      return new Response(
        JSON.stringify({ error: 'cartId and customerInfo (documentNumber) are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener situation inicial
    const { data: initialSituationData } = await supabase
      .from('situations')
      .select('id, status_id, statuses!inner(code), modules!inner(code)')
      .eq('code', 'VIR')
      .eq('statuses.code', 'PEN')
      .eq('modules.code', 'ORD')
      .single();

    const initialSituationId = initialSituationData?.id;
    const sellerId = 0;

    if (!initialSituationId) throw new Error('Initial situation (VIR/PEN/ORD) not found');

    console.log('Using channel IDs:', {
      price_list_id: channelInfo.data.price_list_id,
      branch_id: channelInfo.data.branch_id,
      warehouse_id: channelInfo.data.warehouse_id,
      stock_type_id: channelInfo.data.stock_type_id,
      sale_type_id: channelInfo.data.sale_type_id,
      initialSituationId,
    });

    // Obtener productos del carrito
    const { data: cartProducts, error: cartError } = await supabase
      .from('cart_products')
      .select('id, product_variation_id, quantity, product_price')
      .eq('cart_id', cartId)
      .eq('bought', false);

    if (cartError || !cartProducts?.length) {
      return new Response(
        JSON.stringify({ error: 'Cart is empty or not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar productos con precios actualizados de la lista del canal
    const products = await Promise.all(
      cartProducts.map(async (item) => {
        const { data: priceData } = await supabase
          .from('product_price')
          .select('price, sale_price')
          .eq('product_variation_id', item.product_variation_id)
          .eq('price_list_id', channelInfo.data.price_list_id)
          .single();

        const finalPrice = priceData?.sale_price || priceData?.price || item.product_price;

        return {
          variation_id: item.product_variation_id,
          quantity: item.quantity,
          price: finalPrice,
          discount_amount: 0,
          stock_type_id: channelInfo.data.stock_type_id,
        };
      })
    );

    const subtotal = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const total = subtotal;

    const orderData = {
      document_type: customerInfo.documentTypeId,
      document_type_id: customerInfo.documentTypeId,
      document_number: customerInfo.documentNumber,
      customer_name: customerInfo.firstName,
      customer_lastname: `${customerInfo.paternalLastName || ''} ${customerInfo.maternalLastName || ''}`.trim(),
      email: customerInfo.email || '',
      phone: customerInfo.phone || '',
      sale_type: channelInfo.data.sale_type_id,   // ← del canal
      shipping_method: shippingInfo?.shippingMethodId ?? null,
      shipping_cost: shippingInfo?.shippingCost ?? 0,
      address: shippingInfo?.address || '',
      address_reference: shippingInfo?.instructions || '',
      reception_person: `${customerInfo.firstName} ${customerInfo.paternalLastName || ''}`.trim(),
      reception_phone: customerInfo.phone || '',
      subtotal: subtotal,
      discount: 0,
      total: total,
      seller_id: sellerId,
      order_status: 'pendiente de pago',
      situation_id: initialSituationId,
      module_id: 1,
      date: new Date().toISOString(),
    };

    // Asignar tipo CLI al cliente si existe
    const { data: cliTypeData } = await supabase
      .from('account_types')
      .select('id')
      .eq('code', 'CLI')
      .single();

    if (cliTypeData) {
      const { data: existingAccount } = await supabase
        .from('accounts')
        .select('id')
        .eq('document_number', customerInfo.documentNumber)
        .single();

      if (existingAccount) {
        const { data: existingType } = await supabase
          .from('account_types')
          .select('id')
          .eq('account_id', existingAccount.id)
          .eq('account_type_id', cliTypeData.id)
          .single();

        if (!existingType) {
          await supabase.from('account_types').insert({
            account_id: existingAccount.id,
            account_type_id: cliTypeData.id,
          });
        }
      }
    }

    // Llamar al SP
    const { data: orderResponse, error: rpcError } = await supabase.rpc('sp_ec_create_order', {
      p_user_id: sellerId,
      p_order_data: orderData,
      p_products: products,
      p_payments: [],
      p_change_entries: [],
      p_initial_situation_id: initialSituationId,
      p_is_existing_client: true,
      p_price_list_id: channelInfo.data.price_list_id,
      p_branch_id: channelInfo.data.branch_id,
      p_warehouse_id: channelInfo.data.warehouse_id,
      p_stock_type_id: channelInfo.data.stock_type_id,
      p_sale_type_id: channelInfo.data.sale_type_id,
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      throw new Error(`Failed to create order: ${rpcError.message}`);
    }

    // Marcar productos del carrito como comprados
    await supabase
      .from('cart_products')
      .update({ bought: true })
      .eq('cart_id', cartId)
      .eq('bought', false);

    return new Response(
      JSON.stringify({
        success: true,
        orderId: orderResponse?.order_id || null,
        message: 'Order created successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Global Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});