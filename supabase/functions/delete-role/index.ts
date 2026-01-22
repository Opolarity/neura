import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {

    const payload = await req.json();
    const { id } = payload;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID is required for role' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Deleting role and dependencies:', id);

    // 1. Delete Dependencies first (to avoid FK constraints)
    const { error: funcError } = await supabase
      .from('role_functions')
      .delete()
      .eq('role_id', id);

    if (funcError) {
      console.error('Error deleting role_functions:', funcError);
      throw funcError;
    }

    const { error: userroleError } = await supabase
      .from('user_roles')
      .delete()
      .eq('role_id', id);

    if (userroleError) {
      console.error('Error deleting user_roles:', userroleError);
      throw userroleError;
    }

    const { error: capabilitiesError } = await supabase
      .from('role_capabilities')
      .delete()
      .eq('role_id', id);

    if (capabilitiesError) {
      console.error('Error deleting role_capabilities:', capabilitiesError);
      throw capabilitiesError;
    }

    // 2. Finally, delete the Role
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (roleError) {
      console.error('Error deleting role:', roleError);
      throw roleError;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Role and associations deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in delete-role function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});