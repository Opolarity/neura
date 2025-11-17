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
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw orderError;
    }

    console.log('Order created:', order.id);

    // Get user's warehouse_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('warehouse_id')
      .eq('UID', user.id)
      .single();

    const warehouseId = profile?.warehouse_id || 1; // Default to 1 if not found

    // Create order products with reservation = true
    const orderProducts = orderData.products.map((product: any) => ({
      order_id: order.id,
      product_variation_id: product.variation_id,
      quantity: product.quantity,
      product_price: product.price,
      product_discount: product.discount || 0,
      warehouses_id: warehouseId,
      reservation: true, // Marcar como reserva inicialmente
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

    // Get the initial situation to check status
    const initialSituationId = orderData.initial_situation_id || 1; // Default to 1 if not provided
    
    const { data: initialSituation } = await supabase
      .from('situations')
      .select('status_id, statuses(code)')
      .eq('id', initialSituationId)
      .single();

    const statusCode = initialSituation?.statuses?.code;

    // Create initial order situation entry
    const { error: situationError } = await supabase
      .from('order_situations')
      .insert({
        order_id: order.id,
        status_id: initialSituation?.status_id || 1,
        situation_id: initialSituationId,
        last_row: true,
      });

    if (situationError) {
      console.error('Error creating order situation:', situationError);
      throw situationError;
    }

    console.log('Order situation created');

    // Only create movement if status is CFM (confirmed)
    if (statusCode === 'CFM') {
      console.log('Status is CFM, creating movement and updating stock');
      
      // Get movement type for income
      // Get movement type for income (support 'INC' and '+')
      let movementType = null as { id: number } | null;
      {
        const { data } = await supabase
          .from('movement_types')
          .select('id')
          .eq('code', 'INC')
          .maybeSingle();
        movementType = data ?? null;
      }
      if (!movementType) {
        const { data } = await supabase
          .from('movement_types')
          .select('id')
          .eq('code', '+')
          .maybeSingle();
        movementType = data ?? null;
      }

      // Get payment method from order data
      const paymentMethodId = orderData.payment?.payment_method_id || null;

      // Get business account from payment method if exists
      let businessAccountId = 1; // Default
      if (paymentMethodId) {
        const { data: paymentMethod } = await supabase
          .from('payment_methods')
          .select('business_account_id')
          .eq('id', paymentMethodId)
          .maybeSingle();
        
        if (paymentMethod?.business_account_id) {
          businessAccountId = paymentMethod.business_account_id;
        }
      }

      // Create movement record (income from sale)
      if (movementType) {
        const { error: movementError } = await supabase
          .from('movements')
          .insert({
            movement_date: orderData.date || new Date().toISOString(),
            movement_type_id: movementType.id,
            movement_category_id: 1, // Default category
            amount: orderData.total,
            business_account_id: businessAccountId,
            payment_method_id: paymentMethodId,
            warehouse_id: warehouseId,
            user_id: user.id,
            description: `Venta - Orden #${order.id} - ${orderData.customer_name} ${orderData.customer_lastname || ''}`.trim(),
          });

        if (movementError) {
          console.error('Error creating movement:', movementError);
        } else {
          console.log('Movement created for order:', order.id);
        }
      }

      // Update order_products to set reservation = false since it's confirmed
      const { error: updateProductsError } = await supabase
        .from('order_products')
        .update({ reservation: false })
        .eq('order_id', order.id);

      if (updateProductsError) {
        console.error('Error updating order_products reservation:', updateProductsError);
      }

      // Reduce stock for confirmed orders
      const { data: orderProducts } = await supabase
        .from('order_products')
        .select('product_variation_id, quantity, warehouses_id')
        .eq('order_id', order.id);

      if (orderProducts) {
        for (const product of orderProducts) {
          // Get current stock
          const { data: currentStock, error: fetchError } = await supabase
            .from('product_stock')
            .select('stock')
            .eq('product_variation_id', product.product_variation_id)
            .eq('warehouse_id', product.warehouses_id)
            .single();

          if (fetchError) {
            console.error('Error fetching current stock:', fetchError);
            continue; // Skip this product but continue with others
          }

          const newStock = (currentStock?.stock || 0) - product.quantity;

          const { error: stockError } = await supabase
            .from('product_stock')
            .update({ stock: newStock })
            .eq('product_variation_id', product.product_variation_id)
            .eq('warehouse_id', product.warehouses_id);

          if (stockError) {
            console.error('Error reducing stock:', stockError);
          }
        }
      }
    } else {
      console.log(`Status is ${statusCode}, movement will be created when status changes to CFM`);
    }

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
