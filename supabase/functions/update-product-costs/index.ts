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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { costUpdates } = await req.json();

    if (!Array.isArray(costUpdates) || costUpdates.length === 0 ) {
      throw new Error('Invalid costUpdates data');
    }

    if (costUpdates.some((item) => typeof item.product_cost !== 'number' || isNaN(item.product_cost) || item.product_cost < 0)) {
  throw new Error('product_cost cannot be negative or invalid');
}

    console.log(`Updating costs for ${costUpdates.length} variations...`);

    // Update each variation's cost
    for (const update of costUpdates) {
      const { variation_id, product_cost } = update;

      const { error: updateError } = await supabase
        .from('variations')
        .update({ product_cost })
        .eq('id', variation_id);

      if (updateError) {
        console.error(`Error updating variation ${variation_id}:`, updateError);
        throw updateError;
      }
    }

    console.log('Product costs updated successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Costs updated successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating product costs:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
