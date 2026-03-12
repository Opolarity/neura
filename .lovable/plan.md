

## Delivery Label PDF Generator

### What
Add a delivery/shipping label button next to "comprobantes" in the edit sale view. Clicking it generates a PDF label (like the uploaded image) with fixed sender info and dynamic recipient info from the current order.

### Design

**New utility file**: `src/modules/sales/utils/generateDeliveryLabel.ts`
- Uses `jsPDF` (already installed) to generate an ~80mm wide label
- **Remitente (fixed)**:
  - OVERTAKE UNLIMITED E.I.R.L.
  - CEL: 951645997
  - DIRECCIÓN: AV. BRASIL 817. JESÚS MARÍA - LIMA.
  - RUC: 20607798002
- **Destinatario (dynamic from order)**:
  - Full name from `formData.customerName + customerLastname`
  - RUC/DNI from `formData.documentNumber`
  - DESTINO: address, city, state info
  - CEL: `formData.phone`
- Loads logo from `/images/logo-ticket.png` (existing asset)
- Opens PDF in new tab via `window.open(doc.output('bloburl'))`

**UI change**: `src/modules/sales/pages/CreateSale.tsx`
- Add a `Truck` icon button next to the "comprobantes" link (only visible when `createdOrderId` exists)
- On click, calls the PDF generator with current form data

### Technical Details
- PDF dimensions: ~100mm x ~140mm portrait, similar to shipping label
- Layout matches uploaded image: logo + RUC header, remitente section, destinatario section
- Uses the same `fetch` + `FileReader` image loading pattern from existing ticket generators

