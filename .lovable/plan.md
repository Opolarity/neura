

## Problem
1. The "Cuenta" dropdown in `/invoices/series/add` shows blank items — likely because it loads all active accounts into a basic Select which can't handle many items well.
2. No search capability — users need to find accounts by name or document number.
3. No filtering by `person_type = 2` (persona jurídica) — only accounts with a document type where `person_type = 2` should appear.

## Changes

### 1. Hook — `useInvoiceSeriesForm.ts`
- Update the accounts query to join `document_types` and filter by `person_type = 2`:
  ```
  supabase.from("accounts")
    .select("id, name, document_number, document_types!inner(person_type)")
    .eq("is_active", true)
    .eq("document_types.person_type", 2)
    .order("name")
  ```
- Include `document_number` in the accounts state type so it can be displayed and searched.

### 2. UI — `InvoiceSeriesFormPage.tsx`
- Replace the `<Select>` for "Cuenta" with a searchable Combobox using `cmdk` (already installed) + Popover pattern:
  - Text input for searching by name or document number.
  - Filtered dropdown list showing matching accounts as `{document_number} — {name}`.
  - On select, set `account_id` and close popover.
  - Show selected account name in the trigger when a value is chosen.

### Files to modify
- `src/modules/settings/hooks/useInvoiceSeriesForm.ts` — filter query + add `document_number` to state
- `src/modules/settings/pages/InvoiceSeriesFormPage.tsx` — replace Select with searchable Combobox

