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
      id, // account_id
      uid, // auth_uid
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
      branch_id,
      is_active
    } = payload;

    if (!id || !uid) {
      return new Response(
        JSON.stringify({ error: 'ID (account_id) and UID (auth_uid) are required for update' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting user update workflow for:', uid);

    // 1. Update Account
    const { error: accountError } = await supabase
      .from('accounts')
      .update({
        name,
        middle_name,
        last_name,
        last_name2,
        document_type_id,
        document_number,
        is_active: is_active !== undefined ? is_active : true,
      })
      .eq('id', id);

    if (accountError) {
      console.error('Error updating account:', accountError);
      throw new Error(`Account update failed: ${accountError.message}`);
    }

    // 2. Update Auth User (Admin API)
    const authUpdates: any = {};
    if (email) authUpdates.email = email;
    if (password) authUpdates.password = password;
    if (phone) authUpdates.phone = phone;
    if (name || last_name) {
      authUpdates.user_metadata = {
        display_name: `${name ?? ''} ${last_name ?? ''}`.trim()
      };
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabase.auth.admin.updateUserById(uid, authUpdates);
      if (authError) {
        console.error('Error updating auth user:', authError);
        throw new Error(`Auth user update failed: ${authError.message}`);
      }
    }

    // 3. Update Profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        country_id,
        state_id,
        city_id,
        neighborhood_id,
        address,
        address_reference,
        warehouse_id,
        branch_id,
        is_active: is_active !== undefined ? is_active : true,
      })
      .eq('UID', uid);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw new Error(`Profile update failed: ${profileError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User updated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in user update workflow:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});