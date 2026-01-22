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
    const {
      name,
      middle_name,
      last_name,
      last_name2,
      document_type_id,
      document_number,
      email,
      password,
      phone,
      country_id,
      state_id,
      city_id,
      neighborhood_id,
      address,
      address_reference,
      warehouse_id,
      branch_id
    } = payload;

    // 1. Validation
    if (!name || !last_name || !document_type_id || !document_number || !email || !password || !warehouse_id || !branch_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, last_name, document_type_id, document_number, email, password, warehouse_id, and branch_id are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting user creation workflow for:', email);

    // 2. Create Account
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .insert({
        name,
        middle_name,
        last_name,
        last_name2,
        document_type_id,
        document_number,
        is_active: true,
        show: true,
      })
      .select()
      .single();

    if (accountError) {
      console.error('Error creating account:', accountError);
      throw new Error(`Account creation failed: ${accountError.message}`);
    }

    // 3. Create Auth User (Admin API)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      phone,
      email_confirm: true,
      user_metadata: { display_name: `${name} ${last_name}`.trim() }
    });

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError);
      // Rollback: delete account? Or let the user handle it. 
      // For now, just throw error.
      throw new Error(`Auth user creation failed: ${authError?.message ?? 'Unknown error'}`);
    }

    const user_uid = authData.user.id;

    // 4. Create Profile (Linkage)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        UID: user_uid,
        account_id: accountData.id,
        country_id,
        state_id,
        city_id,
        neighborhood_id,
        address,
        address_reference,
        warehouse_id,
        branch_id,
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Note: Ideally we would roll back auth user creation here too.
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User created successfully',
        data: {
          account: accountData,
          auth_uid: user_uid,
          profile: profileData
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in user creation workflow:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});