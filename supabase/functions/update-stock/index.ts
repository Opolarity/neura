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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { stockUpdates, defectsUpdates } = await req.json();

    console.log('Updating stock:', stockUpdates);
    console.log('Updating defects:', defectsUpdates);

    // Validate that at least one update type is provided
    const hasStockUpdates = stockUpdates && Array.isArray(stockUpdates) && stockUpdates.length > 0;
    const hasDefectsUpdates = defectsUpdates && Array.isArray(defectsUpdates) && defectsUpdates.length > 0;

    if (!hasStockUpdates && !hasDefectsUpdates) {
      throw new Error('No stock or defects updates provided');
    }

    // Update or insert stock for each variation/warehouse combination
    if (hasStockUpdates) {
      for (const update of stockUpdates) {
        const { variation_id, warehouse_id, stock } = update;

        // Check if stock record exists
        const { data: existingStock } = await supabase
          .from('product_stock')
          .select('id')
          .eq('product_variation_id', variation_id)
          .eq('warehouse_id', warehouse_id)
          .single();

        if (existingStock) {
          // Update existing stock
          const { error: updateError } = await supabase
            .from('product_stock')
            .update({ stock: parseInt(stock) })
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
              stock: parseInt(stock),
            });

          if (insertError) throw insertError;
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
