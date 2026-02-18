import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Use anon key with user's JWT so auth.uid() works properly
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: { headers: { Authorization: authHeader } }
    });

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

    // Get the situation details including code
    const { data: situation, error: situationError } = await supabase
      .from('situations')
      .select('id, status_id, code, statuses!inner(code)')
      .eq('id', situationId)
      .single();

    if (situationError || !situation) {
      throw new Error('Situation not found');
    }

    const situationCode = situation.code;
    const statusCode = (situation.statuses as { code: string })?.code;
    console.log('Situation code:', situationCode, 'Status code:', statusCode);

    // Determine stock movement flags based on situation code
    let stockIsActive = true;
    let stockCompleted = true;

    switch (situationCode) {
      case 'PHY':
        stockIsActive = true;
        stockCompleted = true;
        break;
      case 'HDN':
        stockIsActive = false;
        stockCompleted = false;
        break;
      case 'VIR':
        stockIsActive = true;
        stockCompleted = false;
        break;
      default:
        stockIsActive = true;
        stockCompleted = true;
    }

    // Get previous situation for this order
    const { data: previousSituation } = await supabase
      .from('order_situations')
      .select('situation_id, situations!inner(code, statuses!inner(code))')
      .eq('order_id', orderId)
      .eq('last_row', true)
      .maybeSingle();

    const previousSituationCode = (previousSituation?.situations as { code: string; statuses: { code: string } } | null)?.code;
    const previousStatusCode = (previousSituation?.situations as { code: string; statuses: { code: string } } | null)?.statuses?.code;
    console.log('Previous situation code:', previousSituationCode, 'Previous status code:', previousStatusCode);

    // Mark previous record as not last_row
    if (previousSituation) {
      await supabase
        .from('order_situations')
        .update({ last_row: false })
        .eq('order_id', orderId)
        .eq('last_row', true);
    }

    // Insert new situation record - auth.uid() now works because we use user's JWT
    const { error: insertError } = await supabase
      .from('order_situations')
      .insert({
        order_id: orderId,
        situation_id: situationId,
        status_id: situation.status_id,
        last_row: true
      });

    if (insertError) {
      console.error('Error inserting order situation:', insertError);
      
      // Rollback: restore previous last_row if insert fails
      if (previousSituation) {
        await supabase
          .from('order_situations')
          .update({ last_row: true })
          .eq('order_id', orderId)
          .eq('situation_id', previousSituation.situation_id);
      }
      
      throw new Error(insertError.message);
    }

    // Get order products with their stock movements
    const { data: orderProducts, error: productsError } = await supabase
      .from('order_products')
      .select('id, product_variation_id, quantity, warehouses_id, stock_movement_id')
      .eq('order_id', orderId);

    if (productsError) {
      console.error('Error fetching order products:', productsError);
      throw new Error(productsError.message);
    }

    console.log('Order products:', orderProducts);

    // Update stock movements is_active and completed based on new situation code
    for (const product of orderProducts || []) {
      if (!product.stock_movement_id) continue;

      // Get current stock movement state
      const { data: currentMovement } = await supabase
        .from('stock_movements')
        .select('is_active, completed, stock_type_id')
        .eq('id', product.stock_movement_id)
        .single();

      if (!currentMovement) continue;

      const wasCompleted = currentMovement.completed;
      const stockTypeId = currentMovement.stock_type_id;

      // Update stock movement with new is_active/completed values
      await supabase
        .from('stock_movements')
        .update({
          is_active: stockIsActive,
          completed: stockCompleted
        })
        .eq('id', product.stock_movement_id);

      // Handle stock adjustments based on completed state transitions
      if (!wasCompleted && stockCompleted) {
        console.log(`Reducing stock for variation ${product.product_variation_id}`);
        
        const { data: currentStock } = await supabase
          .from('product_stock')
          .select('id, stock')
          .eq('product_variation_id', product.product_variation_id)
          .eq('warehouse_id', product.warehouses_id)
          .eq('stock_type_id', stockTypeId)
          .single();

        if (currentStock) {
          await supabase
            .from('product_stock')
            .update({ stock: currentStock.stock - product.quantity })
            .eq('id', currentStock.id);
          
          console.log(`Stock reduced: ${currentStock.stock} -> ${currentStock.stock - product.quantity}`);
        }
      } else if (wasCompleted && !stockCompleted) {
        console.log(`Restoring stock for variation ${product.product_variation_id}`);
        
        const { data: currentStock } = await supabase
          .from('product_stock')
          .select('id, stock')
          .eq('product_variation_id', product.product_variation_id)
          .eq('warehouse_id', product.warehouses_id)
          .eq('stock_type_id', stockTypeId)
          .single();

        if (currentStock) {
          await supabase
            .from('product_stock')
            .update({ stock: currentStock.stock + product.quantity })
            .eq('id', currentStock.id);
          
          console.log(`Stock restored: ${currentStock.stock} -> ${currentStock.stock + product.quantity}`);
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
        status: 200
      }
    );
  } catch (error) {
    console.error('Error updating order situation:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
