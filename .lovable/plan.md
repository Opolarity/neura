

## Problem

There are two overloaded versions of `sp_create_order`:
1. **9 args** — without `p_discounts`
2. **10 args** — with `p_discounts`

PostgREST cannot disambiguate between them when `p_discounts` is optional (per memory: `rpc-overload-prevention-standard`).

## Plan

**Single migration** to:
1. Drop the old 9-argument function: `DROP FUNCTION public.sp_create_order(uuid, bigint, bigint, jsonb, jsonb, jsonb, bigint, boolean, jsonb);`
2. Alter the 10-argument version to ensure `p_discounts` has a default value of `'[]'::jsonb` (so callers that don't pass it still work).
3. Notify PostgREST to reload schema: `NOTIFY pgrst, 'reload schema';`

No frontend or Edge Function changes needed — callers already pass `p_discounts` or will fall back to the default.

