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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!; 

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });
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

    // Status and Situation are context-dependent (belong to module)
    const statusId = await resolveId('statuses', status_code, { module_id: moduleId })
    const situationId = await resolveId('situations', situation_code, { module_id: moduleId })
    const movementTypeId = await resolveId('types', movement_type_code)

    if (!moduleId || !statusId || !situationId || !movementTypeId) {
      throw new Error(`Could not resolve codes: module(${module_code}:${moduleId}), status(${status_code}:${statusId}), situation(${situation_code}:${situationId}), movement_type(${movement_type_code}:${movementTypeId})`)
    }

    // 3. Create Stock Movement Request
    const { data: requestData, error: requestError } = await supabase
      .from('stock_movement_requests')
      .insert([{
        reason,
        module_id: moduleId,
        status_id: statusId,
        situation_id: situationId,
        created_by,
        out_warehouse_id,
        in_warehouse_id
      }])
      .select()
      .single()

    if (requestError) throw requestError

    // 4. Create Request Situation History
    const { error: sitError } = await supabase
      .from('stock_movement_request_situations')
      .insert([{
        stock_movement_request_id: requestData.id,
        module_id: moduleId,
        status_id: statusId,
        situation_id: situationId,
        message: 'Request Created',
        last_row: true,
        created_by
      }])

    if (sitError) throw sitError

    // 5. Create Stock Movements (IN/OUT) and Link
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
        { stock_movement_request_id: requestData.id, stock_movement_id: outMov.id, approved: false },
        { stock_movement_request_id: requestData.id, stock_movement_id: inMov.id, approved: false }
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