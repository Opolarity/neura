
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

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const created_by = user.id
    console.log('Authenticated user:', created_by);

    const payloadData = await req.json()
    console.log('Incoming Payload:', JSON.stringify(payloadData))

    // Normalize: ensure we always work with an array of items for internal processing
    const isArrayInput = Array.isArray(payloadData)
    const items = isArrayInput ? payloadData : [payloadData]
    console.log(`Processing ${items.length} items (Input was Array: ${isArrayInput})`)

    if (items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Empty items list provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Resolve User Default Warehouse (as fallback)
    const { data: profile } = await supabase
      .from('profiles')
      .select('warehouse_id')
      .eq('UID', created_by)
      .single()

    const userWarehouseId = profile?.warehouse_id
    console.log('User Default Warehouse:', userWarehouseId)

    // Helper to resolve type ID by code
    const resolveTypeId = async (code: string) => {
      const { data, error } = await supabase
        .from('types')
        .select('id')
        .eq('code', code)
        .maybeSingle()

      if (error || !data) return null
      return data.id
    }

    const results = []
    const errors = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      console.log(`Validating Item ${i}:`, JSON.stringify(item))

      // Accept both camelCase and snake_case for flexibility if needed, 
      // but predominantly using the documented fields.
      const product_variation_id = item.product_variation_id || item.variation_id
      const quantity = item.quantity
      const stock_type_id_input = item.stock_type_id
      const movements_type_id_input = item.movements_type_id || item.movement_type_id
      const movement_type_code = item.movement_type_code
      const itemWarehouseId = item.warehouse_id

      const finalWarehouseId = itemWarehouseId || userWarehouseId

      // Basic Validation per Item
      const missingFields = []
      if (!product_variation_id) missingFields.push('product_variation_id')
      if (quantity === undefined || quantity === null) missingFields.push('quantity')
      if (!stock_type_id_input) missingFields.push('stock_type_id')
      if (!movements_type_id_input) missingFields.push('movements_type_id')
      if (!movement_type_code) missingFields.push('movement_type_code')
      if (!finalWarehouseId) missingFields.push('warehouse_id')

      if (missingFields.length > 0) {
        const errorMsg = `Missing required fields: ${missingFields.join(', ')}`
        console.log(`Item ${i} Validation Failed:`, errorMsg)
        errors.push({ item, error: errorMsg })
        continue
      }

      // Resolve IDs
      const stock_type_id = stock_type_id_input
      let movements_type_id = movements_type_id_input

      // As fallback, if movements_type_id is missing but code is present
      if (!movements_type_id && movement_type_code) {
        movements_type_id = await resolveTypeId(movement_type_code)
      }

      if (!stock_type_id || !movements_type_id) {
        const errorMsg = `Could not resolve IDs: stock(${stock_type_id_input}), movement(${movements_type_id_input || movement_type_code})`
        console.log(`Item ${i} ID Resolution Failed:`, errorMsg)
        errors.push({
          item,
          error: errorMsg
        })
        continue
      }

      // Record Movement
      // The webhook 'update-stock-complete' will handle inventory updates automatically
      // when 'completed' is set to true.
      const { data: movement, error: movementError } = await supabase
        .from('stock_movements')
        .insert([{
          product_variation_id,
          quantity,
          created_by,
          movement_type: movements_type_id,
          warehouse_id: finalWarehouseId,
          stock_type_id,
          is_active: true,
          completed: true
        }])
        .select()
        .single()

      if (movementError) {
        console.log(`Item ${i} Database Error:`, movementError.message)
        errors.push({ item, error: movementError.message })
      } else {
        console.log(`Item ${i} Processed Successfully:`, movement.id)

        // Manual Stock Update (since webhook is not used)
        const { data: existingStock, error: fetchError } = await supabase
          .from('product_stock')
          .select('*')
          .eq('product_variation_id', product_variation_id)
          .eq('warehouse_id', finalWarehouseId)
          .eq('stock_type_id', stock_type_id)
          .maybeSingle()

        if (fetchError) {
          console.error(`Item ${i} Error fetching stock:`, fetchError.message)
        } else if (existingStock) {
          let newStockTotal;
          if (movement_type_code === 'MAN') {
            console.log(`Item ${i} (MAN): Replaced stock ${existingStock.stock} with ${quantity}`)
            newStockTotal = Number(quantity)
          } else if (movement_type_code === 'MER' || movement_type_code === 'ENT') {
            newStockTotal = Number(existingStock.stock) + Number(quantity)
            console.log(`Item ${i} (${movement_type_code}): Added ${quantity} to ${existingStock.stock} = ${newStockTotal}`)
          } else {
            // Default to addition for any other code
            newStockTotal = Number(existingStock.stock) + Number(quantity)
            console.log(`Item ${i} (${movement_type_code}): Default addition ${quantity} to ${existingStock.stock} = ${newStockTotal}`)
          }

          const { error: updateError } = await supabase
            .from('product_stock')
            .update({ stock: newStockTotal })
            .eq('id', existingStock.id)
          if (updateError) console.error(`Item ${i} Error updating stock:`, updateError.message)
        } else {
          // Only create if positive
          if (Number(quantity) > 0) {
            console.log(`Item ${i}: Creating new stock record with ${quantity}`)
            const { error: insertError } = await supabase
              .from('product_stock')
              .insert([{
                product_variation_id,
                warehouse_id: finalWarehouseId,
                stock: quantity,
                defects: 0,
                stock_type_id
              }])
            if (insertError) console.error(`Item ${i} Error creating stock:`, insertError.message)
          }
        }

        results.push(movement)
      }
    }

    // Prepare response
    const hasSuccess = results.length > 0

    // If only one item was sent and it failed, return a flat error for easier reading
    if (items.length === 1 && errors.length === 1) {
      return new Response(
        JSON.stringify({ error: errors[0].error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    return new Response(
      JSON.stringify({
        success: hasSuccess,
        processed: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: hasSuccess ? 200 : 400 }
    )

  } catch (error: any) {
    console.error('Fatal Function Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})