
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

    const payload = await req.json()
    const {
      product_variation_id,
      quantity,
      stock_type_id, // Source Stock Type
      destination_stock_type_id, // Destination Stock Type (for transfer)
      movements_type, // Should be 13
      created_by
    } = payload

    let { warehouse_id } = payload

    if (!product_variation_id || !quantity || !movements_type || !stock_type_id || !created_by) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 1. Resolve Warehouse if missing
    if (!warehouse_id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('warehouse_id')
        .eq('UID', created_by) // Assuming UID matches created_by (UUID)
        .single()

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ error: 'Warehouse could not be resolved for user' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      warehouse_id = profile.warehouse_id
    }

    // 2. Handle Transfer (Type 13)
    if (movements_type === 13) {
      if (!destination_stock_type_id) {
        return new Response(
          JSON.stringify({ error: 'Destination stock type required for transfer' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      if (stock_type_id === destination_stock_type_id) {
        return new Response(
          JSON.stringify({ error: 'Source and destination stock types must be different' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // 3. Check Source Stock Availability
      const { data: sourceStock, error: sourceError } = await supabase
        .from('product_stock')
        .select('*')
        .eq('product_variation_id', product_variation_id)
        .eq('warehouses_id', warehouse_id)
        .eq('stock_type_id', stock_type_id)
        .maybeSingle()

      if (sourceError) throw sourceError

      if (!sourceStock || sourceStock.stock < quantity) {
        return new Response(
          JSON.stringify({ error: `Insufficient stock. Available: ${sourceStock?.stock || 0}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // 4. Perform Transfer
      // Decrement Source
      const { error: decrementError } = await supabase
        .from('product_stock')
        .update({ stock: sourceStock.stock - quantity })
        .eq('id', sourceStock.id)

      if (decrementError) throw decrementError

      // Increment/Create Destination
      const { data: destStock, error: destError } = await supabase
        .from('product_stock')
        .select('*')
        .eq('product_variation_id', product_variation_id)
        .eq('warehouses_id', warehouse_id)
        .eq('stock_type_id', destination_stock_type_id)
        .maybeSingle()

      if (destError) throw destError

      if (destStock) {
        const { error: incrementError } = await supabase
          .from('product_stock')
          .update({ stock: destStock.stock + quantity })
          .eq('id', destStock.id)

        if (incrementError) throw incrementError
      } else {
        const { error: insertDestError } = await supabase
          .from('product_stock')
          .insert([{
            product_variation_id,
            warehouses_id: warehouse_id,
            stock: quantity,
            stock_type_id: destination_stock_type_id
          }])

        if (insertDestError) throw insertDestError
      }

      // 5. Record Movement
      const { data: movement, error: movementError } = await supabase
        .from('stock_movements')
        .insert([{
          product_variation_id,
          quantity,
          created_by,
          movements_type: 13,
          warehouse_id,
          stock_type_id, // Recording the source type typically, or maybe we need two records? Usually one is enough to trace the action if description helps.
          is_active: true,
          completed: true,
          description: `Transferencia de ${stock_type_id} a ${destination_stock_type_id}`
        }])
        .select()
        .single()

      if (movementError) throw movementError

      return new Response(
        JSON.stringify({ success: true, movement }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Movement type not supported or implemented yet' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})