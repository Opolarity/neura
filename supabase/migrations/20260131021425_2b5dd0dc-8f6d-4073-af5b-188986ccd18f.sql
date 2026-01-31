-- Fix PostgREST ambiguity: remove overloaded function with integer session_id
-- Keep the bigint version since pos_sessions.id is bigint.

DROP FUNCTION IF EXISTS public.sp_close_pos_session(uuid, integer, numeric, text);

-- Refresh PostgREST schema cache so it stops seeing/trying to resolve the old overload
NOTIFY pgrst, 'reload schema';
