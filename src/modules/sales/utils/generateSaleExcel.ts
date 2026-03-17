import * as XLSX from "xlsx";

export interface SaleExcelData {
  orderId?: number;
  saleDate: string;
  customerName: string;
  customerLastname: string;
  customerLastname2?: string;
  documentNumber: string;
  items: Array<{
    sku: string;
    productName: string;
    variationName: string;
    quantity: number;
    price: number;
  }>;
}

export function generateSaleExcel(data: SaleExcelData): void {
  const fullName = [data.customerName, data.customerLastname, data.customerLastname2]
    .filter(Boolean)
    .join(" ");

  // ── Info header rows ─────────────────────────────────────────────────────
  const infoRows = [
    ["Pedido N°", data.orderId ? `#${data.orderId}` : "-"],
    ["Fecha", data.saleDate],
    ["Cliente", fullName],
    ["Documento", data.documentNumber],
    [],
  ];

  // ── Detail rows ──────────────────────────────────────────────────────────
  const headerRow = ["#", "SKU", "Producto", "Variante", "Cantidad", "Precio Unit.", "Subtotal"];

  const detailRows = data.items.map((item, idx) => [
    idx + 1,
    item.sku,
    item.productName,
    item.variationName,
    item.quantity,
    item.price,
    +(item.quantity * item.price).toFixed(2),
  ]);

  const total = data.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const totalRow = ["", "", "", "", "", "TOTAL", +total.toFixed(2)];

  // ── Build worksheet ──────────────────────────────────────────────────────
  const wsData = [...infoRows, headerRow, ...detailRows, [], totalRow];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws["!cols"] = [
    { wch: 5 },   // #
    { wch: 18 },  // SKU
    { wch: 30 },  // Producto
    { wch: 22 },  // Variante
    { wch: 10 },  // Cantidad
    { wch: 14 },  // Precio Unit.
    { wch: 14 },  // Subtotal
  ];

  // ── Build workbook & download ─────────────────────────────────────────────
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Detalle Pedido");

  const filename = `pedido-${data.orderId ?? "nuevo"}.xlsx`;
  XLSX.writeFile(wb, filename);
}
