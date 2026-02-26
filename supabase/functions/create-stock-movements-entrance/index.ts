import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!; 

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Authenticate user
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
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const created_by = user.id

    // Parse request body
    const payloadData = await req.json()

    // Normalize input to array format
    let items = []
    
    if (Array.isArray(payloadData)) {
      // Case 1: Already an array
      items = payloadData
    } else if (payloadData.product_variation_id || payloadData.variation_id) {
      // Case 2: Single object
      items = [payloadData]
    } else if (payloadData.items && Array.isArray(payloadData.items)) {
      // Case 3: Batch format with 'items' array
      items = payloadData.items
    } else if (payloadData.product_variation_ids && payloadData.quantities) {
      // Case 4: Parallel arrays format
      const ids = Array.isArray(payloadData.product_variation_ids) 
        ? payloadData.product_variation_ids 
        : [payloadData.product_variation_ids]
      const qtys = Array.isArray(payloadData.quantities) 
        ? payloadData.quantities 
        : [payloadData.quantities]
      
      if (ids.length !== qtys.length) {
        return new Response(
          JSON.stringify({ 
            error: 'product_variation_ids and quantities arrays must have the same length' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      
      // Extract common fields
      const stock_type_id = payloadData.stock_type_id
      const movements_type_id = payloadData.movements_type_id || payloadData.movement_type_id
      const movement_type_code = payloadData.movement_type_code
      const warehouse_id = payloadData.warehouse_id
      
      items = ids.map((id, index) => ({
        product_variation_id: id,
        quantity: qtys[index],
        stock_type_id,
        movements_type_id,
        movement_type_code,
        warehouse_id
      }))
    }

    if (items.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No items provided. Use single object, array, items array, or parallel arrays format' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get user's default warehouse
    const { data: profile } = await supabase
      .from('profiles')
      .select('warehouse_id')
      .eq('UID', created_by)
      .maybeSingle()

    const userWarehouseId = profile?.warehouse_id || null

    // Call stored procedure
    const { data, error } = await supabase.rpc('sp_create_stock_movements_entrance', {
      p_items: items,
      p_created_by: created_by,
      p_user_warehouse_id: userWarehouseId
    })

    if (error) {
      console.error('RPC Error:', error)
      return new Response(
        JSON.stringify({ error: 'Database error', details: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Handle single item failure for cleaner error response
    if (items.length === 1 && data.errors && data.errors.length === 1) {
      return new Response(
        JSON.stringify({ error: data.errors[0].error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Determine HTTP status code
    const statusCode = data.success ? 200 : data.partial_success ? 207 : 400

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: statusCode 
      }
    )

  } catch (error) {
    console.error('Function Error:', error.message)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})