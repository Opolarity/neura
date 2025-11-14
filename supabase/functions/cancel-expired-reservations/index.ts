import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting expired reservations cancellation process...');

    // Calculate 3 hours ago
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    console.log('Looking for reservations older than:', threeHoursAgo);

    // Find all order_situations with status RES (status_id=1) that are last_row and older than 3 hours
    const { data: expiredReservations, error: fetchError } = await supabase
      .from('order_situations')
      .select('id, order_id, situation_id, created_at')
      .eq('status_id', 1) // RES status
      .eq('last_row', true)
      .lt('created_at', threeHoursAgo);

    if (fetchError) {
      console.error('Error fetching expired reservations:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredReservations?.length || 0} expired reservations to cancel`);

    if (!expiredReservations || expiredReservations.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired reservations found',
          cancelledCount: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let cancelledCount = 0;
    const errors: any[] = [];

    // Process each expired reservation
    for (const reservation of expiredReservations) {
      try {
        console.log(`Processing order ${reservation.order_id}...`);

        // 1. Update current order_situation to not be last_row
        const { error: updateError } = await supabase
          .from('order_situations')
          .update({ last_row: false })
          .eq('id', reservation.id);

        if (updateError) {
          console.error(`Error updating order_situation ${reservation.id}:`, updateError);
          errors.push({ order_id: reservation.order_id, error: updateError.message });
          continue;
        }

        // 2. Insert new order_situation with Cancelado status (situation_id=6, status_id=6)
        const { error: insertError } = await supabase
          .from('order_situations')
          .insert({
            order_id: reservation.order_id,
            situation_id: 6, // Cancelado
            status_id: 6, // CAN
            last_row: true,
          });

        if (insertError) {
          console.error(`Error inserting cancelled situation for order ${reservation.order_id}:`, insertError);
          errors.push({ order_id: reservation.order_id, error: insertError.message });
          continue;
        }

        // 3. Release reserved stock - set reservation to false
        const { error: stockError } = await supabase
          .from('order_products')
          .update({ reservation: false })
          .eq('order_id', reservation.order_id);

        if (stockError) {
          console.error(`Error releasing stock for order ${reservation.order_id}:`, stockError);
          errors.push({ order_id: reservation.order_id, error: stockError.message });
          continue;
        }

        console.log(`Successfully cancelled order ${reservation.order_id}`);
        cancelledCount++;
      } catch (err) {
        console.error(`Unexpected error processing order ${reservation.order_id}:`, err);
        errors.push({ order_id: reservation.order_id, error: err.message });
      }
    }

    const response = {
      success: true,
      message: `Cancelled ${cancelledCount} expired reservations`,
      cancelledCount,
      totalFound: expiredReservations.length,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('Cancellation process completed:', response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in cancel-expired-reservations function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
