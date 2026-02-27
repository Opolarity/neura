

## Plan: Adapt situation code checks from exact match to suffix match

The DB now has codes like `RES-PHY`, `CRE-PHY`, `FIN-PHY`, `CAN-HDN`, `PEP-VIR`, etc. The code currently checks for exact `"PHY"`, `"VIR"`, `"HDN"` which won't match these new codes.

### Files to modify

**1. Frontend: `src/modules/sales/hooks/useCreateSale.ts` (line 335)**
- Change `currentSituation?.code === "PHY"` to `currentSituation?.code?.endsWith("-PHY")`

**2. Edge Function: `supabase/functions/update-order/index.ts` (lines 110-127)**
- Replace the `switch` with `if/else` using `.endsWith("-PHY")`, `.endsWith("-HDN")`, `.endsWith("-VIR")`

**3. Edge Function: `supabase/functions/update-order-situation/index.ts` (lines 59-75)**
- Same change: replace `switch` with `endsWith` checks

**4. Edge Function: `supabase/functions/ec-create-order/index.ts` (line 54)**
- This queries `.eq('code', 'VIR')` to find initial situation. Since no situation has exact code `VIR` anymore (the VIR ones are `PEP-VIR`, `PAI-VIR`), this needs to be updated to use `.like('code', '%-VIR%')` or changed to query by a specific known code/ID for the ecommerce initial situation.

### Technical detail

All switch/case blocks like:
```ts
case "PHY": ...
case "HDN": ...
case "VIR": ...
```
become:
```ts
if (code.endsWith("-PHY")) { ... }
else if (code.endsWith("-HDN")) { ... }
else if (code.endsWith("-VIR")) { ... }
```

