

## Problem
Currently, discounts are only tracked at the product level (per-unit discount on each product). The `order_discounts` table exists but is never used. The user needs:
1. Product discounts summed into a single `order_discounts` record (name: "Descuentos de productos", code: "PRO")
2. UI to add additional named discounts (positive or negative) after the subtotal line
3. `orders.discount` = sum of all `order_discounts` records
4. On edit, load existing `order_discounts` and recalculate
5. New discount section follows same blocking rules as product editing (`isPhySituation`)
6. Same functionality in POS

## Database
The `order_discounts` table already exists with columns: `id`, `order_id`, `name`, `discount_amount`, `code`, `created_at`. No schema changes needed.

## Changes

### 1. Backend — `sp_create_order` (migration)
After creating the order and products, insert `order_discounts` records from a new `p_discounts` JSONB parameter:
- Loop through `p_discounts` array, insert each into `order_discounts` (order_id, name, discount_amount, code)
- No change to how `orders.discount` is set — it's already passed from frontend

### 2. Backend — `update-order` Edge Function
- Accept `discounts` array in the input
- Delete existing `order_discounts` for the order
- Insert new `order_discounts` records
- `orders.discount` already updated from frontend-computed value

### 3. Backend — `get-sale-by-id` Edge Function
- Fetch `order_discounts` for the order
- Include in response as `discounts` array

### 4. Frontend — Types (`src/modules/sales/types/index.ts`)
- Add `OrderDiscount` interface: `{ id?: string; name: string; amount: number; code: string }`
- Add `discounts` to `CreateOrderRequest`
- Add `orderDiscounts` to `SaleProduct` related state (in the hook)

### 5. Frontend — `useCreateSale.ts` Hook
- Add `orderDiscounts` state: array of `{ id: string; name: string; amount: number; code: string }`
- Recompute `discountAmount` = sum of product discounts + sum of orderDiscounts amounts
- Recompute `total` = subtotal - discountAmount + shippingCost
- On submit: build product discount record (`{ name: "Descuentos de productos", amount: productDiscountSum, code: "PRO" }`) + additional discounts → send as `discounts` array
- On edit load: populate `orderDiscounts` from `get-sale-by-id` response (excluding PRO code, which is auto-calculated)
- Expose `addOrderDiscount`, `removeOrderDiscount`, `orderDiscounts` 

### 6. Frontend — `CreateSale.tsx` UI
- After the Subtotal line in the Resumen card, add a section showing:
  - Product discount line (auto-calculated, read-only)
  - List of additional discounts with name + amount + remove button
  - Small "Añadir descuento" button that opens inline inputs for name + amount (positive or negative)
- Disable this section when `isPhySituation` is true (same blocking rule as products)

### 7. Frontend — POS (`usePOS.ts` + `ProductsStep.tsx`)
- Replace the single `generalDiscount` with `orderDiscounts` array (same pattern)
- In the cart area, after the products, add the same discount UI
- On submit: build the same `discounts` array
- The POS service already sends `discount` (total) — also send `discounts` array

### 8. Frontend — Adapter (`adaptSaleById`)
- Parse `discounts` from API response
- Separate PRO-code discounts (don't show as editable) from custom discounts

### Files to modify:
- **Migration SQL**: Update `sp_create_order` to accept and insert discounts
- **`supabase/functions/update-order/index.ts`**: Handle discounts CRUD
- **`supabase/functions/get-sale-by-id/index.ts`**: Fetch and return discounts
- **`src/modules/sales/types/index.ts`**: Add OrderDiscount type, update CreateOrderRequest
- **`src/modules/sales/types/POS.types.ts`**: Update CreatePOSOrderRequest
- **`src/modules/sales/hooks/useCreateSale.ts`**: Add discount state, recompute totals, handle CRUD
- **`src/modules/sales/hooks/usePOS.ts`**: Replace generalDiscount with orderDiscounts array
- **`src/modules/sales/pages/CreateSale.tsx`**: Add discount UI in Resumen section
- **`src/modules/sales/components/pos/steps/ProductsStep.tsx`**: Add discount UI in cart
- **`src/modules/sales/services/index.ts`**: Send discounts in create/update
- **`src/modules/sales/services/POS.service.ts`**: Send discounts in POS create
- **`src/modules/sales/adapters/index.ts`**: Parse discounts from edit response
- **`src/modules/sales/utils/index.ts`**: Update calculateTotal to accept extra discounts

