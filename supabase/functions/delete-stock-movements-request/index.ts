
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

    const { requestId, approved } = await req.json() // approved is boolean

    if (!requestId) {
      return new Response(
        JSON.stringify({ error: 'Missing requestId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 1. Get linked movements (Just to verify existence, optional but good practice)
    const { data: linkedRequests, error: linkError } = await supabase
      .from('linked_stock_movement_requests')
      .select('stock_movement_id')
      .eq('stock_movement_request_id', requestId)

    if (linkError) throw linkError

    // 2. ONLY Handle Approval/Disapproval of the LINK
    // We NO LONGER update stock_movements.is_active or product_stock here.
    const isApproved = approved === true

    // Update Linked Request Status
    const { error: updateLinkError } = await supabase
      .from('linked_stock_movement_requests')
      .update({ approved: isApproved })
      .eq('stock_movement_request_id', requestId)

    if (updateLinkError) throw updateLinkError

    return new Response(
      JSON.stringify({ success: true, approved: isApproved, message: 'Approval status updated. Stock not affected.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
