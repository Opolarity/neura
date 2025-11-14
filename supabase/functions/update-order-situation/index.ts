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
        // Update order_products to mark as not reserved
        await supabase
          .from('order_products')
          .update({ reservation: false })
          .eq('id', product.id);

        // Only reduce stock if it was previously reserved (to avoid double reduction)
        if (product.reservation) {
          console.log(`Reducing stock for variation ${product.product_variation_id}: ${product.quantity}`);
          
          // Reduce stock
          const { error: stockError } = await supabase.rpc('update_stock_quantity', {
            p_variation_id: product.product_variation_id,
            p_warehouse_id: product.warehouses_id || warehouseId,
            p_quantity: -product.quantity, // Negative to reduce
          });

          if (stockError) {
            // If RPC doesn't exist, use direct update
            await supabase
              .from('product_stock')
              .update({ 
                stock: supabase.sql`stock - ${product.quantity}` 
              })
              .eq('product_variation_id', product.product_variation_id)
              .eq('warehouse_id', product.warehouses_id || warehouseId);
          }
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
