import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * This function is intended to be triggered by a Supabase Webhook
 * on the `stock_movements` table when `completed` becomes TRUE.
 */
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
        console.log('Webhook Payload Received:', JSON.stringify(payload))

        // Supabase Webhook payload structure: { type, table, record, old_record, schema }
        const { record, old_record, type } = payload

        // Only process if it's an UPDATE or INSERT where completed is true
        // And if it's an update, only if it changed from false to true
        const isNowCompleted = record?.completed === true
        const wasCompleted = old_record?.completed === true

        console.log(`Type: ${type}, NowCompleted: ${isNowCompleted}, WasCompleted: ${wasCompleted}`)

        if (!isNowCompleted || (type === 'UPDATE' && wasCompleted)) {
            console.log('Skipping: conditions for completion change not met.')
            return new Response(
                JSON.stringify({ message: 'Movement not transitioning to completed. Skipping.' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        const { product_variation_id, warehouse_id, stock_type_id, quantity } = record
        console.log(`Processing: Var:${product_variation_id}, WH:${warehouse_id}, Type:${stock_type_id}, Qty:${quantity}`)

        if (!product_variation_id || !warehouse_id || !stock_type_id || quantity === undefined) {
            console.error('Validation failed: missing fields in record')
            throw new Error('Missing movement details in payload')
        }

        // Check existing stock
        const { data: existingStock, error: fetchError } = await supabase
            .from('product_stock')
            .select('*')
            .eq('product_variation_id', product_variation_id)
            .eq('warehouse_id', warehouse_id)
            .eq('stock_type_id', stock_type_id)
            .maybeSingle()

        if (fetchError) {
            console.error('Error fetching existing stock:', fetchError.message)
            throw fetchError
        }

        if (existingStock) {
            const newStockTotal = Number(existingStock.stock) + Number(quantity)
            console.log(`Updating existing stock ID ${existingStock.id}: ${existingStock.stock} + ${quantity} = ${newStockTotal}`)

            const { error: updateError } = await supabase
                .from('product_stock')
                .update({ stock: newStockTotal })
                .eq('id', existingStock.id)

            if (updateError) {
                console.error('Error updating stock record:', updateError.message)
                throw updateError
            }
            console.log('Update successful')
        } else {
            console.log('No existing stock found for this combination.')
            // Only create if positive (IN)
            if (Number(quantity) > 0) {
                console.log(`Creating new stock record with quantity: ${quantity}`)
                const { error: insertError } = await supabase
                    .from('product_stock')
                    .insert([{
                        product_variation_id,
                        warehouse_id,
                        stock: quantity,
                        defects: 0,
                        stock_type_id
                    }])

                if (insertError) {
                    console.error('Error inserting new stock record:', insertError.message)
                    throw insertError
                }
                console.log('Insert successful')
            } else {
                console.log('Quantity is not positive, skipping creation.')
            }
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Stock updated successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
