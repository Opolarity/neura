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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // 1. Canal
    const { data: channelInfo, error: channelError } = await supabase
      .from('channels')
      .select('*')
      .eq('code', channel)
      .single();

    if (channelError || !channelInfo) throw new Error('Código de canal inválido');

    // ── LOG-1 ──────────────────────────────────────────────────────────────
    console.log('[LOG-1] channelInfo:', JSON.stringify({
      code: channel,
      price_list_id: channelInfo.price_list_id,
      branch_id: channelInfo.branch_id,
      warehouse_id: channelInfo.warehouse_id,
      stock_type_id: channelInfo.stock_type_id,
      sale_type_id: channelInfo.sale_type_id,
    }));

    const { cartId, customerInfo, shippingInfo, paymentInfo } = await req.json();

    if (!customerInfo?.documentNumber) {
      return new Response(JSON.stringify({ error: 'Faltan datos requeridos (documentNumber)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Método de pago
    const { data: paymentMethodData } = await supabase
      .from('payment_methods')
      .select('code')
      .eq('id', paymentInfo?.paymentMethodId)
      .single();

    const isMercadoPago = paymentMethodData?.code === 'MERCP';
    // Verifica que el código 'PWRPY' coincida con el registrado en tu tabla payment_methods
    const isPowerPay = paymentMethodData?.code === 'PWRPY';
    const isOnlinePayment = isMercadoPago || isPowerPay;
    const paymentMethodCode = paymentMethodData?.code ?? null;

    // ── LOG-2 ──────────────────────────────────────────────────────────────
    console.log('[LOG-2] paymentMethod:', JSON.stringify({
      paymentMethodId: paymentInfo?.paymentMethodId,
      paymentMethodCode,
      isMercadoPago,
    }));

    // 3. Situación y lista de precios
    const { data: situationData } = await supabase
      .from('situations')
      .select('id')
      .eq('code', 'PEP-VIR')
      .single();

    const { data: priceListData } = await supabase
      .from('price_list')
      .select('code')
      .eq('id', channelInfo.price_list_id)
      .single();

    // ── LOG-3 ──────────────────────────────────────────────────────────────
    console.log('[LOG-3] priceList:', JSON.stringify({
      price_list_id: channelInfo.price_list_id,
      price_list_code: priceListData?.code,
      situation_id: situationData?.id,
    }));

    // 4. Obtener productos del carrito
    if (!cartId) throw new Error('Se requiere cartId');

    const { data: cartProducts, error: cartError } = await supabase
      .from('cart_products')
      .select('product_variation_id, quantity, warehouse_id')
      .eq('cart_id', cartId)
      .eq('is_active', true);

    if (cartError) throw new Error('Error al obtener productos del carrito');
    if (!cartProducts || cartProducts.length === 0) throw new Error('El carrito está vacío');

    // ── LOG-4 ──────────────────────────────────────────────────────────────
    console.log('[LOG-4] cartProducts (desde cart_products table):', JSON.stringify(cartProducts));

    // 5. Obtener precios frescos desde product_price
    const varIds = cartProducts.map((cp) => cp.product_variation_id);

    const { data: prices, error: pricesError } = await supabase
      .from('product_price')
      .select('product_variation_id, price')
      .in('product_variation_id', varIds)
      .eq('price_list_id', channelInfo.price_list_id);

    // ── LOG-5 ──────────────────────────────────────────────────────────────
    console.log('[LOG-5] precios desde product_price table:', JSON.stringify({
      price_list_id_usado: channelInfo.price_list_id,
      variation_ids_buscados: varIds,
      prices_encontrados: prices,
      error: pricesError?.message ?? null,
    }));

    const regularPriceMap = new Map(
      (prices || []).map((p: any) => [p.product_variation_id, p.price])
    );

    // 6. Calcular precios finales y regalos via apply-price-rules
    const itemsForRules = cartProducts.map((cp) => {
      const regPrice = regularPriceMap.get(cp.product_variation_id) ?? 0;
      return {
        variationId: cp.product_variation_id,
        quantity: cp.quantity,
        regular_price: regPrice,
        product_price: regPrice,
        sale_price: null,
      };
    });

    // ── LOG-6 ──────────────────────────────────────────────────────────────
    console.log('[LOG-6] itemsForRules enviados a apply-price-rules:', JSON.stringify(itemsForRules));

    const rulesRes = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/apply-price-rules`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          items: itemsForRules,
          userId: user?.id || null,
          priceListId: channelInfo.price_list_id,
          paymentMethodCode,
        }),
      }
    );

    if (!rulesRes.ok) throw new Error('Error al calcular precios');

    const rulesData = await rulesRes.json();

    // ── LOG-7 ──────────────────────────────────────────────────────────────
    console.log('[LOG-7] respuesta completa de apply-price-rules:', JSON.stringify(rulesData));

    const itemsWithRules: any[] = rulesData.items ?? [];
    const gifts: any[] = rulesData.gifts ?? [];
    const discounts: any[] = Array.isArray(rulesData.discounts) ? rulesData.discounts : [];

    const rulesMap = new Map(
      itemsWithRules.map((i: any) => [i.variationId, i.product_price])
    );

    // ── LOG-8 ──────────────────────────────────────────────────────────────
    console.log('[LOG-8] rulesMap (variationId → precioFinal):', JSON.stringify(
      Object.fromEntries(rulesMap)
    ));

    const { data: variationsData } = await supabase
      .from('variations')
      .select('id, product_id, sku, products(title), variation_terms(terms(name))')
      .in('id', varIds);

    console.log('[variations]', JSON.stringify(variationsData));

    const variationNameMap: Record<number, string> = {};
    for (const v of variationsData || []) {
      const title = (v.products as any)?.title ?? null;
      variationNameMap[v.id] = `[${v.sku}] ${title} (${v.variation_terms?.map((t: any) => t.terms.name).join(' - ')})` || `Variación #${v.id}`;
    }

    console.log('[variationNameMap]', JSON.stringify(variationNameMap));

    // 8. Construir productos reales con precios finales calculados
    const realProducts = cartProducts.map((cp) => {
      const regularPrice = regularPriceMap.get(cp.product_variation_id) ?? 0;
      const finalPrice = rulesMap.get(cp.product_variation_id) ?? regularPrice;

      return {
        variation_id: cp.product_variation_id,
        quantity: cp.quantity,
        price: finalPrice,
        regular_price: regularPrice,
        discount_amount: 0,
        stock_type_id: channelInfo.stock_type_id,
        product_name: variationNameMap[cp.product_variation_id],
      };
    });

    // ── LOG-9 ──────────────────────────────────────────────────────────────
    console.log('[LOG-9] realProducts construidos:', JSON.stringify(realProducts));

    // 9. Construir regalos
    const giftProducts = (gifts || [])
      .filter((g: any) => !!g.variation_id)
      .map((g: any) => ({
        variation_id: g.variation_id,
        quantity: g.quantity || 1,
        price: 0,
        regular_price: 0,
        discount_amount: 0,
        stock_type_id: channelInfo.stock_type_id,
        product_name: g.product_name || 'Regalo promocional',
      }));

    const allProducts = [...realProducts, ...giftProducts];

    if (allProducts.length === 0) throw new Error('El pedido no tiene productos');

    // 11. Actualizar cart_products con los precios finales calculados
    for (const cp of realProducts) {
      await supabase
        .from('cart_products')
        .update({
          product_price: cp.regular_price,
          sale_price: cp.price !== cp.regular_price ? cp.price : null,
        })
        .eq('cart_id', cartId)
        .eq('product_variation_id', cp.variation_id);
    }

    // 12. Cálculos financieros
    const subtotal = realProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const shippingCost = shippingInfo?.shippingCost || 0;

    const discountTotal = discounts.reduce(
      (sum: number, d: any) => sum + (d.discount ?? 0),
      0
    );

    const discountForOrder = parseFloat(discountTotal.toFixed(2));
    const total = parseFloat((subtotal + shippingCost + discountTotal).toFixed(2));

    // ── LOG-10 ─────────────────────────────────────────────────────────────
    console.log('[LOG-10] cálculo financiero final:', JSON.stringify({
      subtotal,
      shippingCost,
      discountTotal,
      discountForOrder,
      total,
      discounts,
    }));

    // 13. Mapear datos para la orden
    const orderData = {
      document_type: customerInfo.documentTypeId,
      document_number: customerInfo.documentNumber,
      customer_name: customerInfo.firstName,
      customer_lastname: `${customerInfo.paternalLastName || ''} ${customerInfo.maternalLastName || ''}`.trim(),
      email: customerInfo.email || '',
      phone: customerInfo.phone || '',
      sale_type: channelInfo.sale_type_id,
      price_list_code: priceListData?.code,
      shipping_method: shippingInfo?.shippingMethodId,
      shipping_cost: shippingCost,
      address: shippingInfo?.address || '',
      address_reference: shippingInfo?.instructions || '',
      reception_person: `${customerInfo.firstName} ${customerInfo.paternalLastName || ''}`.trim(),
      reception_phone: customerInfo.phone || '',
      subtotal,
      discount: discountForOrder,
      total,
      country_id: shippingInfo?.countryId || null,
      state_id: shippingInfo?.stateId || null,
      city_id: shippingInfo?.cityId || null,
      neighborhood_id: shippingInfo?.neighborhoodId || null,
    };

    // 14. Verificar cliente existente
    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('document_number', customerInfo.documentNumber)
      .eq('document_type_id', customerInfo.documentTypeId)
      .maybeSingle();

    const isExistingClient = !!user || !!existingAccount;

    // 15. Ejecutar RPC de creación de orden
    const { data: orderResponse, error: rpcError } = await supabase.rpc('sp_ec_create_order', {
      p_user_id: user?.id ?? null,
      p_order_data: orderData,
      p_products: allProducts,
      p_payments: (!isOnlinePayment && paymentInfo) ? [{
        payment_method_id: paymentInfo.paymentMethodId,
        amount: total,
        date: new Date().toISOString(),
        confirmation_code: paymentInfo.confirmationCode || null,
        voucher_url: paymentInfo.voucherUrl || null,
        business_account_id: 0,
      }] : [],
      p_change_entries: [],
      p_discounts: discounts,
      p_initial_situation_id: situationData?.id,
      p_is_existing_client: isExistingClient,
      p_is_mercadopago: isOnlinePayment, // true para MP y PowerPay (pago diferido, sin registro previo)
      p_branch_id: channelInfo.branch_id,
      p_warehouse_id: channelInfo.warehouse_id,
      p_stock_type_id: channelInfo.stock_type_id,
      p_sale_type_id: channelInfo.sale_type_id,
    });

    if (rpcError) {
      console.error('[rpc] error:', rpcError.message);
      throw rpcError;
    }

    const orderId = orderResponse?.order_id;
    console.log('[LOG-11] orden creada — order_id:', orderId, '| orderResponse:', JSON.stringify(orderResponse));

    // 17. Limpiar carrito
    if (cartId) {
      await supabase.from('cart_products').update({ is_active: false }).eq('cart_id', cartId);
      await supabase.from('carts').update({
        is_active: false,
        order_id: orderId,
      }).eq('id', cartId);
    }

    // 18. Enviar email de confirmación
    try {
      const emailRecord = {
        id: orderId,
        reception_person: orderData.reception_person,
        total: orderData.total,
        subtotal: orderData.subtotal,
        shipping_cost: orderData.shipping_cost,
        cliente_email: orderData.email,
        cliente_nombre: orderData.customer_name,
        address: orderData.address,
        phone: orderData.phone,
        products: allProducts,
        discounts,
      };

      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-order-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({ record: emailRecord }),
      });
    } catch (mailError) {
      console.error('Error al enviar correo:', mailError.message);
    }

    // 19. Pago online: MercadoPago o PowerPay
    let init_point = null;
    if (isMercadoPago) {
      const mpRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ec-create-mp-preference`, {
        method: 'POST',
        headers: {
          'Authorization': req.headers.get('Authorization')!,
          'Content-Type': 'application/json',
          'x-channel-code': channel!,
        },
        body: JSON.stringify({
          orderId,
          cartProducts: realProducts,
          email: customerInfo.email,
          shippingCost,
          total,
          discounts,
        }),
      });
      const mpData = await mpRes.json();
      init_point = mpData.init_point;
    } else if (isPowerPay) {
      const ppRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ec-create-pp-transaction`, {
        method: 'POST',
        headers: {
          'Authorization': req.headers.get('Authorization')!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          email: customerInfo.email,
          total,
          customerInfo,
          shippingInfo,
          isExistingClient,
          productNames: realProducts.map((p: any) => p.product_name).filter(Boolean),
        }),
      });
      const ppData = await ppRes.json();
      if (ppData.error) {
        console.error('[create-order] PowerPay error:', ppData.error);
      }
      // Se reutiliza init_point para mantener compatibilidad con el frontend
      init_point = ppData.redirection_url ?? null;
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        init_point,
        orderPaymentId: orderResponse?.payments?.[0]?.id ?? null,
        discounts,
        message: 'Orden creada correctamente',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[create-order-ec] error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});