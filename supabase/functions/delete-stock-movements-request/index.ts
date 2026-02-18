
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { requestId, approved } = await req.json() // approved is boolean

    if (!requestId) {
      return new Response(
        JSON.stringify({ error: 'Missing requestId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 1. Get linked movements
    const { data: linkedRequests, error: linkError } = await supabase
      .from('linked_stock_movement_requests')
      .select('stock_movement_id')
      .eq('stock_movement_request_id', requestId)

    if (linkError) throw linkError

    const movementIds = linkedRequests?.map((lr: any) => lr.stock_movement_id) || []

    if (movementIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No linked movements found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // 2. Handle Approval/Disapproval
    const isActive = approved === true

    // Update Stock Movements Status
    const { error: updateMovementsError } = await supabase
      .from('stock_movements')
      .update({ is_active: isActive })
      .in('id', movementIds)

    if (updateMovementsError) throw updateMovementsError

    // Update Linked Request Status
    const { error: updateLinkError } = await supabase
      .from('linked_stock_movement_requests')
      .update({ approved: isActive })
      .eq('stock_movement_request_id', requestId)

    if (updateLinkError) throw updateLinkError

    // 3. Update Inventory (ONLY IF APPROVED)
    if (isActive) {
      // Fetch movement details to know what to update
      const { data: movementsToProcess, error: fetchError } = await supabase
        .from('stock_movements')
        .select('*')
        .in('id', movementIds)

      if (fetchError) throw fetchError

      // Process each movement
      for (const movement of movementsToProcess) {
        const { product_variation_id, warehouse_id, stock_type_id, quantity } = movement

        // Check for existing stock
        const { data: existingStock, error: stockError } = await supabase
          .from('product_stock')
          .select('*')
          .eq('product_variation_id', product_variation_id)
          .eq('warehouses_id', warehouse_id)
          .eq('stock_type_id', stock_type_id)
          .maybeSingle()

        if (stockError) throw stockError

        if (existingStock) {
          const newStock = existingStock.stock + quantity
          const { error: updateStockError } = await supabase
            .from('product_stock')
            .update({ stock: newStock })
            .eq('id', existingStock.id)

          if (updateStockError) throw updateStockError
        } else {
          const { error: insertStockError } = await supabase
            .from('product_stock')
            .insert([{
              product_variation_id,
              warehouses_id: warehouse_id,
              stock: quantity,
              defects: 0,
              stock_type_id
            }])

          if (insertStockError) throw insertStockError
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, deactivatedCount: movementIds.length, approved: isActive }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
