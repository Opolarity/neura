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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { cartId, customerInfo, shippingInfo } = await req.json();

    if (!cartId || !customerInfo || !customerInfo.documentNumber) {
      return new Response(
        JSON.stringify({ error: 'cartId and customerInfo (documentNumber) are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const [priceListRes, stockTypeRes, saleTypeRes, initialSituationRes] = await Promise.all([
      supabase
        .from('price_list')
        .select('id')
        .eq('web', true)
        .single(),

      supabase
        .from('types')
        .select('id')
        .eq('code', 'PRD')
        .eq('modules.code', 'STK')
        .innerJoin('modules', 'module_id', 'id')
        .single(),

      supabase
        .from('types')
        .select('id')
        .eq('code', 'WRT')
        .eq('modules.code', 'ORD')
        .innerJoin('modules', 'module_id', 'id')
        .single(),

      // Situación inicial: code = VIR, status.code = PEN, module.code = ORD
      supabase
        .from('situations')
        .select('id, status_id, statuses!inner(code), modules!inner(code)')
        .eq('code', 'VIR')
        .eq('statuses.code', 'PEN')
        .eq('modules.code', 'ORD')
        .single(),
    ]);

    const webPriceListId     = priceListRes.data?.id;
    const stockTypeId        = stockTypeRes.data?.id;
    const saleTypeId         = saleTypeRes.data?.id;
    const initialSituationId = initialSituationRes.data?.id;
    const sellerId           = 0; 

    if (!webPriceListId)     throw new Error('Web price list not found');
    if (!stockTypeId)        throw new Error('Stock type (PRD/STK) not found');
    if (!saleTypeId)         throw new Error('Sale type (WRT/ORD) not found');
    if (!initialSituationId) throw new Error('Initial situation (VIR/PEN/ORD) not found');

    console.log('Using IDs:', { webPriceListId, stockTypeId, saleTypeId, initialSituationId, sellerId });

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

    // ── 3. Preparar productos con precios actualizados de la lista Web ──
    const products = await Promise.all(
      cartProducts.map(async (item) => {
        const { data: priceData } = await supabase
          .from('product_price')
          .select('price, sale_price')
          .eq('product_variation_id', item.product_variation_id)
          .eq('price_list_id', webPriceListId)
          .single();

        const finalPrice = priceData?.sale_price || priceData?.price || item.product_price;

        return {
          variation_id: item.product_variation_id,
          quantity: item.quantity,
          price: finalPrice,
          discount_amount: 0,
          stock_type_id: stockTypeId,
        };
      })
    );

    const subtotal = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const total    = subtotal;

    const orderData = {
      document_type:    customerInfo.documentTypeId,
      document_type_id: customerInfo.documentTypeId,
      document_number:  customerInfo.documentNumber,
      customer_name:    customerInfo.firstName,
      customer_lastname: `${customerInfo.paternalLastName || ''} ${customerInfo.maternalLastName || ''}`.trim(),
      email:            customerInfo.email || '',
      phone:            customerInfo.phone || '',
      sale_type:        saleTypeId,
      shipping_method:  shippingInfo?.shippingMethodId ?? null,
      shipping_cost:    shippingInfo?.shippingCost ?? 0,
      address:          shippingInfo?.address || '',
      address_reference: shippingInfo?.instructions || '',
      reception_person: `${customerInfo.firstName} ${customerInfo.paternalLastName || ''}`.trim(),
      reception_phone:  customerInfo.phone || '',
      subtotal:         subtotal,
      discount:         0,
      total:            total,
      seller_id:        sellerId,
      order_status:     'pendiente de pago',
      situation_id:     initialSituationId,
      module_id:        1,
      date:             new Date().toISOString(),
    };

 
    const { data: cliTypeData } = await supabase
      .from('types')
      .select('id, modules!inner(code)')
      .eq('code', 'CLI')
      .eq('modules.code', 'CUT')
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
          await supabase
            .from('account_types')
            .insert({
              account_id:      existingAccount.id,
              account_type_id: cliTypeData.id,
            });
          console.log(`CLI type added to account ${existingAccount.id}`);
        }
      }
    }

    const { data: orderResponse, error: rpcError } = await supabase.rpc('sp_create_order', {
      p_user_id:            sellerId,
      p_branch_id:          1,
      p_warehouse_id:       1,
      p_order_data:         orderData,
      p_products:           products,
      p_payments:           [], 
      p_initial_situation_id: initialSituationId,
      p_is_existing_client: true,
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      throw new Error(`Failed to create order: ${rpcError.message}`);
    }

    await supabase
      .from('cart_products')
      .update({ bought: true })
      .eq('cart_id', cartId)
      .eq('bought', false);

    return new Response(
      JSON.stringify({
        success: true,
        orderId: orderResponse?.order_id || null,
        message: 'Order created successfully with System Account (ID 0)',
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