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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { stockUpdates, defectsUpdates } = await req.json();

    console.log('Updating stock:', stockUpdates);
    console.log('Updating defects:', defectsUpdates);

    // Validate that at least one update type is provided
    const hasStockUpdates = stockUpdates && Array.isArray(stockUpdates) && stockUpdates.length > 0;
    const hasDefectsUpdates = defectsUpdates && Array.isArray(defectsUpdates) && defectsUpdates.length > 0;

    if (!hasStockUpdates && !hasDefectsUpdates) {
      throw new Error('No stock or defects updates provided');
    }

    // Get the module for stock movements
    const { data: module } = await supabase
      .from('modules')
      .select('id')
      .eq('code', 'STM')
      .single();

    if (!module) {
      throw new Error('Module STM not found');
    }

    // Get the movement type for manual adjustments
    const { data: movementType } = await supabase
      .from('types')
      .select('id')
      .eq('code', 'MAN')
      .eq('module_id', module.id)
      .single();

    if (!movementType) {
      throw new Error('Movement type MAN not found');
    }

    // Update or insert stock for each variation/warehouse combination
    if (hasStockUpdates) {
      for (const update of stockUpdates) {
        const { variation_id, warehouse_id, stock } = update;

        // Check if stock record exists and get current stock
        const { data: existingStock } = await supabase
          .from('product_stock')
          .select('id, stock')
          .eq('product_variation_id', variation_id)
          .eq('warehouse_id', warehouse_id)
          .single();

        const newStock = parseInt(stock);
        const oldStock = existingStock ? existingStock.stock : 0;
        const difference = newStock - oldStock;

        if (existingStock) {
          // Update existing stock
          const { error: updateError } = await supabase
            .from('product_stock')
            .update({ stock: newStock })
            .eq('product_variation_id', variation_id)
            .eq('warehouse_id', warehouse_id);

          if (updateError) throw updateError;
        } else {
          // Insert new stock record
          const { error: insertError } = await supabase
            .from('product_stock')
            .insert({
              product_variation_id: variation_id,
              warehouse_id: warehouse_id,
              stock: newStock,
            });

          if (insertError) throw insertError;
        }

        // Create stock movement record if there's a difference
        if (difference !== 0) {
          const { error: movementError } = await supabase
            .from('stock_movements')
            .insert({
              product_variation_id: variation_id,
              quantity: difference,
              movement_type: movementType.id,
              created_by: user.id,
              out_warehouse_id: warehouse_id,
              in_warehouse_id: warehouse_id,
              defect_stock: false,
            });

          if (movementError) throw movementError;
        }
      }
      console.log('Stock updated successfully');
    }

    // Update defects for warehouse_id 1 if provided
    if (hasDefectsUpdates) {
      for (const update of defectsUpdates) {
        const { variation_id, warehouse_id, defects } = update;

        // Only update defects for warehouse_id 1
        if (warehouse_id === 1) {
          const { error: defectsError } = await supabase
            .from('product_stock')
            .update({ defects: parseInt(defects) })
            .eq('product_variation_id', variation_id)
            .eq('warehouse_id', 1);

          if (defectsError) throw defectsError;
        }
      }
      console.log('Defects updated successfully');
    }

    return new Response(JSON.stringify({ success: true, message: 'Stock actualizado correctamente' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
