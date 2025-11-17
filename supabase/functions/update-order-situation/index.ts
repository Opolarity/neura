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

    const { orderId, situationId } = await req.json();
    console.log('Updating order situation:', orderId, situationId);

    if (!orderId || !situationId) {
      throw new Error('Order ID and situation ID are required');
    }

    // Get user's warehouse
    const { data: profile } = await supabase
      .from('profiles')
      .select('warehouse_id')
      .eq('UID', user.id)
      .single();

    const warehouseId = profile?.warehouse_id || 1;

    // Get the situation and its status code
    const { data: situation, error: situationError } = await supabase
      .from('situations')
      .select('id, status_id, statuses(code)')
      .eq('id', situationId)
      .single();

    if (situationError || !situation) {
      throw new Error('Situation not found');
    }

    const statusCode = situation.statuses?.code;
    console.log('Status code:', statusCode);

    // Get previous situation for this order
    const { data: previousSituation } = await supabase
      .from('order_situations')
      .select('situation_id, situations(statuses(code))')
      .eq('order_id', orderId)
      .eq('last_row', true)
      .maybeSingle();

    const previousStatusCode = previousSituation?.situations?.statuses?.code;
    console.log('Previous status code:', previousStatusCode);

    // Mark previous record as not last_row
    if (previousSituation) {
      await supabase
        .from('order_situations')
        .update({ last_row: false })
        .eq('order_id', orderId)
        .eq('last_row', true);
    }

    // Insert new situation record
    const { error: insertError } = await supabase
      .from('order_situations')
      .insert({
        order_id: orderId,
        situation_id: situationId,
        status_id: situation.status_id,
        last_row: true,
      });

    if (insertError) {
      console.error('Error inserting order situation:', insertError);
      throw insertError;
    }

    // Get order products
    const { data: orderProducts, error: productsError } = await supabase
      .from('order_products')
      .select('id, product_variation_id, quantity, warehouses_id, reservation')
      .eq('order_id', orderId);

    if (productsError) {
      console.error('Error fetching order products:', productsError);
      throw productsError;
    }

    console.log('Order products:', orderProducts);

    // Apply stock logic based on status code
    if (statusCode === 'RES') {
      // Reservation status: Mark as reservation = true, don't reduce stock
      console.log('Setting reservation = true');
      for (const product of orderProducts) {
        await supabase
          .from('order_products')
          .update({ reservation: true })
          .eq('id', product.id);
      }
    } else if (statusCode === 'CFM') {
      // Confirmation status: Mark as reservation = false, reduce stock
      console.log('Setting reservation = false and reducing stock');
      for (const product of orderProducts) {
        await supabase
          .from('order_products')
          .update({ reservation: false })
          .eq('id', product.id);

        // Reduce stock - get current stock and update
        const { data: currentStock, error: fetchError } = await supabase
          .from('product_stock')
          .select('stock')
          .eq('product_variation_id', product.product_variation_id)
          .eq('warehouse_id', product.warehouses_id)
          .single();

        if (fetchError) {
          console.error('Error fetching current stock:', fetchError);
          throw fetchError;
        }

        const newStock = (currentStock?.stock || 0) - product.quantity;

        const { error: stockError } = await supabase
          .from('product_stock')
          .update({ stock: newStock })
          .eq('product_variation_id', product.product_variation_id)
          .eq('warehouse_id', product.warehouses_id);

        if (stockError) {
          console.error('Error updating stock:', stockError);
          throw stockError;
        }
      }

      // Create income movement when confirming order
      console.log('Creating income movement for confirmed order');

      // Get order details
      const { data: order } = await supabase
        .from('orders')
        .select('total, customer_name, customer_lastname, date')
        .eq('id', orderId)
        .single();

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

      // Get payment method from order payment
      const { data: orderPayment } = await supabase
        .from('order_payment')
        .select('payment_method_id')
        .eq('order_id', orderId)
        .maybeSingle();

      const paymentMethodId = orderPayment?.payment_method_id || null;

      // Get business account from payment method
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

      // Create movement
      if (movementType && order) {
        const { error: movementError } = await supabase
          .from('movements')
          .insert({
            movement_date: order.date || new Date().toISOString(),
            movement_type_id: movementType.id,
            movement_category_id: 1, // Default category
            amount: order.total,
            business_account_id: businessAccountId,
            payment_method_id: paymentMethodId,
            warehouse_id: warehouseId,
            user_id: user.id,
            description: `Venta - Orden #${orderId} - ${order.customer_name} ${order.customer_lastname || ''}`.trim(),
          });

        if (movementError) {
          console.error('Error creating movement:', movementError);
        } else {
          console.log('Movement created for order:', orderId);
        }
      }
    }

    console.log('Order situation updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Order situation updated successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error updating order situation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
