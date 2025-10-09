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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const orderData = await req.json();
    console.log('Creating order:', orderData);

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        date: orderData.date,
        document_type: orderData.document_type,
        document_number: orderData.document_number,
        customer_name: orderData.customer_name,
        customer_lastname: orderData.customer_lastname,
        email: orderData.email,
        phone: orderData.phone,
        sale_type: orderData.sale_type,
        subtotal: orderData.subtotal,
        discount: orderData.discount || 0,
        total: orderData.total,
        shipping_method: orderData.shipping_method,
        country_id: orderData.country_id,
        state_id: orderData.state_id,
        city_id: orderData.city_id,
        neighborhood_id: orderData.neighborhood_id,
        address: orderData.address,
        address_reference: orderData.address_reference,
        reception_person: orderData.reception_person,
        reception_phone: orderData.reception_phone,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw orderError;
    }

    console.log('Order created:', order.id);

    // Create order products
    const orderProducts = orderData.products.map((product: any) => ({
      order_id: order.id,
      product_variation_id: product.variation_id,
      quantity: product.quantity,
      product_price: product.price,
      product_discount: product.discount || 0,
    }));

    const { error: productsError } = await supabase
      .from('order_products')
      .insert(orderProducts);

    if (productsError) {
      console.error('Error creating order products:', productsError);
      throw productsError;
    }

    console.log('Order products created');

    // Create payment record if provided
    if (orderData.payment) {
      const { error: paymentError } = await supabase
        .from('order_payment')
        .insert({
          order_id: order.id,
          payment_method_id: orderData.payment.payment_method_id,
          amount: orderData.payment.amount,
          date: orderData.payment.date,
          gateway_confirmation_code: orderData.payment.confirmation_code,
        });

      if (paymentError) {
        console.error('Error creating payment:', paymentError);
        throw paymentError;
      }

      console.log('Payment created');
    }

    // Create initial order history entry
    const { error: historyError } = await supabase
      .from('order_history')
      .insert({
        order_id: order.id,
        module_id: 1, // Default module
        status_id: 1, // Default status
        situation_id: 1, // Default situation
        last_row: true,
      });

    if (historyError) {
      console.error('Error creating order history:', historyError);
      throw historyError;
    }

    console.log('Order history created');

    return new Response(
      JSON.stringify({ success: true, order }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
