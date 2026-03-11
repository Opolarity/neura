

## Problem
The user listing at `/settings/users` currently shows ALL users (2072 total), including clients and other types. It should only show users who have the type with code `'COL'` (Colaborador, id=22) linked via the `account_types` table.

## Solution
Modify the `sp_get_users` stored procedure to add an `INNER JOIN` to `account_types` and `types` tables, filtering only accounts that have a linked type with `code = 'COL'`.

## Change

**Database migration** — Update `sp_get_users`:
- Change the existing `LEFT JOIN LATERAL` for `acc_type` to an `INNER JOIN` (or add a `WHERE EXISTS`) that requires the account to have a record in `account_types` where the associated `types.code = 'COL'`.

Specifically, add this condition to the `WHERE` clause:
```sql
AND EXISTS (
    SELECT 1 FROM account_types act2
    JOIN types ty2 ON ty2.id = act2.account_type_id
    WHERE act2.account_id = ac.id AND ty2.code = 'COL'
)
```

This is the minimal, non-breaking change — no frontend or edge function modifications needed. The total count will also be corrected automatically since `COUNT(*) OVER()` runs after the filter.

