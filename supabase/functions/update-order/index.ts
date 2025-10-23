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

    const { orderId, ...orderData } = await req.json();
    console.log('Updating order:', orderId, orderData);

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Update the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({
        date: orderData.date || new Date().toISOString(),
        document_type: parseInt(orderData.document_type),
        document_number: orderData.document_number,
        customer_name: orderData.customer_name,
        customer_lastname: orderData.customer_lastname,
        email: orderData.email || null,
        phone: orderData.phone ? parseInt(orderData.phone) : null,
        sale_type: parseInt(orderData.sale_type),
        subtotal: orderData.subtotal,
        discount: orderData.discount || 0,
        total: orderData.total,
        shipping_method: orderData.shipping_method ? parseInt(orderData.shipping_method) : null,
        country_id: orderData.country_id ? parseInt(orderData.country_id) : null,
        state_id: orderData.state_id ? parseInt(orderData.state_id) : null,
        city_id: orderData.city_id ? parseInt(orderData.city_id) : null,
        neighborhood_id: orderData.neighborhood_id ? parseInt(orderData.neighborhood_id) : null,
        address: orderData.address || null,
        address_reference: orderData.address_reference || null,
        reception_person: orderData.reception_person || null,
        reception_phone: orderData.reception_phone ? parseInt(orderData.reception_phone) : null,
      })
      .eq('id', orderId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (orderError) {
      console.error('Error updating order:', orderError);
      throw orderError;
    }

    console.log('Order updated:', order.id);

    // Get user's warehouse_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('warehouse_id')
      .eq('UID', user.id)
      .single();

    const warehouseId = profile?.warehouse_id || 1; // Default to 1 if not found

    // Delete existing order products
    const { error: deleteProductsError } = await supabase
      .from('order_products')
      .delete()
      .eq('order_id', orderId);

    if (deleteProductsError) {
      console.error('Error deleting existing order products:', deleteProductsError);
      throw deleteProductsError;
    }

    // Create new order products
    const orderProducts = orderData.products.map((product: any) => ({
      order_id: orderId,
      product_variation_id: product.variation_id,
      quantity: product.quantity,
      product_price: product.price,
      product_discount: product.discount || 0,
      warehouses_id: warehouseId,
    }));

    const { error: productsError } = await supabase
      .from('order_products')
      .insert(orderProducts);

    if (productsError) {
      console.error('Error creating order products:', productsError);
      throw productsError;
    }

    console.log('Order products updated');

    // Update or create payment record if provided
    if (orderData.payment) {
      // Check if payment exists
      const { data: existingPayment } = await supabase
        .from('order_payment')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle();

      if (existingPayment) {
        // Update existing payment
        const { error: paymentError } = await supabase
          .from('order_payment')
          .update({
            payment_method_id: orderData.payment.payment_method_id,
            amount: orderData.payment.amount,
            date: orderData.payment.date,
            gateway_confirmation_code: orderData.payment.confirmation_code,
          })
          .eq('order_id', orderId);

        if (paymentError) {
          console.error('Error updating payment:', paymentError);
          throw paymentError;
        }

        console.log('Payment updated');
      } else {
        // Create new payment
        const { error: paymentError } = await supabase
          .from('order_payment')
          .insert({
            order_id: orderId,
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
    }

    return new Response(
      JSON.stringify({ success: true, order }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating order:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
