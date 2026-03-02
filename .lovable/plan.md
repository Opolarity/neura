

## Analysis

I've traced the complete flow of the order Select in `/sales`:

1. **Frontend**: `SalesFilterBar` → `onOrderChange` → `useSales.onOrderChange` → updates `filters.order` and calls `loadData`
2. **Service**: `fetchSalesList` sends `order` as query param via `buildEndpoint`
3. **Edge Function**: `get-sales-list` reads `order` from URL params and passes as `p_order` to `sp_get_sales_list`
4. **Stored Procedure**: Has correct `CASE` statements for `date_desc`, `date_asc`, `total_desc`, `total_asc`

I verified with a direct curl to the edge function that `total_asc` correctly returns data sorted by total ascending (0, 10, 10, 14, 19.99...). The backend works.

The frontend code also appears correctly wired. However, there could be a subtle closure/state issue in `useSales.ts` — the `debouncedSearch` useEffect (line 90) captures `filters` from the closure, which could potentially overwrite a recent order change with stale filters if both fire close together.

## Plan

### 1. Add `filters` to `loadData` dependencies safety
In `useSales.ts`, the `onOrderChange` function directly calls `loadData(newFilters)` passing the new filters explicitly, which should bypass any closure issues. The code appears correct as-is.

### 2. Verify via browser testing
Test the order select in the preview to confirm it triggers a new network request with the correct `order` parameter and the results change accordingly.

### 3. If issue persists: Add console logging
Add temporary `console.log` in `onOrderChange` to confirm it fires, and check the network request to verify the `order` param changes.

**Most likely root cause**: The code is correct and the ordering works. If the user sees no change, it may be because with few records filtered by branch/warehouse (only 6 records), the visual difference between some orderings is subtle. However, switching between `date_desc` and `total_asc` should produce a visible reorder.

I'll implement by first testing end-to-end, and if any issue is found, fix it.

