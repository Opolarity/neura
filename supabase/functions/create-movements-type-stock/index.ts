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
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) throw new Error('Unauthorized')

    const body = await req.json()
    const { warehouse_id, products } = body

    if (!products || !Array.isArray(products) || products.length === 0) {
      throw new Error('Products array is required')
    }

    let finalWarehouseId = warehouse_id

    if (!finalWarehouseId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('warehouse_id')
        .eq('UID', user.id)
        .single()

      finalWarehouseId = profile?.warehouse_id
    }

    if (!finalWarehouseId) throw new Error('Warehouse not resolved')

    const { data, error } = await supabase.rpc(
      'sp_create_movements_type_stock',
      {
        p_items: products,
        p_created_by: user.id,
        p_warehouse_id: finalWarehouseId
      }
    )

    if (error) throw error

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
