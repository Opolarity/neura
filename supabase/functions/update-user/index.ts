import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        const {
            id, // account_id
            uid, // auth_uid (profiles_id in frontend)
            name,
            middle_name,
            last_name,
            last_name2,
            document_type_id,
            document_number,
            email,
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
            role_ids
        } = payload;

        if (!id || !uid) {
            return new Response(
                JSON.stringify({ error: 'Account ID and Auth UID are required for updates' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log('Starting update for user:', uid);

        // 1. Update Auth User (Email) if changed
        if (email) {
            const { error: authError } = await supabase.auth.admin.updateUserById(
                uid,
                { email }
            );
            if (authError) {
                console.error('Error updating auth email:', authError);
                throw new Error(`Auth update failed: ${authError.message}`);
            }
        }


        if (phone) {
            const { error: authError } = await supabase.auth.admin.updateUserById(
                uid,
                { email }
            );
            if (authError) {
                console.error('Error updating auth email:', authError);
                throw new Error(`Auth update failed: ${authError.message}`);
            }
        }


        // 2. Update Accounts table
        const { error: accountError } = await supabase
            .from('accounts')
            .update({
                name,
                middle_name,
                last_name,
                last_name2,
                document_type_id,
                document_number,
                show
            })
            .eq('id', id);

        if (accountError) {
            console.error('Error updating account:', accountError);
            throw new Error(`Account update failed: ${accountError.message}`);
        }

        // 3. Update Profiles table
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
                branch_id
            })
            .eq('UID', uid);

        if (profileError) {
            console.error('Error updating profile:', profileError);
            throw new Error(`Profile update failed: ${profileError.message}`);
        }

        // 4. Update Roles (Sync)
        if (role_ids && Array.isArray(role_ids)) {
            // Delete current roles
            const { error: deleteRolesError } = await supabase
                .from('user_roles')
                .delete()
                .eq('user_id', uid);

            if (deleteRolesError) throw deleteRolesError;

            // Insert new roles
            if (role_ids.length > 0) {
                const roleInserts = role_ids.map(rid => ({ user_id: uid, role_id: rid }));
                const { error: insertRolesError } = await supabase
                    .from('user_roles')
                    .insert(roleInserts);

                if (insertRolesError) throw insertRolesError;
            }
        }

        // 5. Update Account Types (Sync)
        if (type_ids && Array.isArray(type_ids)) {
            // Delete current types
            const { error: deleteTypesError } = await supabase
                .from('account_types')
                .delete()
                .eq('account_id', id);

            if (deleteTypesError) throw deleteTypesError;

            // Insert new types
            if (type_ids.length > 0) {
                const typeInserts = type_ids.map(tid => ({ account_id: id, account_type_id: tid }));
                const { error: insertTypesError } = await supabase
                    .from('account_types')
                    .insert(typeInserts);

                if (insertTypesError) throw insertTypesError;
            }
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
