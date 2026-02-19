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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { termGroupId, confirmed } = await req.json();

    if (!termGroupId) {
      throw new Error('Term Group ID must be a valid number');
    }

    /* 1. Verificar si existen términos activos en este grupo */
    const { data: terms, error: termsError } = await supabase
      .from('terms')
      .select('id, name')
      .eq('term_group_id', termGroupId)
      .eq('is_active', true);

    if (termsError) throw termsError;

    /* 2. Si hay términos y no está confirmado, avisar */
    if (terms && terms.length > 0 && !confirmed) {
      console.log(`Warning: Group ${termGroupId} has ${terms.length} active terms.`);
      return new Response(
        JSON.stringify({
          warning: `Este grupo tiene ${terms.length} términos asociados que también serán eliminados.`,
          terms: terms,
          requiresConfirmation: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Soft deleting term group: ${termGroupId} and its terms.`);

    /* 3. Soft delete de los términos asociados */
    if (terms && terms.length > 0) {
      const { error: deleteTermsError } = await supabase
        .from('terms')
        .update({ is_active: false })
        .eq('term_group_id', termGroupId);

      if (deleteTermsError) throw deleteTermsError;
    }

    /* 4. Soft delete del grupo */
    const { data: groupDeleted, error: groupError } = await supabase
      .from('term_groups')
      .update({ is_active: false })
      .eq('id', termGroupId)
      .select('id');

    if (groupError) throw groupError;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Grupo y términos eliminados correctamente',
        group: groupDeleted,
        affectedTerms: terms?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Soft delete error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});