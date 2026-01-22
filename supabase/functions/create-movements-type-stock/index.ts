
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

    // 1. Authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const created_by = user.id

    const payload = await req.json()
    const {
      product_variation_id,
      quantity,
      origin_stock_type_code,
      destination_stock_type_code,
      movement_type_code // Changed: Single movement type code
    } = payload

    let { warehouse_id } = payload

    // 2. Validate Inputs
    if (!product_variation_id || !quantity || quantity <= 0 ||
      !origin_stock_type_code || !destination_stock_type_code ||
      !movement_type_code) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields or invalid quantity' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }


    // 3. Resolve Warehouse if missing
    if (!warehouse_id) {
      // Try looking up profile by Auth User ID first
      const { data: profile } = await supabase
        .from('profiles')
        .select('warehouse_id')
        .eq('UID', created_by)
        .single()

      if (profile) warehouse_id = profile.warehouse_id

      if (!warehouse_id) {
        return new Response(
          JSON.stringify({ error: 'Warehouse could not be resolved for user' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    }

    // Helper to resolve type ID by code
    const resolveTypeId = async (code: string, table = 'types') => {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .eq('code', code)
        .single()

      if (error || !data) return null
      return data.id
    }

    // 4. Resolve Codes to IDs
    const origin_stock_type_id = await resolveTypeId(origin_stock_type_code, 'types')
    const destination_stock_type_id = await resolveTypeId(destination_stock_type_code, 'types')


    let movement_type_id = await resolveTypeId(movement_type_code, 'types')
    // Fallback search if needed, but per request usually in 'types' or specific table. 
    if (!movement_type_id) movement_type_id = await resolveTypeId(movement_type_code, 'movement_types')
    if (!movement_type_id) movement_type_id = await resolveTypeId(movement_type_code, 'types')


    if (!origin_stock_type_id) throw new Error(`Invalid origin stock type code: ${origin_stock_type_code}`)
    if (!destination_stock_type_id) throw new Error(`Invalid destination stock type code: ${destination_stock_type_code}`)
    if (!movement_type_id) throw new Error(`Invalid movement type code: ${movement_type_code}`)


    // 5. Check Source Stock Availability
    const { data: sourceStock, error: sourceStockError } = await supabase
      .from('product_stock')
      .select('*')
      .eq('product_variation_id', product_variation_id)
      .eq('warehouse_id', warehouse_id)
      .eq('stock_type_id', origin_stock_type_id)
      .maybeSingle()

    if (sourceStockError) throw sourceStockError

    if (!sourceStock || sourceStock.stock < quantity) {
      return new Response(
        JSON.stringify({ error: `Insufficient stock in origin type ${origin_stock_type_code}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 6. Record Movements
    // The webhook 'update-stock-complete' will handle inventory updates automatically
    // for both OUT and IN movements when 'completed' is set to true.

    // 7. Record Movements (Linked)

    // OUT Movement (Source) - Negative Quantity
    const { data: outMov, error: outMoveError } = await supabase
      .from('stock_movements')
      .insert([{
        product_variation_id,
        quantity: -Math.abs(quantity), // Ensure negative
        created_by,
        movement_type: movement_type_id,
        warehouse_id,
        stock_type_id: origin_stock_type_id,
        is_active: true,
        completed: true
      }])
      .select()
      .single()

    if (outMoveError) throw outMoveError

    // IN Movement (Destination) - Positive Quantity
    const { data: inMov, error: inMoveError } = await supabase
      .from('stock_movements')
      .insert([{
        product_variation_id,
        quantity: Math.abs(quantity), // Ensure positive
        created_by,
        movement_type: movement_type_id,
        warehouse_id,
        stock_type_id: destination_stock_type_id,
        is_active: true,
        completed: true,
        vinculated_movement_id: outMov.id
      }])
      .select()
      .single()

    if (inMoveError) throw inMoveError

    // Mutual linking: Update OUT movement with IN movement ID
    const { error: updateLinkError } = await supabase
      .from('stock_movements')
      .update({ vinculated_movement_id: inMov.id })
      .eq('id', outMov.id)

    if (updateLinkError) throw updateLinkError

    return new Response(
      JSON.stringify({ success: true, message: 'Stock moved successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})