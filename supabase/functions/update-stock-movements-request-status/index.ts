
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

        const { requestId, situation_id } = await req.json()

        if (!requestId || !situation_id) {
            return new Response(
                JSON.stringify({ error: 'Missing requestId or situation_id' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // 1. Update Request Situation
        const { error: updateRequestError } = await supabase
            .from('stock_movement_requests')
            .update({ situation_id })
            .eq('id', requestId)

        if (updateRequestError) throw updateRequestError

        // 2. Check if Situation is "RECEIVED"
        // PLACEHOLDER ID: 2 = Received. Change this to the actual ID from your database.
        const RECEIVED_SITUATION_ID = 2

        let activationResult = { activated: false, count: 0 }

        if (situation_id === RECEIVED_SITUATION_ID) {
            // 3. Activate Linked Movements and Update Inventory

            // Get linked movements
            const { data: linkedRequests, error: linkError } = await supabase
                .from('linked_stock_movement_requests')
                .select('stock_movement_id, approved')
                .eq('stock_movement_request_id', requestId)

            if (linkError) throw linkError

            // Filter only approved links (optional: strict check) or just all linked
            // Assuming we only activate if it was approved (though approval step might be separate)
            // If approval is mandatory before activation:
            const approvedMovementIds = linkedRequests
                ?.filter((lr: any) => lr.approved)
                .map((lr: any) => lr.stock_movement_id) || []

            if (approvedMovementIds.length > 0) {
                // Activate Movements
                const { error: activateError } = await supabase
                    .from('stock_movements')
                    .update({ is_active: true })
                    .in('id', approvedMovementIds)

                if (activateError) throw activateError

                // Update Inventory
                const { data: movementsToProcess, error: fetchError } = await supabase
                    .from('stock_movements')
                    .select('*')
                    .in('id', approvedMovementIds)

                if (fetchError) throw fetchError

                for (const movement of movementsToProcess) {
                    const { product_variation_id, warehouse_id, stock_type_id, quantity } = movement

                    // Check for existing stock
                    const { data: existingStock, error: stockError } = await supabase
                        .from('product_stock')
                        .select('*')
                        .eq('product_variation_id', product_variation_id)
                        .eq('warehouse_id', warehouse_id)
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
                                warehouse_id: warehouse_id,
                                stock: quantity,
                                defects: 0,
                                stock_type_id
                            }])

                        if (insertStockError) throw insertStockError
                    }
                }
                activationResult = { activated: true, count: approvedMovementIds.length }
            }
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Status updated', activation: activationResult }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
