

## Problem
1. The total count and rows are based on `accounts`, so one account with multiple profiles creates duplicates.
2. The "ID" column shows the account ID — should show "Usuario" with the `user_name` from `profiles`.

## Changes

### 1. Database migration — Update `sp_get_users`
- Change `COUNT(*) OVER()` to count per profile row (already does, but duplicates come from the join). Add `DISTINCT ON (pr.id)` or simply use `pr.id` as the primary key of each row instead of `ac.id`.
- Replace `ac.id AS id` with `pr."UID" AS id` and add `pr.user_name AS user_name` to the select.
- Actually, the real fix: use **profiles as the driving table** — each row = one profile. The `COUNT(*) OVER()` then counts profiles, not accounts.
- Add `user_name` field to the response.

### 2. Frontend — Types, Adapter, Table
- **`Users.types.ts`**: Add `user_name` field to both `UsersApiResponse` and `Users` interface.
- **`Users.adapters.ts`**: Map `user_name` from response.
- **`UsersTable.tsx`**: Rename "ID" column header to "Usuario", display `user_name` instead of `id`.

### Files to modify
- New migration SQL (update `sp_get_users` to use `pr.id` as row key, add `user_name`, ensure count is per-profile)
- `src/modules/settings/types/Users.types.ts`
- `src/modules/settings/adapters/Users.adapters.ts`
- `src/modules/settings/components/users/UsersTable.tsx`

