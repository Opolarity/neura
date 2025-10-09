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

    const { stockUpdates } = await req.json();

    console.log('Updating stock:', stockUpdates);

    if (!stockUpdates || !Array.isArray(stockUpdates) || stockUpdates.length === 0) {
      throw new Error('Invalid stock updates data');
    }

    // Update or insert stock for each variation/warehouse combination
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
