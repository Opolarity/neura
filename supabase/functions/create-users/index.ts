import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
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
      branch_id,
      show,
      type_ids,
      role_ids,
      role_id,
    } = payload;

    // Validate required fields
    if (!name || !document_type_id || !document_number || !email || !password || !warehouse_id || !branch_id || !type_ids || !Array.isArray(type_ids) || type_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, document_type_id, document_number, email, password, warehouse_id, branch_id, and type_ids are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Normalize role_ids
    let final_role_ids: number[] = [];
    if (role_ids && Array.isArray(role_ids)) {
      final_role_ids = role_ids;
    } else if (role_id) {
      final_role_ids = [parseInt(role_id.toString())];
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!; 

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    console.log('Start create user:', email);

    // 0. Check for duplicates

    // Check if document number already exists linked to a user profile
    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('id, document_number, profiles!profiles_account_id_fkey(UID)')
      .eq('document_number', document_number)
      .eq('document_type_id', document_type_id);

    if (existingAccount && existingAccount.length > 0) {
      const hasProfile = existingAccount.some((a: any) => a.profiles && a.profiles.length > 0);
      if (hasProfile) {
        return new Response(
          JSON.stringify({ error: `Ya existe un usuario con el número de documento ${document_number}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    // Check if email already exists in auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some((u: any) => u.email?.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      return new Response(
        JSON.stringify({ error: `Ya existe un usuario con el correo ${email}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if phone already exists (only if provided)
    if (phone) {
      const phoneExists = existingUsers?.users?.some((u: any) => u.phone === phone);
      if (phoneExists) {
        return new Response(
          JSON.stringify({ error: `Ya existe un usuario con el número de teléfono ${phone}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      phone,
      email_confirm: true,
      user_metadata: {
        display_name: `${name} ${middle_name ? middle_name + ' ' : ''}${last_name ?? ''} ${last_name2 ?? ''}`.trim(),
      },
    });

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError);
      return new Response(
        JSON.stringify({ error: `Auth user creation failed: ${authError?.message ?? 'Unknown error'}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const user_uid = authData.user.id;

    // 2. Call stored procedure for atomic DB operations
    const { data: spData, error: spError } = await supabase.rpc('sp_create_user_profile', {
      p_uid: user_uid,
      p_name: name,
      p_middle_name: middle_name ?? null,
      p_last_name: last_name ?? null,
      p_last_name2: last_name2 ?? null,
      p_document_type_id: document_type_id,
      p_document_number: document_number,
      p_show: show ?? true,
      p_country_id: country_id ?? null,
      p_state_id: state_id ?? null,
      p_city_id: city_id ?? null,
      p_neighborhood_id: neighborhood_id ?? null,
      p_address: address ?? null,
      p_address_reference: address_reference ?? null,
      p_warehouse_id: warehouse_id,
      p_branch_id: branch_id,
      p_type_ids: type_ids,
      p_role_ids: final_role_ids,
    });

    if (spError) {
      console.error('SP error, rolling back auth user:', spError);
      // Rollback: delete the auth user since DB operations failed
      await supabase.auth.admin.deleteUser(user_uid);
      return new Response(
        JSON.stringify({ error: spError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User created successfully',
        data: spData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in user creation workflow:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
