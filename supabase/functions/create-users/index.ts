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
            branch_id,
            show,
            type_ids,
            role_ids,
            role_id // Added support for singular role_id
        } = payload;

        // Validate required fields
        if (!name || !document_type_id || !document_number || !email || !password || !warehouse_id || !branch_id || !type_ids || !Array.isArray(type_ids) || type_ids.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: name, last_name, document_type_id, document_number, email, password, warehouse_id, branch_id, and type_ids are required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log('Start create user:', email);

        // 1. Check if user already exists in accounts
        const { data: userExists, error: userexistserror } = await supabase
            .from('accounts')
            .select()
            .eq('document_number', document_number)
            .eq('document_type_id', document_type_id)
            .maybeSingle();

        if (userExists) {
            return new Response(
                JSON.stringify({ error: 'User already exists with this document' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        if (userexistserror) {
            console.error('Error checking existing user:', userexistserror);
            throw new Error(`User check failed: ${userexistserror.message}`);
        }

        // 2. Create Auth User (Admin API)
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            phone,
            email_confirm: true, // Auto-confirm email for convenience
            user_metadata: {
                display_name: `${name} ${middle_name ? middle_name + ' ' : ''}${last_name} ${last_name2 ? last_name2 : ''}`.trim(),
            }
        });

        if (authError || !authData.user) {
            console.error('Error creating auth user:', authError);
            throw new Error(`Auth user creation failed: ${authError?.message ?? 'Unknown error'}`);
        }

        const user_uid = authData.user.id;

        try {
            // 3. Create Account
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
                    show: show ?? true,
                })
                .select()
                .single();

            if (accountError) {
                console.error('Error creating account:', accountError);
                throw new Error(`Account creation failed: ${accountError.message}`);
            }

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
                throw new Error(`Profile creation failed: ${profileError.message}`);
            }

            // 5. Create Account Types
            const accountTypesInserts = type_ids.map(tid => ({
                account_id: accountData.id,
                account_type_id: tid,
            }));

            const { error: accountTypesError } = await supabase
                .from('account_types')
                .insert(accountTypesInserts);

            if (accountTypesError) {
                console.error('Error creating account types:', accountTypesError);
                throw new Error(`Account types creation failed: ${accountTypesError.message}`);
            }

            // 6. Handle Roles
            // Normalize roles to an array
            let final_role_ids: number[] = [];
            if (role_ids && Array.isArray(role_ids)) {
                final_role_ids = role_ids;
            } else if (role_id) {
                final_role_ids = [parseInt(role_id.toString())];
            }

            let userRolesData = null;
            if (final_role_ids.length > 0) {
                const userRolesInserts = final_role_ids.map(rid => ({
                    user_id: user_uid,
                    role_id: rid,
                }));

                const { data: rolesData, error: rolesError } = await supabase
                    .from('user_roles')
                    .insert(userRolesInserts)
                    .select();

                if (rolesError) {
                    console.error('Error creating user roles:', rolesError);
                    throw new Error(`User roles creation failed: ${rolesError.message}`);
                }
                userRolesData = rolesData;
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'User created successfully',
                    data: {
                        account: accountData,
                        auth_uid: user_uid,
                        profile: profileData,
                        user_roles: userRolesData
                    }
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );

        } catch (innerError) {
            // Rollback on any error during the db insertion steps
            console.error('Rolling back user creation due to error:', innerError);

            // Cleanup auth user
            await supabase.auth.admin.deleteUser(user_uid);

            // Note: We don't explicitly cleanup tables because if the above failed,
            // it's likely no records were committed if in a transaction (but here we don't have explicit tx across tables).
            // However, deleting the auth user is the most critical part. 
            // We could try deleting by account_id/UID but it's safer to just throw.

            throw innerError;
        }

    } catch (error) {
        console.error('Error in user creation workflow:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
