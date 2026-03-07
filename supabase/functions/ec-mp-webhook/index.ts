import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ Validar que la notificación realmente viene de MercadoPago
async function validateMPSignature(req: Request, body: string): Promise<boolean> {
  try {
    const secret = Deno.env.get('MP_WEBHOOK_SECRET');
    if (!secret) return false;

    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    const url = new URL(req.url);
    const dataId = url.searchParams.get('data.id') ?? '';

    if (!xSignature) return false;

    // Extraer ts y v1 del header x-signature
    const parts = Object.fromEntries(xSignature.split(',').map(p => p.split('=')));
    const ts = parts['ts'];
    const v1 = parts['v1'];

    if (!ts || !v1) return false;

    // Construir el mensaje a firmar según la doc de MP
    const message = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // Generar HMAC-SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const hashHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return hashHex === v1;
  } catch (e) {
    console.error('[WEBHOOK] Error validando firma:', e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const rawBody = await req.text();

    // ✅ Validar firma de MercadoPago antes de procesar nada
    const isValid = await validateMPSignature(req, rawBody);
    if (!isValid) {
      console.warn('[WEBHOOK] Firma inválida o no autorizada');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = JSON.parse(rawBody);
    console.log('[WEBHOOK] Body recibido:', JSON.stringify(body));

    const { type, data } = body;

    if (type !== 'payment') {
      console.log('[WEBHOOK] Tipo ignorado:', type);
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      return new Response(JSON.stringify({ error: 'Sin payment id' }), { status: 400 });
    }

    // 1. Consultar el pago a la API de MP
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}` },
    });

    const mpPayment = await mpRes.json();
    console.log('[WEBHOOK] MP status:', mpPayment.status, '| order:', mpPayment.external_reference);

    const orderId = mpPayment.external_reference;
    const status = mpPayment.status;

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Sin external_reference' }), { status: 400 });
    }

    // 2. Determinar situación destino
    let situationCode: string | null = null;
    if (status === 'approved') {
      situationCode = 'PAI-VIR';
    } else if (status === 'cancelled' || status === 'rejected') {
      situationCode = 'CAN-HDN';
    } else {
      console.log('[WEBHOOK] Estado pendiente ignorado:', status);
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // 3. Obtener datos de la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total, branch_id, user_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) throw new Error(`Orden ${orderId} no encontrada`);

    // 4. Obtener situación destino
    const { data: situation, error: situationError } = await supabase
      .from('situations')
      .select('id, status_id, name')
      .eq('code', situationCode)
      .single();

    if (situationError || !situation) throw new Error(`Situación ${situationCode} no encontrada`);

    // 5. Idempotencia: ignorar si ya está en esa situación
    const { data: lastSit } = await supabase
      .from('order_situations')
      .select('situations(code)')
      .eq('order_id', orderId)
      .eq('last_row', true)
      .single();

    const currentCode = (lastSit?.situations as any)?.code;
    if (currentCode === situationCode) {
      console.log(`[WEBHOOK] Orden ${orderId} ya en ${situationCode}, duplicado ignorado`);
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // 6. Cambiar situación
    await supabase
      .from('order_situations')
      .update({ last_row: false })
      .eq('order_id', orderId)
      .eq('last_row', true);

    await supabase.from('order_situations').insert({
      order_id: Number(orderId),
      situation_id: situation.id,
      status_id: situation.status_id,
      last_row: true,
      created_by: null,
    });

    console.log(`[WEBHOOK] Orden ${orderId} → ${situationCode}`);

    // 6.5 Registrar nota del cambio de situación
    const { data: note } = await supabase
      .from('notes')
      .insert({
        message: `Pedido creado con situación: ${situation.name} | Método de pago: MercadoPago`,
        user_id: order.user_id,
        code: 'ORD',
      })
      .select('id')
      .single();

    if (note) {
      await supabase.from('order_notes').insert({
        order_id: Number(orderId),
        note_id: note.id,
      });
    }

    // 7. Solo si approved → registrar movement + order_payment + limpiar carrito
    if (status === 'approved') {
      const { data: pmData } = await supabase
        .from('payment_methods')
        .select('id, business_account_id')
        .eq('code', 'MERCP')
        .single();

      const businessAccountId = pmData?.business_account_id ?? 1;

      const { data: movement, error: movError } = await supabase
        .from('movements')
        .insert({
          movement_class_id: 1,
          movement_type_id: 27,
          description: `Pago MP aprobado orden #${orderId}`,
          amount: order.total,
          movement_date: new Date().toISOString(),
          business_account_id: businessAccountId,
          user_id: order.user_id,
          payment_method_id: pmData?.id,
          branch_id: order.branch_id,
        })
        .select('id')
        .single();

      if (movError) throw new Error('Error al crear movement: ' + movError.message);

      const { error: opError } = await supabase.from('order_payment').insert({
        order_id: Number(orderId),
        payment_method_id: pmData?.id,
        amount: order.total,
        date: new Date().toISOString(),
        gateway_confirmation_code: paymentId.toString(),
        voucher_url: null,
        movement_id: movement?.id,
        business_acount_id: businessAccountId,
      });

      if (opError) throw new Error('Error al crear order_payment: ' + opError.message);

      if (order.user_id) {
        const { data: activeCarts } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', order.user_id)
          .eq('is_active', true);

        for (const cart of activeCarts || []) {
          await supabase.from('cart_products').update({ is_active: false }).eq('cart_id', cart.id);
          await supabase.from('carts').update({ is_active: false }).eq('id', cart.id);
        }
      }

      console.log(`[WEBHOOK] Orden ${orderId} → movement + order_payment + carrito OK`);
    }

    return new Response(
      JSON.stringify({ success: true, orderId, situation: situationCode }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[WEBHOOK] Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 