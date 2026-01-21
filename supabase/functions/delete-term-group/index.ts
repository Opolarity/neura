import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { id } = await req.json();

    if (!id) {
      throw new Error('Term Group ID is required');
    }

    console.log(`Deleting term group and its terms: ${id}`);

    // First, soft delete all terms in the group
    const { error: termsError } = await supabase
      .from('terms')
      .update({ is_active: false })
      .eq('term_group_id', id);

    if (termsError) {
      console.error('Error deleting terms:', termsError);
      throw termsError;
    }

    // Then, soft delete the term group itself
    const { data: group, error: groupError } = await supabase
      .from('term_groups')
      .update({ is_active: false })
      .eq('id', id)
      .select('id, name')
      .single();

    if (groupError) {
      console.error('Error deleting term group:', groupError);
      throw groupError;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Atributo y sus términos eliminados correctamente',
      group
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Delete term group error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
