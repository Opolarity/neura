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
      reason,
      out_warehouse_id,
      in_warehouse_id,
      items, // Array of { product_variation_id, quantity, stock_type_code }
      module_code,
      status_code,
      situation_code,
      movement_type_code
    } = payload

    if (!reason || !out_warehouse_id || !in_warehouse_id || !items || !Array.isArray(items) || items.length === 0 ||
      !module_code || !status_code || !situation_code || !movement_type_code) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields or empty items list' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Helper to resolve ID by code
    const resolveId = async (table: string, code: string, extraFilters: Record<string, any> = {}) => {
      let query = supabase
        .from(table)
        .select('id')
        .eq('code', code)

      for (const [key, value] of Object.entries(extraFilters)) {
        query = query.eq(key, value)
      }

      const { data, error } = await query.maybeSingle()

      if (error) {
        // Fallback: if multiple rows, just take the first one instead of crashing
        const { data: list, error: listError } = await query.limit(1)
        if (listError) throw listError
        return list?.[0]?.id
      }
      return data?.id
    }

    // 2. Resolve Module, Status, Situation, and Movement Type IDs
    const moduleId = await resolveId('modules', module_code)

    // Situation belongs to module; resolve it first, then get its status_id
    const situationId = await resolveId('situations', situation_code, { module_id: moduleId })
    const movementTypeId = await resolveId('types', movement_type_code)

    // Resolve statusId from the situation's own status_id (statuses table has no module_id)
    let statusId: number | null = null
    if (situationId) {
      const { data: sitRow } = await supabase
        .from('situations')
        .select('status_id')
        .eq('id', situationId)
        .single()
      statusId = sitRow?.status_id ?? null
    }

    if (!moduleId || !statusId || !situationId || !movementTypeId) {
      throw new Error(`Could not resolve codes: module(${module_code}:${moduleId}), status(${status_code}:${statusId}), situation(${situation_code}:${situationId}), movement_type(${movement_type_code}:${movementTypeId})`)
    }

    // 2.5 Resolve the user's warehouse from their profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('warehouse_id')
      .eq('UID', created_by)
      .single()

    if (profileError || !profileData) {
      throw new Error(`Could not resolve user profile warehouse: ${profileError?.message}`)
    }

    const userWarehouseId = profileData.warehouse_id

    // 3. Create Stock Movement Request
    const { data: requestData, error: requestError } = await supabase
      .from('stock_movement_requests')
      .insert([{
        created_by,
        out_warehouse_id,
        in_warehouse_id
      }])
      .select()
      .single()

    if (requestError) throw requestError

    // 4. Build notes with product listing
    const noteLines = items.map((item: any) => {
      const name = item.product_name || `Variación ${item.product_variation_id}`
      const variation = item.variation_label ? ` (${item.variation_label})` : ''
      return `${name}${variation}: ${item.quantity}`
    }).join('\n')

    // 5. Create Request Situation History with notes (warehouse_id = user's profile warehouse)
    const { error: sitError } = await supabase
      .from('stock_movement_request_situations')
      .insert([{
        stock_movement_request_id: requestData.id,
        module_id: moduleId,
        status_id: statusId,
        situation_id: situationId,
        warehouse_id: userWarehouseId,
        message: reason,
        notes: noteLines,
        last_row: true,
        created_by
      }])

    if (sitError) throw sitError

    // 6. Create Stock Movements (IN/OUT) and Link
    for (const item of items) {
      const { product_variation_id, quantity, stock_type_code } = item

      if (!product_variation_id || !quantity || !stock_type_code) continue;

      const stockTypeId = await resolveId('types', stock_type_code)
      if (!stockTypeId) throw new Error(`Invalid stock type code: ${stock_type_code}`)

      // Insert OUT (Source)
      const { data: outMov, error: outErr } = await supabase
        .from('stock_movements')
        .insert([{
          product_variation_id,
          quantity: -Math.abs(quantity),
          created_by,
          movement_type: movementTypeId,
          warehouse_id: out_warehouse_id,
          completed: false,
          stock_type_id: stockTypeId,
          is_active: false
        }])
        .select()
        .single()

      if (outErr) throw outErr

      // Insert IN (Destination)
      const { data: inMov, error: inErr } = await supabase
        .from('stock_movements')
        .insert([{
          product_variation_id,
          quantity: Math.abs(quantity),
          created_by,
          movement_type: movementTypeId,
          warehouse_id: in_warehouse_id,
          completed: false,
          stock_type_id: stockTypeId,
          is_active: false,
          vinculated_movement_id: outMov.id
        }])
        .select()
        .single()

      if (inErr) throw inErr

      // Mutual linking of movements
      await supabase.from('stock_movements').update({ vinculated_movement_id: inMov.id }).eq('id', outMov.id)

      // Link request to movements using the mandatory linked_stock_movement_requests table
      const { error: linkErr } = await supabase.from('linked_stock_movement_requests').insert([
        { stock_movement_request_id: requestData.id, stock_movement_id: outMov.id, approved: null },
        { stock_movement_request_id: requestData.id, stock_movement_id: inMov.id, approved: null }
      ])

      if (linkErr) throw linkErr
    }

    return new Response(
      JSON.stringify({ success: true, request: requestData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})