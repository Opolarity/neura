
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

    const payload = await req.json()

    // Check if it's a request workflow
    const isRequest = payload.reason && payload.out_warehouse_id && payload.in_warehouse_id

    if (isRequest) {
      // --- REQUEST WORKFLOW ---
      const {
        reason,
        out_warehouse_id,
        in_warehouse_id,
        request_situation_id,
        created_by,
        product_variation_id,
        quantity,
        stock_type_id
      } = payload

      // 1. Create Stock Movement Request
      const { data: requestData, error: requestError } = await supabase
        .from('stock_movement_requests')
        .insert([{
          reason,
          situation_id: request_situation_id, // Assuming this maps to situation_id
          created_by,
          out_warehouse_id,
          in_warehouse_id
        }])
        .select()
        .single()

      if (requestError) throw requestError

      // 2. Create Inactive Stock Movement
      const { data: movementData, error: movementError } = await supabase
        .from('stock_movements')
        .insert([{
          product_variation_id,
          quantity,
          created_by,
          movements_type: 11, // Fixed type for requests
          warehouse_id: in_warehouse_id, // Applies to the IN warehouse
          completed: false, // Requests start as incomplete
          stock_type_id,
          is_active: false // Inactive until approved
        }])
        .select()
        .single()

      if (movementError) throw movementError

      // 3. Link Request and Movement
      const { error: linkError } = await supabase
        .from('linked_stock_movement_requests')
        .insert([{
          stock_movement_request_id: requestData.id,
          stock_movement_id: movementData.id
        }])

      if (linkError) throw linkError

      return new Response(
        JSON.stringify({ success: true, request: requestData, movement: movementData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )

    } else {
      // --- DIRECT MOVEMENT WORKFLOW ---
      const {
        product_variation_id,
        quantity,
        created_by,
        movements_type,
        warehouse_id,
        completed,
        stock_type_id,
        vinculated_movement_id
      } = payload

      // Validation
      if (!product_variation_id || quantity === undefined || !movements_type || !warehouse_id || !stock_type_id) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // 1. Insert into stock_movements
      const { data: movement, error: movementError } = await supabase
        .from('stock_movements')
        .insert([
          {
            product_variation_id,
            quantity,
            created_by,
            movements_type,
            warehouse_id,
            completed,
            stock_type_id,
            vinculated_movement_id: vinculated_movement_id || null, // Handle optional field
            is_active: true
          }
        ])
        .select()
        .single()

      if (movementError) throw movementError

      // 2. Update product_stock if completed
      if (completed) {
        // Check if stock record exists
        const { data: existingStock, error: stockError } = await supabase
          .from('product_stock')
          .select('*')
          .eq('product_variation_id', product_variation_id)
          .eq('warehouses_id', warehouse_id)
          .eq('stock_type_id', stock_type_id)
          .maybeSingle()

        if (stockError) throw stockError

        if (existingStock) {
          // Update existing stock
          const newStock = existingStock.stock + quantity
          const { error: updateError } = await supabase
            .from('product_stock')
            .update({ stock: newStock })
            .eq('id', existingStock.id)

          if (updateError) throw updateError
        } else {
          // Create new stock record
          const { error: insertError } = await supabase
            .from('product_stock')
            .insert([
              {
                product_variation_id,
                warehouses_id: warehouse_id,
                stock: quantity,
                defects: 0,
                stock_type_id
              }
            ])

          if (insertError) throw insertError
        }
      }

      return new Response(
        JSON.stringify(movement),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})