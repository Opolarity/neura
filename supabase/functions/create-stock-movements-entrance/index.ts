
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

    const payload = await req.json()
    const {
      product_variation_id,
      quantity,
      stock_type_code,
      movement_type_code,
    } = payload

    let { warehouse_id } = payload

    // Basic Validation
    if (!product_variation_id || !quantity || !stock_type_code || !movement_type_code) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 1. Resolve Warehouse if missing
    if (!warehouse_id) {
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
    const resolveTypeId = async (code: string) => {
      const { data, error } = await supabase
        .from('types')
        .select('id')
        .eq('code', code)
        .single()

      if (error || !data) return null
      return data.id
    }

    // 2. Resolve IDs
    const stock_type_id = await resolveTypeId(stock_type_code)
    const movements_type_id = await resolveTypeId(movement_type_code)

    if (!stock_type_id) {
      return new Response(
        JSON.stringify({ error: `Invalid stock type code: ${stock_type_code}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!movements_type_id) {
      return new Response(
        JSON.stringify({ error: `Invalid movement type code: ${movement_type_code}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 3. Update Inventory (Increment/Create)
    const { data: existingStock, error: stockCheckError } = await supabase
      .from('product_stock')
      .select('*')
      .eq('product_variation_id', product_variation_id)
      .eq('warehouse_id', warehouse_id)
      .eq('stock_type_id', stock_type_id)
      .maybeSingle()

    if (stockCheckError) throw stockCheckError

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
      const { error: insertStockError } = await supabase
        .from('product_stock')
        .insert([{
          product_variation_id,
          warehouse_id: warehouse_id,
          stock: quantity,
          defects: 0,
          stock_type_id
        }])

      if (insertStockError) throw insertStockError
    }

    // 4. Record Movement
    const { data: movement, error: movementError } = await supabase
      .from('stock_movements')
      .insert([{
        product_variation_id,
        quantity,
        created_by,
        movement_type: movements_type_id,
        warehouse_id,
        stock_type_id,
        is_active: true,
        completed: true
      }])
      .select()
      .single()

    if (movementError) throw movementError

    return new Response(
      JSON.stringify({ success: true, movement }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})