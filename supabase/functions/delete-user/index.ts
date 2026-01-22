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
    const { id, uid } = payload;

    if (!id || !uid) {
      return new Response(
        JSON.stringify({ error: 'ID (account_id) and UID (auth_uid) are required for soft delete' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting soft delete for user:', uid);

    // 1. Deactivate Account
    const { error: accountError } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('id', id);

    if (accountError) {
      console.error('Error deactivating account:', accountError);
      throw new Error(`Account deactivation failed: ${accountError.message}`);
    }

    // 2. Deactivate Profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('UID', uid);

    if (profileError) {
      console.error('Error deactivating profile:', profileError);
      throw new Error(`Profile deactivation failed: ${profileError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User soft deleted (deactivated) successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in user soft delete workflow:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});