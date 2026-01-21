import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { termsId, termGroupId } = await req.json();
    if (!termsId && !termGroupId) {
      throw new Error('Terms ID or Term Group ID is required');
    }
    let query = supabase.from('terms').update({
      is_active: false
    });
    if (termsId) {
      console.log(`Soft deleting term: ${termsId}`);
      query = query.eq('id', termsId);
    } else if (termGroupId) {
      console.log(`Soft deleting all terms in group: ${termGroupId}`);
      query = query.eq('term_group_id', termGroupId);
    }
    const { data: terms, error } = await query.select('id');
    if (error) throw error;
    return new Response(JSON.stringify({
      success: true,
      message: termsId ? 'Termino eliminado correctamente' : 'Terminos del grupo eliminados correctamente',
      TermsIds: terms
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Soft delete error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
