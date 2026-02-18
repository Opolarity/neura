
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

        const { requestId, situation_code, module_code, items_approval } = await req.json()

        if (!requestId || !situation_code || !module_code) {
            return new Response(
                JSON.stringify({ error: 'Missing requestId, situation_code or module_code' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // Helper to resolve ID by code
        const resolveId = async (table: string, code: string) => {
            const { data, error } = await supabase
                .from(table)
                .select('id')
                .eq('code', code)
                .maybeSingle()
            if (error) throw error
            return data?.id
        }

        // Resolve IDs
        const moduleId = await resolveId('modules', module_code)

        // Find Situation (which brings status_id)
        const { data: newSituation, error: sitResError } = await supabase
            .from('situations')
            .select('id, status_id')
            .eq('code', situation_code)
            .eq('module_id', moduleId)
            .maybeSingle()

        if (sitResError) throw sitResError

        if (!moduleId || !newSituation) {
            return new Response(
                JSON.stringify({
                    error: 'Could not resolve codes',
                    details: { moduleId, situationFound: !!newSituation, situation_code, module_code }
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        const situationId = newSituation.id
        const statusId = newSituation.status_id

        // 1. Update Request Situation
        const { error: updateRequestError } = await supabase
            .from('stock_movement_requests')
            .update({ situation_id: situationId, status_id: statusId })
            .eq('id', requestId)

        if (updateRequestError) throw updateRequestError

        // 2. Log History
        await supabase.from('stock_movement_request_situations').insert([{
            stock_movement_request_id: requestId,
            module_id: moduleId,
            status_id: statusId,
            situation_id: situationId,
            message: `Status updated to ${situation_code}`,
            last_row: true,
            created_by
        }])


        if (situation_code === 'APR') {
            if (items_approval && Array.isArray(items_approval)) {
                for (const item of items_approval) {
                    // Update main movement
                    await supabase
                        .from('linked_stock_movement_requests')
                        .update({ approved: item.approved })
                        .eq('stock_movement_request_id', requestId)
                        .eq('stock_movement_id', item.stock_movement_id)

                    // Resolve partner and update it too (User: "si apruebo uno ambos pasan")
                    const { data: movData } = await supabase
                        .from('stock_movements')
                        .select('vinculated_movement_id')
                        .eq('id', item.stock_movement_id)
                        .maybeSingle()

                    if (movData?.vinculated_movement_id) {
                        await supabase
                            .from('linked_stock_movement_requests')
                            .update({ approved: item.approved })
                            .eq('stock_movement_request_id', requestId)
                            .eq('stock_movement_id', movData.vinculated_movement_id)
                    }
                }
            } else {
                await supabase
                    .from('linked_stock_movement_requests')
                    .update({ approved: true })
                    .eq('stock_movement_request_id', requestId)
            }


            const { data: approvedLinks } = await supabase
                .from('linked_stock_movement_requests')
                .select('stock_movement_id')
                .eq('stock_movement_request_id', requestId)
                .eq('approved', true)

            const approvedIds = approvedLinks?.map(x => x.stock_movement_id) || []

            if (approvedIds.length > 0) {
                await supabase
                    .from('stock_movements')
                    .update({ is_active: true })
                    .in('id', approvedIds)
            }
        }


        if (situation_code === 'ENV') {
            const { data: links } = await supabase
                .from('linked_stock_movement_requests')
                .select('stock_movement_id, stock_movements!inner(quantity, id)')
                .eq('stock_movement_request_id', requestId)
                .eq('approved', true)

            // Filter OUT movements (negative quantity)
            const outIds = links
                ?.filter((l: any) => l.stock_movements.quantity < 0)
                .map((l: any) => l.stock_movements.id) || []

            if (outIds.length > 0) {
                // Mark movements as completed; webhook will handle stock
                await supabase
                    .from('stock_movements')
                    .update({ completed: true })
                    .in('id', outIds)
            }
        }


        if (situation_code === 'REC') {
            const { data: links } = await supabase
                .from('linked_stock_movement_requests')
                .select('stock_movement_id, stock_movements!inner(quantity, id)')
                .eq('stock_movement_request_id', requestId)
                .eq('approved', true)

            const inIds = links
                ?.filter((l: any) => l.stock_movements.quantity > 0) // Positive
                .map((l: any) => l.stock_movements.id) || []

            if (inIds.length > 0) {
                // Mark movements as completed; webhook will handle stock
                await supabase
                    .from('stock_movements')
                    .update({ completed: true })
                    .in('id', inIds)
            }
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Status updated' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})

