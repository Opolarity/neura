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
    const { name, term_group_id } = await req.json();
    if (!name) {
      throw new Error('Name is required');
    }
    console.log(`Creating term: ${name}`);
    /* Insertar el nuevo término */ const { data: terms, error } = await supabase.from('terms').insert({
      name,
      term_group_id,
      is_active: true
    }).select('id').single();
    if (error) throw error;
    return new Response(JSON.stringify({
      success: true,
      message: 'Termino creado correctamente',
      term: terms
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
