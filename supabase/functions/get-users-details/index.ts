import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const url = new URL(req.url);
    const userId = url.searchParams.get('id');

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('=== Fetching user details for ID:', userId, '===');


    const { data: accountData, error: accountError } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", userId)
      .single();

    if (accountError) {
      console.error('Error fetching account:', accountError);
      throw new Error(`Account not found: ${accountError.message}`);
    }

    if (!accountData) {
      throw new Error('Account not found');
    }

    console.log('Account data:', accountData);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("account_id", userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    console.log('Profile data:', profileData);

    let email = "";
    if (profileData?.UID) {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(profileData.UID);
        if (!authError && authUser) {
          email = authUser.email || "";
        }
      } catch (authErr) {
        console.error('Error fetching auth user:', authErr);
      }
    }

    let phone = "";
    if (profileData?.UID) {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(profileData.UID);
        if (!authError && authUser) {
          phone = authUser.phone || "";
        }
      } catch (authErr) {
        console.error('Error fetching auth user:', authErr);
      }
    }
    const { data: accountTypesData, error: accountTypesError } = await supabase
      .from("account_types")
      .select("account_type_id")
      .eq("account_id", userId);

    if (accountTypesError) {
      console.error('Error fetching account types:', accountTypesError);
      // No lanzar error, continuar con array vacío
    }

    console.log('Account types data:', accountTypesData);

    // 5. Obtener los roles del usuario (user_roles table)
    // Según tu esquema: user_roles.user_id referencia a profiles.UID
    let roleIds: number[] = [];
    if (profileData?.UID) {
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role_id")
        .eq("user_id", profileData.UID);

      if (!rolesError && rolesData) {
        roleIds = rolesData.map((r: any) => r.role_id);
      } else if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
      }
    }


    console.log('Role IDs:', roleIds);

    // 6. Construir la respuesta completa
    const responseData = {
      // Datos de la cuenta
      id: accountData.id,
      name: accountData.name || '',
      middle_name: accountData.middle_name || '',
      last_name: accountData.last_name || '',
      last_name2: accountData.last_name2 || '',
      document_type_id: accountData.document_type_id,
      document_number: accountData.document_number || '',
      show: accountData.show ?? true,
      is_active: accountData.is_active ?? true,
      created_at: accountData.created_at,


      email: email,
      phone: phone,


      role_ids: roleIds,


      account_types: accountTypesData || [],


      country_id: profileData?.country_id,
      state_id: profileData?.state_id,
      city_id: profileData?.city_id,
      neighborhood_id: profileData?.neighborhood_id,
      address: profileData?.address || '',
      address_reference: profileData?.address_reference || '',
      warehouse_id: profileData?.warehouse_id,
      branch_id: profileData?.branch_id,
      profiles_id: profileData?.UID || null,


      profiles: profileData ? {
        UID: profileData.UID,
        account_id: profileData.account_id,
        phone: profileData.phone || '',
        warehouse_id: profileData.warehouse_id,
        branch_id: profileData.branch_id,
        country_id: profileData.country_id,
        state_id: profileData.state_id,
        city_id: profileData.city_id,
        neighborhood_id: profileData.neighborhood_id,
        address: profileData.address || '',
        address_reference: profileData.address_reference || '',
        is_active: profileData.is_active ?? true,
        created_at: profileData.created_at,
      } : null
    };

    console.log('=== Final response ===', JSON.stringify(responseData, null, 2));

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('=== Error in get-users-details ===', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});