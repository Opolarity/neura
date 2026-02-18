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

    const { stockUpdates } = await req.json();

    if (!stockUpdates || !Array.isArray(stockUpdates) || stockUpdates.length === 0) {
      throw new Error('No stock updates provided');
    }

    console.log('Processing dynamic stock updates:', stockUpdates);

    // Obtener información del módulo y tipo para la auditoría (Ajuste Manual)
    const { data: module } = await supabase
      .from('modules')
      .select('id')
      .eq('code', 'STM')
      .single();

    if (!module) throw new Error('Module STM not found');

    const { data: movementType } = await supabase
      .from('types')
      .select('id')
      .eq('code', 'MAN')
      .eq('module_id', module.id)
      .single();

    if (!movementType) throw new Error('Movement type MAN not found');

    // Procesar cada actualización
    for (const update of stockUpdates) {
      const { variation_id, warehouse_id, stock, stock_type_id } = update;

      if (!variation_id || !warehouse_id || !stock_type_id) {
        console.warn('Missing required fields in update:', update);
        continue;
      }

      // Buscar stock existente para este tipo específico en este almacén
      const { data: existingRecord } = await supabase
        .from('product_stock')
        .select('id, stock')
        .eq('product_variation_id', variation_id)
        .eq('warehouse_id', warehouse_id)
        .eq('stock_type_id', stock_type_id)
        .single();

      const newStockValue = parseInt(stock);
      const oldStockValue = existingRecord ? existingRecord.stock : 0;
      const difference = newStockValue - oldStockValue;

      // Upsert del registro de stock
      if (existingRecord) {
        const { error: updateError } = await supabase
          .from('product_stock')
          .update({ stock: newStockValue })
          .eq('id', existingRecord.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('product_stock')
          .insert({
            product_variation_id: variation_id,
            warehouse_id: warehouse_id,
            stock_type_id: stock_type_id,
            stock: newStockValue,
          });

        if (insertError) throw insertError;
      }

      if (difference !== 0) {
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert({
            product_variation_id: variation_id,
            quantity: difference,
            movement_type: movementType.id,
            completed: true,
            created_by: user.id,
            warehouse_id: warehouse_id,
            stock_type_id: stock_type_id
          });

        if (movementError) throw movementError;
      }
    }

    console.log('Dynamic stock updates completed successfully');

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
