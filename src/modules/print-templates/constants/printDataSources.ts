/**
 * Fuentes de datos de las plantillas: las listas que trae cada PDF del ERP
 * (los ítems de un comprobante, el detalle de una guía…). Una Tabla de datos
 * repite una fila por cada registro de su fuente.
 *
 * Cada plantilla del sistema dice qué fuentes puede usar (`dataSources` en
 * systemPrintTemplates): una guía no lista los ítems de una venta. Una fuente
 * se comparte entre los documentos que imprimen lo mismo. Se van sumando
 * documento por documento, con los datos que consume hoy su generador.
 *
 * Las claves de los campos son las de los datos que arma hoy cada generador
 * (InvoicePrintItem en invoiceA4Pdf.ts, por ejemplo): al imprimir se le pasa a
 * la plantilla `{ [id de la fuente]: filas }` tal cual. Renombrar un id o una
 * clave rompe las plantillas guardadas.
 *
 * `mockRows` son los datos de ejemplo que muestra el editor, donde todavía no
 * hay un documento de verdad: verosímiles, con lo que suele salir en el papel.
 *
 * Una fuente también puede traer valores sueltos del documento (`values`),
 * como los totales del comprobante: un Texto muestra uno de ellos. Sus
 * ejemplos (`mockValues`) cuadran con los de las filas.
 */

/** Cómo se escribe el valor de un campo. */
export type PrintFieldType =
  /** Tal cual. */
  | "text"
  /** Cantidad: sin decimales si es entera; si no, con dos. */
  | "quantity"
  /**
   * Importe: siempre con dos decimales y sin moneda (según el cliente puede
   * ser en soles, en dólares...).
   */
  | "money";

export interface PrintDataField {
  key: string;
  /** El nombre que ve quien arma la plantilla; es también su encabezado. */
  label: string;
  type: PrintFieldType;
  /** Lo que se escribe si el registro no trae el dato. Por defecto, nada. */
  empty?: string;
  /** Ancho de su columna al agregarla, en mm. Sin él, rellena lo que sobra. */
  widthMm?: number;
  align: "left" | "right";
  /**
   * `qr`: lo que codifica un QR (lo muestra el componente QR, no un Texto).
   * `barcode`: lo que codifica un código de barras (lo ofrece el componente
   * Código de barras; un Texto también lo puede mostrar).
   * `image`: la dirección de una imagen; en una Tabla de datos su columna es
   * una Imagen (de `widthMm` × `heightMm`), no un Texto.
   */
  kind?: "qr" | "barcode" | "image";
  /** Solo las columnas de imagen: el alto de la imagen, en mm. */
  heightMm?: number;
  /**
   * La columna arranca cortando con «...» lo que no entra en su ancho (la
   * descripción de la guía de hoy). Necesita `widthMm`; se cambia en
   * «Ajuste del texto» de su Texto.
   */
  cut?: boolean;
  /**
   * Cómo se pinta la columna, como en las hojas de hoy (SheetColumn.tone en
   * shared/utils/sheetDocument.ts): `code`, un punto más chica y en gris (un
   * código junto a la descripción); `muted`, en gris. Es como arrancan sus
   * Textos; se cambian en el editor como siempre.
   */
  tone?: "code" | "muted";
}

export type PrintDataRow = Record<string, string | number | null>;

export interface PrintDataSource {
  id: PrintDataSourceId;
  label: string;
  fields: readonly PrintDataField[];
  /** Las columnas con que arranca una Tabla de datos de esta fuente. */
  defaultColumns: readonly string[];
  mockRows: readonly PrintDataRow[];
  /** Valores sueltos del documento: uno por Texto. */
  values?: readonly PrintDataField[];
  mockValues?: PrintDataRow;
}

export type PrintDataSourceId =
  | "invoice_items"
  | "delivery_label"
  | "barcode_label"
  | "bundle_ticket"
  | "operator_badge"
  | "remision_guide"
  | "transfer_guide"
  | "production_guide"
  | "intake_guide"
  | "material_guide"
  | "purchase_order"
  | "service_order"
  | "service_order_garments"
  | "customer_service_order"
  | "production_order"
  | "production_order_garments"
  | "production_order_images"
  | "material_requirement"
  | "recipe"
  | "style_operations"
  | "style_operations_machines"
  | "bundle_sheet"
  | "work_log_batch";

// Guía de remisión (openRemisionGuidePdf, shared/utils/remisionGuidePdf.ts):
// el Detalle de Envío en filas y los datos del envío sueltos. Llegan ya
// compuestos, como hoy los arma cada envoltorio (generateRemisionGuide en
// ventas): la descripción «[SKU] Producto - Variación», la dirección con
// « / », la fecha escrita y la cantidad con tres decimales.
const REMISION_GUIDE: PrintDataSource = {
  id: "remision_guide",
  label: "Datos de la guía",
  fields: [
    // El número de la fila (1, 2, 3...).
    { key: "index", label: "#", type: "text", widthMm: 9, align: "left" },
    {
      key: "description",
      label: "Descripción",
      type: "text",
      widthMm: 105,
      align: "left",
      cut: true,
    },
    // «Unidades» si el producto no dice otra cosa.
    {
      key: "unit",
      label: "Unidad de Medida",
      type: "text",
      widthMm: 34,
      align: "left",
    },
    { key: "quantity", label: "Cantidad", type: "text", align: "left" },
  ],
  defaultColumns: ["index", "description", "unit", "quantity"],
  // Hasta 40 filas de ejemplo, sin repetir ningún producto.
  mockRows: [
    {
      index: "1",
      description: "[POL-001] Polo básico algodón - Negro, M",
      unit: "Unidades",
      quantity: "12.000",
    },
    {
      index: "2",
      description: "[JEA-002] Jean slim fit - Azul, 32",
      unit: "Unidades",
      quantity: "8.000",
    },
    {
      index: "3",
      description: "[MED-003] Medias deportivas pack x3 - Blanco",
      unit: "Unidades",
      quantity: "5.000",
    },
    {
      index: "4",
      description: "[GOR-004] Gorra trucker - Negro",
      unit: "Unidades",
      quantity: "10.000",
    },
    {
      index: "5",
      description: "[CAS-005] Casaca rompevientos - Azul, M",
      unit: "Unidades",
      quantity: "20.000",
    },
    {
      index: "6",
      description: "[JOG-006] Jogger french terry - Gris, S",
      unit: "Unidades",
      quantity: "15.000",
    },
    {
      index: "7",
      description: "[CAM-007] Camisa oxford manga larga - Celeste, L",
      unit: "Unidades",
      quantity: "6.000",
    },
    {
      index: "8",
      description: "[BLU-008] Blusa de lino - Crudo, M",
      unit: "Unidades",
      quantity: "3.000",
    },
    {
      index: "9",
      description: "[VES-009] Vestido midi floral - Rosa, S",
      unit: "Unidades",
      quantity: "12.000",
    },
    {
      index: "10",
      description: "[SHO-010] Short de baño - Turquesa, M",
      unit: "Unidades",
      quantity: "8.000",
    },
    {
      index: "11",
      description: "[POL-011] Polera con capucha - Verde, L",
      unit: "Unidades",
      quantity: "5.000",
    },
    {
      index: "12",
      description: "[CHO-012] Chompa de alpaca - Beige, M",
      unit: "Unidades",
      quantity: "10.000",
    },
    {
      index: "13",
      description: "[PAN-013] Pantalón cargo - Caqui, 34",
      unit: "Unidades",
      quantity: "20.000",
    },
    {
      index: "14",
      description: "[FAL-014] Falda plisada - Negro, S",
      unit: "Unidades",
      quantity: "15.000",
    },
    {
      index: "15",
      description: "[BIV-015] Bividí deportivo - Blanco, M",
      unit: "Unidades",
      quantity: "6.000",
    },
    {
      index: "16",
      description: "[LEG-016] Leggings de compresión - Negro, M",
      unit: "Unidades",
      quantity: "3.000",
    },
    {
      index: "17",
      description: "[CHA-017] Chaleco acolchado - Azul marino, L",
      unit: "Unidades",
      quantity: "12.000",
    },
    {
      index: "18",
      description: "[BER-018] Bermuda de drill - Arena, 32",
      unit: "Unidades",
      quantity: "8.000",
    },
    {
      index: "19",
      description: "[POL-019] Polo piqué - Rojo, M",
      unit: "Unidades",
      quantity: "5.000",
    },
    {
      index: "20",
      description: "[CAM-020] Camiseta de fútbol - Blanco, L",
      unit: "Unidades",
      quantity: "10.000",
    },
    {
      index: "21",
      description: "[BUZ-021] Buzo completo - Gris, M",
      unit: "Unidades",
      quantity: "20.000",
    },
    {
      index: "22",
      description: "[PIJ-022] Pijama de franela - Cuadros, M",
      unit: "Unidades",
      quantity: "15.000",
    },
    {
      index: "23",
      description: "[BOX-023] Bóxer de algodón pack x2 - Surtido, M",
      unit: "Unidades",
      quantity: "6.000",
    },
    {
      index: "24",
      description: "[TOP-024] Top deportivo - Lila, S",
      unit: "Unidades",
      quantity: "3.000",
    },
    {
      index: "25",
      description: "[SAC-025] Saco de vestir - Gris, 40",
      unit: "Unidades",
      quantity: "12.000",
    },
    {
      index: "26",
      description: "[COR-026] Corbata de seda - Vino",
      unit: "Unidades",
      quantity: "8.000",
    },
    {
      index: "27",
      description: "[CIN-027] Cinturón de cuero - Marrón, 90",
      unit: "Unidades",
      quantity: "5.000",
    },
    {
      index: "28",
      description: "[BUF-028] Bufanda tejida - Mostaza",
      unit: "Unidades",
      quantity: "10.000",
    },
    {
      index: "29",
      description: "[GUA-029] Guantes de lana - Negro",
      unit: "Unidades",
      quantity: "20.000",
    },
    {
      index: "30",
      description: "[SOM-030] Sombrero de paja - Natural",
      unit: "Unidades",
      quantity: "15.000",
    },
    {
      index: "31",
      description: "[MOC-031] Mochila urbana - Negro",
      unit: "Unidades",
      quantity: "6.000",
    },
    {
      index: "32",
      description: "[CAN-032] Canguro deportivo - Rojo",
      unit: "Unidades",
      quantity: "3.000",
    },
    {
      index: "33",
      description: "[ZAP-033] Zapatillas de lona - Blanco, 40",
      unit: "Unidades",
      quantity: "12.000",
    },
    {
      index: "34",
      description: "[SAN-034] Sandalias de cuero - Marrón, 38",
      unit: "Unidades",
      quantity: "8.000",
    },
    {
      index: "35",
      description: "[OVE-035] Overol de jean - Azul, M",
      unit: "Unidades",
      quantity: "5.000",
    },
    {
      index: "36",
      description: "[ENT-036] Enterizo de punto - Negro, S",
      unit: "Unidades",
      quantity: "10.000",
    },
    {
      index: "37",
      description: "[CAR-037] Cárdigan de hilo - Crema, M",
      unit: "Unidades",
      quantity: "20.000",
    },
    {
      index: "38",
      description: "[POL-038] Polo manga larga térmico - Gris, L",
      unit: "Unidades",
      quantity: "15.000",
    },
    {
      index: "39",
      description: "[PAN-039] Pantalón de vestir - Negro, 32",
      unit: "Unidades",
      quantity: "6.000",
    },
    {
      index: "40",
      description: "[CHA-040] Chalina de vicuña - Natural",
      unit: "Unidades",
      quantity: "3.000",
    },
  ],
  values: [
    // Con su serie: «T001-00000123» (la venta usa el id del pedido).
    {
      key: "guideNumber",
      label: "Número de guía",
      type: "text",
      align: "left",
    },
    {
      key: "recipientName",
      label: "Destinatario",
      type: "text",
      align: "left",
    },
    {
      key: "documentType",
      label: "Tipo de documento",
      type: "text",
      align: "left",
    },
    {
      key: "documentNumber",
      label: "Número de documento",
      type: "text",
      align: "left",
    },
    // País / región / ciudad / barrio / dirección.
    {
      key: "destinationAddress",
      label: "Dirección de llegada",
      type: "text",
      align: "left",
    },
    {
      key: "issueDate",
      label: "Fecha de emisión",
      type: "text",
      align: "left",
    },
    {
      key: "transferReason",
      label: "Motivo de traslado",
      type: "text",
      align: "left",
    },
    // La de la venta o, si no trae, la de partida de la empresa.
    {
      key: "originAddress",
      label: "Dirección de partida",
      type: "text",
      align: "left",
    },
    // Quien entrega, si no es la empresa (las guías de producción).
    {
      key: "originName",
      label: "Entregado por",
      type: "text",
      align: "left",
    },
    // El método de envío de la venta.
    {
      key: "carrierName",
      label: "Empresa de transporte",
      type: "text",
      align: "left",
    },
  ],
  mockValues: {
    guideNumber: "T001-00000123",
    recipientName: "Juan Carlos Pérez Gómez",
    documentType: "DNI",
    documentNumber: "45678912",
    destinationAddress:
      "Perú / Lima / Lima / San Juan de Lurigancho / Av. Los Olivos 123 Las Flores",
    issueDate: "30/10/2026",
    transferReason: "Venta",
    originAddress: "Jr. Gamarra 456 La Victoria",
    originName: null,
    carrierName: "Shalom",
  },
};

// Los materiales de ejemplo del envío de material: 40, sin repetir.
const MATERIAL_ROWS: PrintDataRow[] = [
  {
    index: "1",
    description: "Tela jersey 30/1 - Algodón peinado",
    unit: "Metros",
    quantity: "120.000",
  },
  {
    index: "2",
    description: "Tela french terry - Algodón",
    unit: "Metros",
    quantity: "85.500",
  },
  {
    index: "3",
    description: "Tela piqué - Algodón",
    unit: "Metros",
    quantity: "40.000",
  },
  {
    index: "4",
    description: "Rib 1x1 - Algodón lycra",
    unit: "Metros",
    quantity: "18.250",
  },
  {
    index: "5",
    description: "Tela polar - Poliéster",
    unit: "Metros",
    quantity: "60.000",
  },
  {
    index: "6",
    description: "Drill - Algodón",
    unit: "Metros",
    quantity: "12.000",
  },
  {
    index: "7",
    description: "Denim 12 oz - Índigo",
    unit: "Metros",
    quantity: "300.000",
  },
  {
    index: "8",
    description: "Popelina - Algodón",
    unit: "Metros",
    quantity: "25.000",
  },
  {
    index: "9",
    description: "Lino - Natural",
    unit: "Metros",
    quantity: "120.000",
  },
  {
    index: "10",
    description: "Gabardina - Poliéster",
    unit: "Metros",
    quantity: "85.500",
  },
  {
    index: "11",
    description: "Tela dry fit - Poliéster",
    unit: "Metros",
    quantity: "40.000",
  },
  {
    index: "12",
    description: "Franela - Algodón",
    unit: "Metros",
    quantity: "18.250",
  },
  {
    index: "13",
    description: "Tela oxford - Algodón",
    unit: "Metros",
    quantity: "60.000",
  },
  {
    index: "14",
    description: "Chalis - Viscosa",
    unit: "Metros",
    quantity: "12.000",
  },
  {
    index: "15",
    description: "Tela de forro - Poliéster",
    unit: "Metros",
    quantity: "300.000",
  },
  {
    index: "16",
    description: "Entretela fusionable - Blanca",
    unit: "Metros",
    quantity: "25.000",
  },
  {
    index: "17",
    description: "Hilo de coser 40/2 - Poliéster",
    unit: "Kilos",
    quantity: "120.000",
  },
  {
    index: "18",
    description: "Hilo de remalle - Poliéster",
    unit: "Kilos",
    quantity: "85.500",
  },
  {
    index: "19",
    description: "Hilo elástico - Nylon",
    unit: "Kilos",
    quantity: "40.000",
  },
  {
    index: "20",
    description: "Hilo de bordar - Rayón",
    unit: "Kilos",
    quantity: "18.250",
  },
  {
    index: "21",
    description: "Cierre de metal 18 cm - Bronce",
    unit: "Unidades",
    quantity: "60.000",
  },
  {
    index: "22",
    description: "Cierre invisible 20 cm - Negro",
    unit: "Unidades",
    quantity: "12.000",
  },
  {
    index: "23",
    description: "Botón de 4 huecos - Nácar",
    unit: "Unidades",
    quantity: "300.000",
  },
  {
    index: "24",
    description: "Botón de presión - Metal",
    unit: "Unidades",
    quantity: "25.000",
  },
  {
    index: "25",
    description: "Remache - Cobre",
    unit: "Unidades",
    quantity: "120.000",
  },
  {
    index: "26",
    description: "Elástico de 3 cm - Blanco",
    unit: "Metros",
    quantity: "85.500",
  },
  {
    index: "27",
    description: "Cinta de faya - Negro",
    unit: "Metros",
    quantity: "40.000",
  },
  {
    index: "28",
    description: "Cordón plano - Algodón",
    unit: "Metros",
    quantity: "18.250",
  },
  {
    index: "29",
    description: "Etiqueta tejida - Marca",
    unit: "Unidades",
    quantity: "60.000",
  },
  {
    index: "30",
    description: "Etiqueta de talla - Satín",
    unit: "Unidades",
    quantity: "12.000",
  },
  {
    index: "31",
    description: "Etiqueta de composición - Satín",
    unit: "Unidades",
    quantity: "300.000",
  },
  {
    index: "32",
    description: "Bolsa de empaque - Polietileno",
    unit: "Unidades",
    quantity: "25.000",
  },
  {
    index: "33",
    description: "Hang tag - Cartulina",
    unit: "Unidades",
    quantity: "120.000",
  },
  {
    index: "34",
    description: "Velcro de 2 cm - Negro",
    unit: "Metros",
    quantity: "85.500",
  },
  {
    index: "35",
    description: "Sesgo - Algodón",
    unit: "Metros",
    quantity: "40.000",
  },
  {
    index: "36",
    description: "Malla tul - Nylon",
    unit: "Metros",
    quantity: "18.250",
  },
  {
    index: "37",
    description: "Tela softshell - Poliéster",
    unit: "Metros",
    quantity: "60.000",
  },
  {
    index: "38",
    description: "Corrosil - Algodón",
    unit: "Metros",
    quantity: "12.000",
  },
  {
    index: "39",
    description: "Tela taslán - Nylon",
    unit: "Metros",
    quantity: "300.000",
  },
  {
    index: "40",
    description: "Tela antifluido - Poliéster",
    unit: "Metros",
    quantity: "25.000",
  },
];

// Los materiales de ejemplo de la Orden de compra: 40, sin repetir.
const PURCHASE_ROWS: PrintDataRow[] = [
  {
    quantity: "120",
    unit: "KG",
    code: "MAT-001",
    description: "Tela jersey 30/1 algodón peinado",
    unitPrice: "S/ 28.50",
    total: "S/ 3,420.00",
    tax: "Incluye IGV",
  },
  {
    quantity: "85.5",
    unit: "KG",
    code: "MAT-002",
    description: "Tela french terry",
    unitPrice: "S/ 29.00",
    total: "S/ 2,479.50",
    tax: "Más IGV",
  },
  {
    quantity: "40",
    unit: "KG",
    code: "MAT-003",
    description: "Tela piqué",
    unitPrice: "S/ 29.50",
    total: "S/ 1,180.00",
    tax: "Incluye IGV",
  },
  {
    quantity: "18.25",
    unit: "KG",
    code: "MAT-004",
    description: "Rib 1x1 algodón lycra",
    unitPrice: "S/ 30.00",
    total: "S/ 547.50",
    tax: "Sin declarar",
  },
  {
    quantity: "60",
    unit: "KG",
    code: "MAT-005",
    description: "Tela polar",
    unitPrice: "S/ 30.50",
    total: "S/ 1,830.00",
    tax: "Incluye IGV",
  },
  {
    quantity: "12",
    unit: "MT",
    code: "MAT-006",
    description: "Drill",
    unitPrice: "S/ 9.90",
    total: "S/ 118.80",
    tax: "Más IGV",
  },
  {
    quantity: "300",
    unit: "MT",
    code: "MAT-007",
    description: "Denim 12 oz",
    unitPrice: "S/ 10.40",
    total: "S/ 3,120.00",
    tax: "Incluye IGV",
  },
  {
    quantity: "25",
    unit: "MT",
    code: "MAT-008",
    description: "Popelina",
    unitPrice: "S/ 10.90",
    total: "S/ 272.50",
    tax: "Sin declarar",
  },
  {
    quantity: "1,000",
    unit: "MT",
    code: "MAT-009",
    description: "Lino natural",
    unitPrice: "S/ 11.40",
    total: "S/ 11,400.00",
    tax: "Incluye IGV",
  },
  {
    quantity: "5,000",
    unit: "MT",
    code: "MAT-010",
    description: "Gabardina",
    unitPrice: "S/ 11.90",
    total: "S/ 59,500.00",
    tax: "Más IGV",
  },
  {
    quantity: "120",
    unit: "KG",
    code: "MAT-011",
    description: "Tela dry fit",
    unitPrice: "S/ 28.50",
    total: "S/ 3,420.00",
    tax: "Incluye IGV",
  },
  {
    quantity: "85.5",
    unit: "MT",
    code: "MAT-012",
    description: "Franela",
    unitPrice: "S/ 10.40",
    total: "S/ 889.20",
    tax: "Sin declarar",
  },
  {
    quantity: "40",
    unit: "MT",
    code: "MAT-013",
    description: "Tela oxford",
    unitPrice: "S/ 10.90",
    total: "S/ 436.00",
    tax: "Incluye IGV",
  },
  {
    quantity: "18.25",
    unit: "MT",
    code: "MAT-014",
    description: "Chalis viscosa",
    unitPrice: "S/ 11.40",
    total: "S/ 208.05",
    tax: "Más IGV",
  },
  {
    quantity: "60",
    unit: "MT",
    code: "MAT-015",
    description: "Tela de forro",
    unitPrice: "S/ 11.90",
    total: "S/ 714.00",
    tax: "Incluye IGV",
  },
  {
    quantity: "12",
    unit: "MT",
    code: "MAT-016",
    description: "Entretela fusionable",
    unitPrice: "S/ 9.90",
    total: "S/ 118.80",
    tax: "Sin declarar",
  },
  {
    quantity: "300",
    unit: "UND",
    code: "MAT-017",
    description: "Hilo de coser 40/2",
    unitPrice: "S/ 0.85",
    total: "S/ 255.00",
    tax: "Incluye IGV",
  },
  {
    quantity: "25",
    unit: "UND",
    code: "MAT-018",
    description: "Hilo de remalle",
    unitPrice: "S/ 1.35",
    total: "S/ 33.75",
    tax: "Más IGV",
  },
  {
    quantity: "1,000",
    unit: "UND",
    code: "MAT-019",
    description: "Hilo elástico",
    unitPrice: "S/ 1.85",
    total: "S/ 1,850.00",
    tax: "Incluye IGV",
  },
  {
    quantity: "5,000",
    unit: "UND",
    code: "MAT-020",
    description: "Hilo de bordar",
    unitPrice: "S/ 2.35",
    total: "S/ 11,750.00",
    tax: "Sin declarar",
  },
  {
    quantity: "120",
    unit: "UND",
    code: "MAT-021",
    description: "Cierre de metal 18 cm",
    unitPrice: "S/ 0.35",
    total: "S/ 42.00",
    tax: "Incluye IGV",
  },
  {
    quantity: "85.5",
    unit: "UND",
    code: "MAT-022",
    description: "Cierre invisible 20 cm",
    unitPrice: "S/ 0.85",
    total: "S/ 72.67",
    tax: "Más IGV",
  },
  {
    quantity: "40",
    unit: "UND",
    code: "MAT-023",
    description: "Botón de 4 huecos",
    unitPrice: "S/ 1.35",
    total: "S/ 54.00",
    tax: "Incluye IGV",
  },
  {
    quantity: "18.25",
    unit: "UND",
    code: "MAT-024",
    description: "Botón de presión",
    unitPrice: "S/ 1.85",
    total: "S/ 33.76",
    tax: "Sin declarar",
  },
  {
    quantity: "60",
    unit: "UND",
    code: "MAT-025",
    description: "Remache de cobre",
    unitPrice: "S/ 2.35",
    total: "S/ 141.00",
    tax: "Incluye IGV",
  },
  {
    quantity: "12",
    unit: "MT",
    code: "MAT-026",
    description: "Elástico de 3 cm",
    unitPrice: "S/ 9.90",
    total: "S/ 118.80",
    tax: "Más IGV",
  },
  {
    quantity: "300",
    unit: "MT",
    code: "MAT-027",
    description: "Cinta de faya",
    unitPrice: "S/ 10.40",
    total: "S/ 3,120.00",
    tax: "Incluye IGV",
  },
  {
    quantity: "25",
    unit: "MT",
    code: "MAT-028",
    description: "Cordón plano",
    unitPrice: "S/ 10.90",
    total: "S/ 272.50",
    tax: "Sin declarar",
  },
  {
    quantity: "1,000",
    unit: "UND",
    code: "MAT-029",
    description: "Etiqueta tejida de marca",
    unitPrice: "S/ 1.85",
    total: "S/ 1,850.00",
    tax: "Incluye IGV",
  },
  {
    quantity: "5,000",
    unit: "UND",
    code: "MAT-030",
    description: "Etiqueta de talla",
    unitPrice: "S/ 2.35",
    total: "S/ 11,750.00",
    tax: "Más IGV",
  },
  {
    quantity: "120",
    unit: "UND",
    code: "MAT-031",
    description: "Etiqueta de composición",
    unitPrice: "S/ 0.35",
    total: "S/ 42.00",
    tax: "Incluye IGV",
  },
  {
    quantity: "85.5",
    unit: "UND",
    code: "MAT-032",
    description: "Bolsa de empaque",
    unitPrice: "S/ 0.85",
    total: "S/ 72.67",
    tax: "Sin declarar",
  },
  {
    quantity: "40",
    unit: "UND",
    code: "MAT-033",
    description: "Hang tag",
    unitPrice: "S/ 1.35",
    total: "S/ 54.00",
    tax: "Incluye IGV",
  },
  {
    quantity: "18.25",
    unit: "MT",
    code: "MAT-034",
    description: "Velcro de 2 cm",
    unitPrice: "S/ 11.40",
    total: "S/ 208.05",
    tax: "Más IGV",
  },
  {
    quantity: "60",
    unit: "MT",
    code: "MAT-035",
    description: "Sesgo de algodón",
    unitPrice: "S/ 11.90",
    total: "S/ 714.00",
    tax: "Incluye IGV",
  },
  {
    quantity: "12",
    unit: "MT",
    code: "MAT-036",
    description: "Malla tul",
    unitPrice: "S/ 9.90",
    total: "S/ 118.80",
    tax: "Sin declarar",
  },
  {
    quantity: "300",
    unit: "MT",
    code: "MAT-037",
    description: "Tela softshell",
    unitPrice: "S/ 10.40",
    total: "S/ 3,120.00",
    tax: "Incluye IGV",
  },
  {
    quantity: "25",
    unit: "KG",
    code: "MAT-038",
    description: "Corrosil",
    unitPrice: "S/ 29.50",
    total: "S/ 737.50",
    tax: "Más IGV",
  },
  {
    quantity: "1,000",
    unit: "MT",
    code: "MAT-039",
    description: "Tela taslán",
    unitPrice: "S/ 11.40",
    total: "S/ 11,400.00",
    tax: "Incluye IGV",
  },
  {
    quantity: "5,000",
    unit: "MT",
    code: "MAT-040",
    description: "Tela antifluido",
    unitPrice: "S/ 11.90",
    total: "S/ 59,500.00",
    tax: "Sin declarar",
  },
];

// Las columnas de las hojas de la Orden de compra y la de servicio (los
// materiales o los servicios), con los anchos y tonos de hoy.
const PURCHASE_FIELDS: PrintDataField[] = [
  {
    key: "quantity",
    label: "Cantidad",
    type: "text",
    widthMm: 24,
    align: "right",
  },
  { key: "unit", label: "U/M", type: "text", widthMm: 20, align: "left" },
  {
    key: "code",
    label: "Código",
    type: "text",
    widthMm: 34,
    align: "left",
    empty: "—",
    tone: "code",
  },
  { key: "description", label: "Descripción", type: "text", align: "left" },
  // El unitario: el total de la línea entre la cantidad.
  {
    key: "unitPrice",
    label: "Importe",
    type: "text",
    widthMm: 30,
    align: "right",
  },
  {
    key: "total",
    label: "Costo total",
    type: "text",
    widthMm: 34,
    align: "right",
  },
  {
    key: "tax",
    label: "IGV",
    type: "text",
    widthMm: 26,
    align: "left",
    tone: "muted",
  },
];

export const PRINT_DATA_SOURCES: Record<PrintDataSourceId, PrintDataSource> = {
  // Comprobantes: la tabla del ticket de 80 mm (invoiceTicketPdf.ts). Son los
  // `items` de loadInvoicePrintData y, después, en la misma tabla, sus
  // `extraLines`: el envío de los comprobantes antiguos y los descuentos del
  // pedido, que solo traen descripción y su importe en la columna P.U.
  invoice_items: {
    id: "invoice_items",
    label: "Ítems del comprobante",
    fields: [
      {
        key: "quantity",
        label: "Cant.",
        type: "quantity",
        widthMm: 9,
        align: "left",
      },
      { key: "unit", label: "U.M.", type: "text", widthMm: 8, align: "left" },
      { key: "description", label: "Descripción", type: "text", align: "left" },
      {
        key: "unitPrice",
        label: "P.U.",
        type: "money",
        widthMm: 12,
        align: "right",
      },
      // Descuento de la línea completa, no por unidad.
      {
        key: "discount",
        label: "Desc.",
        type: "money",
        empty: "—",
        widthMm: 11,
        align: "right",
      },
      {
        key: "total",
        label: "Importe",
        type: "money",
        widthMm: 13,
        align: "right",
      },
    ],
    // Las del ticket de hoy.
    defaultColumns: [
      "quantity",
      "unit",
      "description",
      "unitPrice",
      "discount",
    ],
    mockRows: [
      {
        quantity: 2,
        unit: "NIU",
        description: "Polo básico algodón - Negro / M",
        unitPrice: 39.9,
        discount: null,
        total: 79.8,
      },
      {
        quantity: 1,
        unit: "NIU",
        description: "Jean slim fit - Azul / 32",
        unitPrice: 129.9,
        discount: 10,
        total: 119.9,
      },
      {
        quantity: 3,
        unit: "NIU",
        description: "Medias deportivas pack x3",
        unitPrice: 15,
        discount: null,
        total: 45,
      },
      {
        quantity: 1,
        unit: "ZZ",
        description: "Servicio de bordado personalizado",
        unitPrice: 25,
        discount: null,
        total: 25,
      },
      {
        quantity: 1,
        unit: "NIU",
        description: "Gorra trucker - Negro",
        unitPrice: 35,
        discount: 5,
        total: 30,
      },
      // extraLines: sin cantidad, unidad ni descuento.
      {
        quantity: null,
        unit: null,
        description: "Envío a domicilio - Lima",
        unitPrice: 15,
        discount: "",
        total: 15,
      },
      {
        quantity: null,
        unit: null,
        description: "Descuento campaña de verano",
        unitPrice: -20,
        discount: "",
        total: -20,
      },
      // Más productos, para ver hasta 40 filas: ninguno se repite.
      {
        quantity: 1,
        unit: "NIU",
        description: "Casaca rompevientos - Azul / M",
        unitPrice: 149.9,
        discount: null,
        total: 149.9,
      },
      {
        quantity: 2,
        unit: "NIU",
        description: "Jogger french terry - Gris / S",
        unitPrice: 89.9,
        discount: null,
        total: 179.8,
      },
      {
        quantity: 3,
        unit: "NIU",
        description: "Camisa oxford manga larga - Celeste / L",
        unitPrice: 99.9,
        discount: null,
        total: 299.7,
      },
      {
        quantity: 4,
        unit: "NIU",
        description: "Blusa de lino - Crudo / M",
        unitPrice: 79.9,
        discount: null,
        total: 319.6,
      },
      {
        quantity: 1,
        unit: "NIU",
        description: "Vestido midi floral - Rosa / S",
        unitPrice: 139.9,
        discount: null,
        total: 139.9,
      },
      {
        quantity: 2,
        unit: "NIU",
        description: "Short de baño - Turquesa / M",
        unitPrice: 59.9,
        discount: null,
        total: 119.8,
      },
      {
        quantity: 3,
        unit: "NIU",
        description: "Polera con capucha - Verde / L",
        unitPrice: 109.9,
        discount: null,
        total: 329.7,
      },
      {
        quantity: 4,
        unit: "NIU",
        description: "Chompa de alpaca - Beige / M",
        unitPrice: 219.9,
        discount: null,
        total: 879.6,
      },
      {
        quantity: 1,
        unit: "NIU",
        description: "Pantalón cargo - Caqui / 34",
        unitPrice: 119.9,
        discount: null,
        total: 119.9,
      },
      {
        quantity: 2,
        unit: "NIU",
        description: "Falda plisada - Negro / S",
        unitPrice: 84.9,
        discount: null,
        total: 169.8,
      },
      {
        quantity: 3,
        unit: "NIU",
        description: "Bividí deportivo - Blanco / M",
        unitPrice: 29.9,
        discount: null,
        total: 89.7,
      },
      {
        quantity: 4,
        unit: "NIU",
        description: "Leggings de compresión - Negro / M",
        unitPrice: 69.9,
        discount: null,
        total: 279.6,
      },
      {
        quantity: 1,
        unit: "NIU",
        description: "Chaleco acolchado - Azul marino / L",
        unitPrice: 159.9,
        discount: null,
        total: 159.9,
      },
      {
        quantity: 2,
        unit: "NIU",
        description: "Bermuda de drill - Arena / 32",
        unitPrice: 74.9,
        discount: null,
        total: 149.8,
      },
      {
        quantity: 3,
        unit: "NIU",
        description: "Polo piqué - Rojo / M",
        unitPrice: 54.9,
        discount: null,
        total: 164.7,
      },
      {
        quantity: 4,
        unit: "NIU",
        description: "Camiseta de fútbol - Blanco / L",
        unitPrice: 89.9,
        discount: null,
        total: 359.6,
      },
      {
        quantity: 1,
        unit: "NIU",
        description: "Buzo completo - Gris / M",
        unitPrice: 179.9,
        discount: null,
        total: 179.9,
      },
      {
        quantity: 2,
        unit: "NIU",
        description: "Pijama de franela - Cuadros / M",
        unitPrice: 99.9,
        discount: null,
        total: 199.8,
      },
      {
        quantity: 3,
        unit: "NIU",
        description: "Bóxer de algodón pack x2 - Surtido / M",
        unitPrice: 39.9,
        discount: null,
        total: 119.7,
      },
      {
        quantity: 4,
        unit: "NIU",
        description: "Top deportivo - Lila / S",
        unitPrice: 49.9,
        discount: null,
        total: 199.6,
      },
      {
        quantity: 1,
        unit: "NIU",
        description: "Saco de vestir - Gris / 40",
        unitPrice: 349.9,
        discount: null,
        total: 349.9,
      },
      {
        quantity: 2,
        unit: "NIU",
        description: "Corbata de seda - Vino",
        unitPrice: 69.9,
        discount: null,
        total: 139.8,
      },
      {
        quantity: 3,
        unit: "NIU",
        description: "Cinturón de cuero - Marrón / 90",
        unitPrice: 79.9,
        discount: null,
        total: 239.7,
      },
      {
        quantity: 4,
        unit: "NIU",
        description: "Bufanda tejida - Mostaza",
        unitPrice: 44.9,
        discount: null,
        total: 179.6,
      },
      {
        quantity: 1,
        unit: "NIU",
        description: "Guantes de lana - Negro",
        unitPrice: 34.9,
        discount: null,
        total: 34.9,
      },
      {
        quantity: 2,
        unit: "NIU",
        description: "Sombrero de paja - Natural",
        unitPrice: 59.9,
        discount: null,
        total: 119.8,
      },
      {
        quantity: 3,
        unit: "NIU",
        description: "Mochila urbana - Negro",
        unitPrice: 129.9,
        discount: null,
        total: 389.7,
      },
      {
        quantity: 4,
        unit: "NIU",
        description: "Canguro deportivo - Rojo",
        unitPrice: 49.9,
        discount: null,
        total: 199.6,
      },
      {
        quantity: 1,
        unit: "NIU",
        description: "Zapatillas de lona - Blanco / 40",
        unitPrice: 119.9,
        discount: null,
        total: 119.9,
      },
      {
        quantity: 2,
        unit: "NIU",
        description: "Sandalias de cuero - Marrón / 38",
        unitPrice: 99.9,
        discount: null,
        total: 199.8,
      },
      {
        quantity: 3,
        unit: "NIU",
        description: "Overol de jean - Azul / M",
        unitPrice: 159.9,
        discount: null,
        total: 479.7,
      },
      {
        quantity: 4,
        unit: "NIU",
        description: "Enterizo de punto - Negro / S",
        unitPrice: 119.9,
        discount: null,
        total: 479.6,
      },
      {
        quantity: 1,
        unit: "NIU",
        description: "Cárdigan de hilo - Crema / M",
        unitPrice: 109.9,
        discount: null,
        total: 109.9,
      },
    ],
    // Los datos sueltos del comprobante (loadInvoicePrintData en
    // invoiceTicketPdf.ts): el comprobante, el local y el cliente, y los
    // totales. El cajero es quien emitió el comprobante. Los de la empresa no
    // van aquí: ya están en la sesión (editor/lib/context-values). La cantidad de productos suma las de los ítems; las
    // operaciones y el IGV salen de ticketTaxLines (exoneradas cuando el
    // comprobante no lleva IGV).
    values: [
      {
        key: "establishmentAddress",
        label: "Dirección del local",
        type: "text",
        align: "left",
      },
      {
        key: "documentType",
        label: "Tipo de comprobante",
        type: "text",
        align: "left",
      },
      {
        key: "serieNumber",
        label: "Serie y número",
        type: "text",
        align: "left",
      },
      {
        key: "orderNumber",
        label: "Número de pedido",
        type: "text",
        align: "left",
      },
      {
        key: "issuedAt",
        label: "Fecha de emisión",
        type: "text",
        align: "left",
      },
      { key: "customerName", label: "Cliente", type: "text", align: "left" },
      {
        key: "customerDocumentType",
        label: "Tipo de documento del cliente",
        type: "text",
        align: "left",
      },
      {
        key: "customerDocument",
        label: "Documento del cliente",
        type: "text",
        align: "left",
      },
      {
        key: "customerAddress",
        label: "Dirección del cliente",
        type: "text",
        align: "left",
      },
      {
        key: "modifiedDocument",
        label: "Comprobante que modifica (nota)",
        type: "text",
        align: "left",
      },
      {
        key: "noteReason",
        label: "Motivo (nota)",
        type: "text",
        align: "left",
      },
      { key: "cashier", label: "Cajero", type: "text", align: "left" },
      {
        key: "totalQuantity",
        label: "Total de productos",
        type: "quantity",
        align: "right",
      },
      {
        key: "taxedAmount",
        label: "Op. gravadas",
        type: "money",
        align: "right",
      },
      {
        key: "exemptAmount",
        label: "Op. exoneradas",
        type: "money",
        align: "right",
      },
      { key: "igv", label: "IGV", type: "money", align: "right" },
      {
        key: "freeAmount",
        label: "Op. gratuitas",
        type: "money",
        align: "right",
      },
      {
        key: "totalAmount",
        label: "Importe total",
        type: "money",
        align: "right",
      },
      {
        key: "amountInWords",
        label: "Importe en letras",
        type: "text",
        align: "left",
      },
      {
        key: "qrCode",
        label: "Código QR del comprobante",
        type: "text",
        align: "left",
        kind: "qr",
      },
      // Las leyendas de SUNAT (región selva, transferencia gratuita), una
      // por línea.
      { key: "legends", label: "Leyendas SUNAT", type: "text", align: "left" },
      // El de Configuración (InvoiceFooterMessage); sin él, la política de
      // cambios de siempre.
      {
        key: "footerMessage",
        label: "Mensaje del pie",
        type: "text",
        align: "left",
      },
    ],
    // Una boleta: sin comprobante que modifica ni motivo (son de las notas de
    // crédito) ni operaciones gratuitas. Los de las filas de ejemplo: 299.70 de ítems + 15 de envío - 20 de
    // descuento, con el IGV del 18 % incluido.
    mockValues: {
      establishmentAddress: "Jr. Gamarra 456 La Victoria",
      documentType: "BOLETA DE VENTA ELECTRÓNICA",
      serieNumber: "B001 - 00000123",
      orderNumber: "1024",
      issuedAt: "29/10/2026 15:42",
      customerName: "María López Torres",
      customerDocumentType: "DNI",
      customerDocument: "45678912",
      customerAddress: "Calle Los Pinos 789, Santiago de Surco",
      modifiedDocument: "",
      noteReason: "",
      cashier: "Carlos Ramírez",
      totalQuantity: 8,
      taxedAmount: 249.75,
      exemptAmount: 0,
      igv: 44.95,
      freeAmount: 0,
      totalAmount: 294.7,
      amountInWords: "DOSCIENTOS NOVENTA Y CUATRO Y 70/100 SOLES",
      // Como el qr_code que guarda SUNAT: RUC|tipo|serie|número|IGV|total|fecha|
      // tipo de documento|documento del cliente.
      qrCode:
        "20601234567|03|B001|00000123|44.95|294.70|2026-10-29|1|45678912|",
      legends: "",
      footerMessage: null,
    },
  },
  // Etiqueta de envío (generateDeliveryLabel): los datos del envío que se
  // llenan al crear la venta. Solo valores sueltos, sin filas.
  delivery_label: {
    id: "delivery_label",
    label: "Datos del envío",
    fields: [],
    defaultColumns: [],
    mockRows: [],
    values: [
      // Nombre y apellidos, en mayúsculas.
      {
        key: "recipientName",
        label: "Destinatario",
        type: "text",
        align: "left",
      },
      {
        key: "recipientDocument",
        label: "RUC/DNI del destinatario",
        type: "text",
        align: "left",
      },
      // Dirección, urbanización, distrito y provincia, juntos.
      { key: "destination", label: "Destino", type: "text", align: "left" },
      // El de quien recibe; si no hay, el del cliente.
      {
        key: "recipientPhone",
        label: "Celular del destinatario",
        type: "text",
        align: "left",
      },
      {
        key: "addressReference",
        label: "Referencia",
        type: "text",
        align: "left",
      },
      {
        key: "receptionPerson",
        label: "Persona que recibe",
        type: "text",
        align: "left",
      },
      // La del local que vende; si no hay, el domicilio fiscal.
      {
        key: "senderAddress",
        label: "Dirección del remitente",
        type: "text",
        align: "left",
      },
    ],
    mockValues: {
      recipientName: "JUAN CARLOS PÉREZ GÓMEZ",
      recipientDocument: "45678912",
      destination: "Av. Los Olivos 123 Las Flores San Juan de Lurigancho Lima",
      recipientPhone: "987654321",
      addressReference: "Frente al parque",
      receptionPerson: "Rosa Gómez",
      senderAddress: "Jr. Gamarra 456 La Victoria",
    },
  },
  // Etiqueta de código de barras (generateBarcodePdf): una por unidad pedida,
  // con los datos de la variación. Solo valores sueltos, sin filas.
  barcode_label: {
    id: "barcode_label",
    label: "Datos de la etiqueta",
    fields: [],
    defaultColumns: [],
    mockRows: [],
    values: [
      // El producto y, entre paréntesis, la variación («Negro-M»).
      {
        key: "title",
        label: "Producto y variación",
        type: "text",
        align: "left",
      },
      // Lo que codifica el código de barras: el SKU de la variación.
      {
        key: "barcodeValue",
        label: "Valor del código de barras",
        type: "text",
        align: "left",
        kind: "barcode",
      },
      // El SKU y el lote («POL-001-NEG-M-12»), debajo del código.
      { key: "skuLot", label: "SKU y lote", type: "text", align: "left" },
      { key: "price", label: "Precio", type: "money", align: "left" },
    ],
    mockValues: {
      title: "Polo básico algodón (Negro-M)",
      barcodeValue: "POL-001-NEG-M",
      skuLot: "POL-001-NEG-M-12",
      price: 39.9,
    },
  },
  // Tickets de paquete (bundleTicketsPdf.ts): uno por operación por paquete,
  // con los datos de BundleTicketLabel. Solo valores sueltos, sin filas. La
  // fecha y el rango llegan ya escritos (10/02/26, 01-35); T.M, Tarifa y Monto
  // llegan vacíos si la empresa no los muestra (Configuración de tickets).
  bundle_ticket: {
    id: "bundle_ticket",
    label: "Datos del ticket",
    fields: [],
    defaultColumns: [],
    mockRows: [],
    values: [
      // El código del cliente para la operación o, si no tiene, su nombre corto.
      { key: "operCode", label: "Oper", type: "text", align: "left" },
      { key: "date", label: "Fecha de la OP", type: "text", align: "left" },
      { key: "orderCode", label: "OP", type: "text", align: "left" },
      {
        key: "customerOrderRef",
        label: "O/P del cliente",
        type: "text",
        align: "left",
      },
      { key: "cutCode", label: "Corte (H.Cort)", type: "text", align: "left" },
      { key: "model", label: "Modelo", type: "text", align: "left" },
      { key: "size", label: "Talla", type: "text", align: "left" },
      { key: "color", label: "Color", type: "text", align: "left" },
      { key: "quantity", label: "Cantidad", type: "quantity", align: "right" },
      {
        key: "sequence",
        label: "Secuencia (Sec.)",
        type: "text",
        align: "left",
      },
      {
        key: "bundleNumber",
        label: "Paquete (Pqte)",
        type: "text",
        align: "left",
      },
      { key: "range", label: "Rango", type: "text", align: "left" },
      { key: "operation", label: "Operación", type: "text", align: "left" },
      {
        key: "standardMinutes",
        label: "Tiempo estándar (T.M)",
        type: "text",
        align: "left",
      },
      // Hasta 4 decimales, como hoy: llega escrita.
      { key: "pieceRate", label: "Tarifa", type: "text", align: "left" },
      { key: "amount", label: "Monto", type: "money", align: "left" },
      // <corte>.<pqte>.<sec>.<oper>: lo lee la Mesa de registro.
      {
        key: "barcode",
        label: "Código de barras",
        type: "text",
        align: "left",
        kind: "barcode",
      },
    ],
    mockValues: {
      operCode: "1739700",
      date: "10/02/26",
      orderCode: "OP-0023",
      customerOrderRef: "P26.00065",
      cutCode: "R26.4511",
      model: "PO5088",
      size: "M",
      color: "Winetasting",
      quantity: 35,
      sequence: "3",
      bundleNumber: "12",
      range: "01-35",
      operation: "Abot/Pech*2",
      standardMinutes: "0.45",
      pieceRate: "0.13",
      amount: 4.55,
      barcode: "R26.4511.12.3.1739700",
    },
  },
  // Fotocheck de operario (el cupón de OperatorsList, workTicketsPdf.ts): los
  // datos del operario. Solo valores sueltos, sin filas.
  operator_badge: {
    id: "operator_badge",
    label: "Datos del operario",
    fields: [],
    defaultColumns: [],
    mockRows: [],
    values: [
      {
        key: "fullName",
        label: "Nombre completo",
        type: "text",
        align: "left",
      },
      // El grupo de procesos del operario (processGroupName).
      { key: "area", label: "Área", type: "text", align: "left" },
      // «DNI»; sin tipo, el fotocheck escribe «Doc.».
      {
        key: "documentType",
        label: "Tipo de documento",
        type: "text",
        align: "left",
      },
      {
        key: "documentNumber",
        label: "Número de documento",
        type: "text",
        align: "left",
      },
      // Lo que se escanea: el código del operario.
      {
        key: "code",
        label: "Código",
        type: "text",
        align: "left",
        kind: "barcode",
      },
    ],
    mockValues: {
      fullName: "María Elena Quispe Huamán",
      area: "Costura",
      documentType: "DNI",
      documentNumber: "45678912",
      code: "OPE-0012",
    },
  },
  remision_guide: REMISION_GUIDE,
  // Guía de traslado (openTransferRemisionGuide, transferRemisionGuide.ts): la
  // misma guía entre dos almacenes de la empresa, con la serie M001 y su
  // motivo. El destinatario es la propia empresa (sale de la sesión).
  transfer_guide: {
    ...REMISION_GUIDE,
    id: "transfer_guide",
    label: "Datos del traslado",
    mockValues: {
      ...REMISION_GUIDE.mockValues,
      guideNumber: "M001-00000045",
      transferReason: "Traslado entre establecimientos de la misma empresa",
      originAddress: "Almacén central - Av. Argentina 1234 Cercado de Lima",
      destinationAddress: "Tienda Gamarra - Jr. Gamarra 456 La Victoria",
      carrierName: null,
    },
  },
  // Guía de remisión de producción (openProductionRemisionGuide,
  // productionRemisionGuide.ts): la misma guía hacia el taller que hace un
  // proceso, con la serie P001, su motivo y la sección «Servicio» (qué trabajo
  // es y de dónde viene la prenda). El destinatario es el proveedor.
  production_guide: {
    ...REMISION_GUIDE,
    id: "production_guide",
    label: "Datos de la guía de producción",
    values: [
      ...(REMISION_GUIDE.values ?? []),
      {
        key: "orderCode",
        label: "Orden de producción",
        type: "text",
        align: "left",
      },
      {
        key: "processName",
        label: "Proceso destino",
        type: "text",
        align: "left",
      },
      // «Código · descripción» del servicio.
      { key: "service", label: "Servicio", type: "text", align: "left" },
      {
        key: "serviceSupplier",
        label: "Lo realiza",
        type: "text",
        align: "left",
      },
      // «Proceso · proveedor» de donde sale; sin origen, «Almacén».
      { key: "comesFrom", label: "Viene de", type: "text", align: "left" },
      { key: "sentDate", label: "Fecha de envío", type: "text", align: "left" },
    ],
    mockValues: {
      ...REMISION_GUIDE.mockValues,
      guideNumber: "P001-00000318",
      recipientName: "Confecciones Rivera S.A.C.",
      documentType: "RUC",
      documentNumber: "20512345678",
      destinationAddress: "Jr. Huáscar 1520 La Victoria Lima",
      transferReason: "Traslado para transformación",
      originAddress: "Av. Industrial 845 Ate Lima",
      originName: "Estampados del Sur E.I.R.L.",
      carrierName: null,
      orderCode: "OP-0023",
      processName: "Costura",
      service: "SRV-0318 · Costura de polos",
      serviceSupplier: "Confecciones Rivera S.A.C.",
      comesFrom: "Estampado · Estampados del Sur E.I.R.L.",
      sentDate: "30/10/2026",
    },
  },
  // Guía de ingreso de producción (openProductionIntakeGuide,
  // productionIntakeGuide.ts): el mismo papel con otro título, para lo que
  // vuelve terminado y entra a un almacén de la empresa (serie I001). El
  // destinatario es la propia empresa (sale de la sesión).
  intake_guide: {
    ...REMISION_GUIDE,
    id: "intake_guide",
    label: "Datos de la guía de ingreso",
    mockValues: {
      ...REMISION_GUIDE.mockValues,
      guideNumber: "I001-00000072",
      // «Almacén · dirección» al que entra.
      destinationAddress:
        "Almacén central · Av. Argentina 1234 Cercado de Lima",
      transferReason: "Ingreso a almacén · orden de producción OP-0023",
      originAddress: "Jr. Gamarra 456 La Victoria",
      carrierName: null,
    },
  },
  // Guía de envío de material (openMaterialRemisionGuide,
  // materialRemisionGuide.ts): la misma guía para la tela y los avíos que van
  // al taller, con la sección «Envío de material». El número viene armado del
  // backend; el destinatario es el proveedor. Las filas son materiales (en
  // metros, kilos o unidades), sin SKU.
  material_guide: {
    ...REMISION_GUIDE,
    id: "material_guide",
    label: "Datos del envío de material",
    mockRows: MATERIAL_ROWS,
    values: [
      ...(REMISION_GUIDE.values ?? []),
      {
        key: "orderCode",
        label: "Orden de producción",
        type: "text",
        align: "left",
      },
      // «Código · descripción» de la cotización.
      { key: "quotation", label: "Cotización", type: "text", align: "left" },
      // Solo si el envío fue para un servicio concreto.
      { key: "service", label: "Servicio", type: "text", align: "left" },
      {
        key: "serviceSupplier",
        label: "Lo realiza",
        type: "text",
        align: "left",
      },
      {
        key: "destinationWarehouse",
        label: "Almacén de destino",
        type: "text",
        align: "left",
      },
      { key: "originWarehouse", label: "Sale de", type: "text", align: "left" },
      {
        key: "dispatchedBy",
        label: "Despachado por",
        type: "text",
        align: "left",
      },
      { key: "sentDate", label: "Fecha de envío", type: "text", align: "left" },
    ],
    mockValues: {
      ...REMISION_GUIDE.mockValues,
      guideNumber: "M001-00000128",
      recipientName: "Confecciones Rivera S.A.C.",
      documentType: "RUC",
      documentNumber: "20512345678",
      destinationAddress: "Jr. Huáscar 1520 La Victoria Lima",
      transferReason: "Traslado para transformación",
      originAddress: "Av. Argentina 1234 Cercado de Lima",
      originName: null,
      carrierName: null,
      orderCode: "OP-0023",
      quotation: "COT-0045 · Costura de polos básicos",
      service: "SRV-0318 · Costura de polos",
      serviceSupplier: "Confecciones Rivera S.A.C.",
      destinationWarehouse: "Almacén del taller Rivera",
      originWarehouse: "Almacén central",
      dispatchedBy: "María Quispe",
      sentDate: "30/10/2026",
    },
  },
  // Orden de compra (buildPurchaseOrderDocument, purchaseOrderDocument/
  // build.ts, dibujada por shared/utils/sheetDocument.ts): los materiales que
  // se le piden al proveedor y los datos de la cotización. Todo llega ya
  // escrito como lo arma hoy: cantidades sin ceros de más, importes con el
  // símbolo de la moneda pactada y el IGV de cada línea («Incluye IGV», «Más
  // IGV», «Sin declarar»). Subtotal e IGV llegan vacíos si ninguna línea
  // declara el IGV (solo sale el total).
  purchase_order: {
    id: "purchase_order",
    label: "Datos de la orden de compra",
    fields: PURCHASE_FIELDS,
    defaultColumns: [
      "quantity",
      "unit",
      "code",
      "description",
      "unitPrice",
      "total",
      "tax",
    ],
    mockRows: PURCHASE_ROWS,
    values: [
      // El código de la cotización.
      {
        key: "orderCode",
        label: "Orden de compra",
        type: "text",
        align: "left",
      },
      { key: "supplierName", label: "Proveedor", type: "text", align: "left" },
      {
        key: "issueDate",
        label: "Fecha de emisión",
        type: "text",
        align: "left",
      },
      // La más lejana de las líneas; vacía si ninguna la tiene.
      {
        key: "deliveryDate",
        label: "Fecha de entrega",
        type: "text",
        align: "left",
      },
      {
        key: "supplierDocument",
        label: "RUC / DNI del proveedor",
        type: "text",
        align: "left",
      },
      {
        key: "supplierPhone",
        label: "Teléfono del proveedor",
        type: "text",
        align: "left",
      },
      // El asunto de la cotización.
      { key: "request", label: "Solicitud", type: "text", align: "left" },
      {
        key: "distinctMaterials",
        label: "Materiales distintos",
        type: "text",
        align: "left",
      },
      // Solo si todas las líneas van en la misma unidad.
      {
        key: "totalQuantity",
        label: "Cantidad total",
        type: "text",
        align: "left",
      },
      // «PEN · S/».
      { key: "currency", label: "Moneda", type: "text", align: "left" },
      { key: "subtotal", label: "Subtotal", type: "text", align: "left" },
      { key: "igv", label: "IGV", type: "text", align: "left" },
      { key: "total", label: "Total", type: "text", align: "left" },
      // Lo pactado sobre el pago y las notas de la cotización, un párrafo por línea.
      {
        key: "observations",
        label: "Observaciones",
        type: "text",
        align: "left",
      },
    ],
    mockValues: {
      orderCode: "COT-0045",
      supplierName: "Textiles Andinos S.A.C.",
      issueDate: "30/10/2026",
      deliveryDate: "15/11/2026",
      supplierDocument: "20601234567",
      supplierPhone: "987 654 321",
      request: "Telas y avíos para polos básicos de temporada",
      distinctMaterials: "40",
      totalQuantity: null,
      currency: "PEN · S/",
      subtotal: "S/ 18,420.34",
      igv: "S/ 3,315.66",
      total: "S/ 21,736.00",
      observations:
        "Pago a 30 días con factura.\nEntregar en el almacén central de 8:00 a 17:00.",
    },
  },
  // Orden de servicio (buildServiceOrderDocument, serviceOrderDocument/
  // build.ts): lo que se le encarga al taller. Los servicios van como los
  // materiales de la Orden de compra (mismas columnas y formatos); el número
  // es el del servicio si el papel es de uno, o el de la cotización.
  service_order: {
    id: "service_order",
    label: "Datos de la orden de servicio",
    fields: PURCHASE_FIELDS,
    defaultColumns: PURCHASE_FIELDS.map((field) => field.key),
    mockRows: [
      {
        quantity: "1,200",
        unit: "UND",
        code: "SRV-0316",
        description: "Corte de polos básicos",
        unitPrice: "S/ 0.45",
        total: "S/ 540.00",
        tax: "Más IGV",
      },
      {
        quantity: "1,200",
        unit: "UND",
        code: "SRV-0318",
        description: "Costura de polos básicos",
        unitPrice: "S/ 2.10",
        total: "S/ 2,520.00",
        tax: "Más IGV",
      },
      {
        quantity: "1,200",
        unit: "UND",
        code: "SRV-0320",
        description: "Estampado en pecho a 2 colores",
        unitPrice: "S/ 0.80",
        total: "S/ 960.00",
        tax: "Incluye IGV",
      },
    ],
    values: [
      // El code del servicio si el papel es de uno; si no, el de la cotización.
      {
        key: "orderNumber",
        label: "Orden de servicio",
        type: "text",
        align: "left",
      },
      // Solo cuando el papel es de un servicio.
      { key: "processName", label: "Proceso", type: "text", align: "left" },
      { key: "supplierName", label: "Proveedor", type: "text", align: "left" },
      // Las órdenes de producción vinculadas, separadas por comas.
      {
        key: "productionOrders",
        label: "Órdenes de producción",
        type: "text",
        align: "left",
      },
      {
        key: "issueDate",
        label: "Fecha de emisión",
        type: "text",
        align: "left",
      },
      {
        key: "deliveryDate",
        label: "Fecha de entrega",
        type: "text",
        align: "left",
      },
      {
        key: "supplierDocument",
        label: "RUC / DNI del proveedor",
        type: "text",
        align: "left",
      },
      {
        key: "supplierPhone",
        label: "Teléfono del proveedor",
        type: "text",
        align: "left",
      },
      { key: "request", label: "Solicitud", type: "text", align: "left" },
      // Solo con más de uno.
      { key: "serviceCount", label: "Servicios", type: "text", align: "left" },
      // Solo con un servicio en una sola unidad.
      {
        key: "orderedQuantity",
        label: "Cantidad pedida",
        type: "text",
        align: "left",
      },
      { key: "currency", label: "Moneda", type: "text", align: "left" },
      { key: "subtotal", label: "Subtotal", type: "text", align: "left" },
      { key: "igv", label: "IGV", type: "text", align: "left" },
      { key: "total", label: "Total", type: "text", align: "left" },
      // La suma de las prendas, si todas traen cantidad.
      {
        key: "garmentsTotal",
        label: "Total de prendas",
        type: "text",
        align: "left",
      },
      // Las notas de la cotización y lo pactado sobre el pago.
      {
        key: "observations",
        label: "Observaciones",
        type: "text",
        align: "left",
      },
    ],
    mockValues: {
      orderNumber: "COT-0045",
      processName: null,
      supplierName: "Confecciones Rivera S.A.C.",
      productionOrders: "OP-0023",
      issueDate: "30/10/2026",
      deliveryDate: "20/11/2026",
      supplierDocument: "20512345678",
      supplierPhone: "987 654 321",
      request: "Corte, costura y estampado de polos básicos",
      serviceCount: "3",
      orderedQuantity: null,
      currency: "PEN · S/",
      subtotal: "S/ 3,754.24",
      igv: "S/ 675.76",
      total: "S/ 4,430.00",
      garmentsTotal: "1,200",
      observations: "Pago a 15 días con factura.",
    },
  },
  // Las prendas de la Orden de servicio (garmentSections, garmentGrid.ts):
  // una fila por producto y color, con las cantidades por talla ya escritas
  // («S 100 · M 200 · L 100») y su total.
  service_order_garments: {
    id: "service_order_garments",
    label: "Prendas de la orden de servicio",
    fields: [
      { key: "garment", label: "Prenda", type: "text", align: "left" },
      {
        key: "sizes",
        label: "Tallas",
        type: "text",
        widthMm: 110,
        align: "left",
      },
      {
        key: "total",
        label: "Total",
        type: "text",
        widthMm: 22,
        align: "right",
      },
    ],
    defaultColumns: ["garment", "sizes", "total"],
    mockRows: [
      {
        garment: "Polo básico algodón - Negro",
        sizes: "S 100 · M 200 · L 100",
        total: "400",
      },
      {
        garment: "Polo básico algodón - Blanco",
        sizes: "S 80 · M 160 · L 80 · XL 40",
        total: "360",
      },
      {
        garment: "Polo piqué - Azul marino",
        sizes: "S 60 · M 120 · L 60",
        total: "240",
      },
      {
        garment: "Polo manga larga térmico - Gris",
        sizes: "M 100 · L 100",
        total: "200",
      },
    ],
  },
  // Orden de servicio de cliente (customerServiceOrderDocument,
  // customerServiceOrderPdf.ts): lo que se le cotiza o se le hace al cliente.
  // Mientras se cotiza se titula «Cotización de servicio»; aceptada, «Orden
  // de servicio». El rótulo del IGV y la nota al pie cambian con cómo se
  // cobra el IGV.
  customer_service_order: {
    id: "customer_service_order",
    label: "Datos de la orden de servicio de cliente",
    fields: [
      // «Proceso › operación» si la operación cuelga de un proceso.
      { key: "operation", label: "Operación", type: "text", align: "left" },
      {
        key: "unitPrice",
        label: "Precio por prenda",
        type: "text",
        widthMm: 34,
        align: "right",
      },
      {
        key: "garments",
        label: "Prendas",
        type: "text",
        widthMm: 24,
        align: "right",
      },
      {
        key: "total",
        label: "Total",
        type: "text",
        widthMm: 34,
        align: "right",
      },
    ],
    defaultColumns: ["operation", "unitPrice", "garments", "total"],
    mockRows: [
      {
        operation: "Corte",
        unitPrice: "S/ 0.50",
        garments: "500",
        total: "S/ 250.00",
      },
      {
        operation: "Costura › Pegado de cuello",
        unitPrice: "S/ 0.60",
        garments: "500",
        total: "S/ 300.00",
      },
      {
        operation: "Costura › Pegado de mangas",
        unitPrice: "S/ 0.70",
        garments: "500",
        total: "S/ 350.00",
      },
      {
        operation: "Costura › Basta",
        unitPrice: "S/ 0.40",
        garments: "500",
        total: "S/ 200.00",
      },
      {
        operation: "Estampado en pecho",
        unitPrice: "S/ 0.90",
        garments: "500",
        total: "S/ 450.00",
      },
      {
        operation: "Acabado y embolsado",
        unitPrice: "S/ 0.30",
        garments: "500",
        total: "S/ 150.00",
      },
    ],
    values: [
      // «Cotización de servicio» u «Orden de servicio».
      { key: "documentTitle", label: "Título", type: "text", align: "left" },
      // El code de la orden o, si no tiene, «#id».
      { key: "number", label: "N.°", type: "text", align: "left" },
      { key: "date", label: "Fecha", type: "text", align: "left" },
      { key: "customerName", label: "Cliente", type: "text", align: "left" },
      {
        key: "customerDocument",
        label: "Documento del cliente",
        type: "text",
        align: "left",
      },
      { key: "subject", label: "Qué se produce", type: "text", align: "left" },
      { key: "garmentCount", label: "Prendas", type: "text", align: "left" },
      // La suma de las operaciones.
      {
        key: "unitTotal",
        label: "Precio por prenda",
        type: "text",
        align: "left",
      },
      // «Incluye IGV», «+ IGV», «Sin IGV (exonerado)».
      { key: "taxMode", label: "IGV", type: "text", align: "left" },
      { key: "currency", label: "Moneda", type: "text", align: "left" },
      {
        key: "paymentTerms",
        label: "Condición de pago",
        type: "text",
        align: "left",
      },
      { key: "subtotal", label: "Subtotal", type: "text", align: "left" },
      // «IGV» o «IGV (exonerado)».
      { key: "igvLabel", label: "Rótulo del IGV", type: "text", align: "left" },
      { key: "igv", label: "IGV", type: "text", align: "left" },
      { key: "total", label: "Total", type: "text", align: "left" },
      {
        key: "observations",
        label: "Observaciones",
        type: "text",
        align: "left",
      },
      // La nota al pie: cómo se lee el precio según el IGV.
      { key: "footnote", label: "Nota al pie", type: "text", align: "left" },
    ],
    mockValues: {
      documentTitle: "Cotización de servicio",
      number: "CS-0012",
      date: "30/10/2026",
      customerName: "Moda Andina E.I.R.L.",
      customerDocument: "20609876543",
      subject: "Confección de polos básicos con estampado",
      garmentCount: "500",
      unitTotal: "S/ 3.40",
      taxMode: "+ IGV",
      currency: "PEN",
      paymentTerms: "50 % de adelanto, saldo contra entrega",
      subtotal: "S/ 1,700.00",
      igvLabel: "IGV",
      igv: "S/ 306.00",
      total: "S/ 2,006.00",
      observations: "Las telas las entrega el cliente en nuestro taller.",
      footnote:
        "El precio por prenda es la suma de las operaciones. A los precios se les suma el IGV.",
    },
  },
  // Orden de producción (buildProductionOrderDocument, productionOrderDocument/
  // build.ts): el papel que abre la producción de un lote. Sus filas son la
  // ruta de producción, paso a paso, con lo pedido, lo terminado y lo que
  // falta; las prendas van en su propia lista.
  production_order: {
    id: "production_order",
    label: "Datos de la orden de producción",
    fields: [
      {
        key: "step",
        label: "Paso",
        type: "text",
        widthMm: 14,
        align: "right",
        tone: "muted",
      },
      // «Sin proceso» si el paso no tiene.
      { key: "process", label: "Proceso", type: "text", align: "left" },
      {
        key: "group",
        label: "Grupo",
        type: "text",
        widthMm: 38,
        align: "left",
        tone: "muted",
        empty: "—",
      },
      // Los códigos de sus servicios, separados por comas.
      {
        key: "services",
        label: "Servicios",
        type: "text",
        widthMm: 44,
        align: "left",
        tone: "code",
        empty: "—",
      },
      {
        key: "requested",
        label: "Pedido",
        type: "text",
        widthMm: 24,
        align: "right",
      },
      {
        key: "finished",
        label: "Terminado",
        type: "text",
        widthMm: 26,
        align: "right",
      },
      {
        key: "missing",
        label: "Faltante",
        type: "text",
        widthMm: 24,
        align: "right",
        empty: "—",
      },
      // «Terminado», «Bloqueado», «En proceso» o «Pendiente».
      {
        key: "status",
        label: "Estado",
        type: "text",
        widthMm: 28,
        align: "left",
      },
    ],
    defaultColumns: [
      "step",
      "process",
      "group",
      "services",
      "requested",
      "finished",
      "missing",
      "status",
    ],
    mockRows: [
      {
        step: "1",
        process: "Corte",
        group: "Corte",
        services: "SRV-0316",
        requested: "1,200",
        finished: "1,200",
        missing: null,
        status: "Terminado",
      },
      {
        step: "2",
        process: "Estampado",
        group: "Acabados",
        services: "SRV-0320",
        requested: "1,200",
        finished: "800",
        missing: "400",
        status: "En proceso",
      },
      {
        step: "3",
        process: "Costura",
        group: "Confección",
        services: "SRV-0318",
        requested: "1,200",
        finished: "0",
        missing: "1,200",
        status: "Pendiente",
      },
      {
        step: "4",
        process: "Bordado de logo",
        group: "Acabados",
        services: null,
        requested: "1,200",
        finished: "0",
        missing: "1,200",
        status: "Bloqueado",
      },
      {
        step: "5",
        process: "Control de calidad",
        group: "Calidad",
        services: null,
        requested: "1,200",
        finished: "0",
        missing: "1,200",
        status: "Pendiente",
      },
      {
        step: "6",
        process: "Embolsado",
        group: "Despacho",
        services: null,
        requested: "1,200",
        finished: "0",
        missing: "1,200",
        status: "Pendiente",
      },
    ],
    values: [
      // El code de la orden o, si no tiene, «#id».
      {
        key: "orderCode",
        label: "Orden de producción",
        type: "text",
        align: "left",
      },
      { key: "name", label: "Nombre", type: "text", align: "left" },
      { key: "className", label: "Tipo", type: "text", align: "left" },
      { key: "status", label: "Estado", type: "text", align: "left" },
      {
        key: "issueDate",
        label: "Fecha de emisión",
        type: "text",
        align: "left",
      },
      {
        key: "promisedDate",
        label: "Entrega comprometida",
        type: "text",
        align: "left",
      },
      {
        key: "garmentsTotal",
        label: "Total de prendas",
        type: "text",
        align: "left",
      },
      { key: "categories", label: "Categorías", type: "text", align: "left" },
      { key: "tags", label: "Etiquetas", type: "text", align: "left" },
      // La descripción de la orden.
      {
        key: "observations",
        label: "Observaciones",
        type: "text",
        align: "left",
      },
    ],
    mockValues: {
      orderCode: "OP-0023",
      name: "Polos básicos temporada verano",
      className: "Producción interna",
      status: "En proceso",
      issueDate: "30/10/2026",
      promisedDate: "30/11/2026",
      garmentsTotal: "1,200",
      categories: "Polos, Básicos",
      tags: "Verano 2027",
      observations:
        "Usar la tela del lote de octubre. Revisar el tono del negro antes de cortar.",
    },
  },
  // Las prendas de la Orden de producción (garmentSections, garmentGrid.ts):
  // como las de la Orden de servicio, una fila por producto y color con sus
  // tallas ya escritas y su total.
  production_order_garments: {
    id: "production_order_garments",
    label: "Prendas de la orden de producción",
    fields: [
      { key: "garment", label: "Prenda", type: "text", align: "left" },
      {
        key: "sizes",
        label: "Tallas",
        type: "text",
        widthMm: 110,
        align: "left",
      },
      {
        key: "total",
        label: "Total",
        type: "text",
        widthMm: 22,
        align: "right",
      },
    ],
    defaultColumns: ["garment", "sizes", "total"],
    mockRows: [
      {
        garment: "Polo básico algodón - Negro",
        sizes: "S 100 · M 200 · L 100",
        total: "400",
      },
      {
        garment: "Polo básico algodón - Blanco",
        sizes: "S 80 · M 160 · L 80 · XL 40",
        total: "360",
      },
      {
        garment: "Polo piqué - Azul marino",
        sizes: "S 60 · M 120 · L 60",
        total: "240",
      },
      {
        garment: "Polo manga larga térmico - Gris",
        sizes: "M 100 · L 100",
        total: "200",
      },
    ],
  },
  // Las fotos de referencia de la Orden de producción (las de sus prendas,
  // hasta 6 en el papel de hoy): la dirección de cada una. Los ejemplos son
  // dibujos, para no depender de una imagen de afuera.
  production_order_images: {
    id: "production_order_images",
    label: "Fotos de la orden de producción",
    fields: [
      {
        key: "photo",
        label: "Foto",
        type: "text",
        kind: "image",
        widthMm: 24,
        heightMm: 30,
        align: "left",
      },
    ],
    defaultColumns: ["photo"],
    mockRows: [
      {
        photo:
          "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMjQwIDMwMCI+PHJlY3Qgd2lkdGg9IjI0MCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmZmZmZmYiLz48cGF0aCBkPSJNODAgNDAgTDQwIDcwIEw1OCAxMTAgTDc4IDEwMCBMNzggMjUwIEwxNjIgMjUwIEwxNjIgMTAwIEwxODIgMTEwIEwyMDAgNzAgTDE2MCA0MCBRMTIwIDcwIDgwIDQwIFoiIGZpbGw9IiMxZjI5MzciIHN0cm9rZT0iIzljYTNhZiIgc3Ryb2tlLXdpZHRoPSIzIi8+PHRleHQgeD0iMTIwIiB5PSIyODUiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2YjcyODAiPkZvdG8gMTwvdGV4dD48L3N2Zz4=",
      },
      {
        photo:
          "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMjQwIDMwMCI+PHJlY3Qgd2lkdGg9IjI0MCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmZmZmZmYiLz48cGF0aCBkPSJNODAgNDAgTDQwIDcwIEw1OCAxMTAgTDc4IDEwMCBMNzggMjUwIEwxNjIgMjUwIEwxNjIgMTAwIEwxODIgMTEwIEwyMDAgNzAgTDE2MCA0MCBRMTIwIDcwIDgwIDQwIFoiIGZpbGw9IiNmM2Y0ZjYiIHN0cm9rZT0iIzljYTNhZiIgc3Ryb2tlLXdpZHRoPSIzIi8+PHRleHQgeD0iMTIwIiB5PSIyODUiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2YjcyODAiPkZvdG8gMjwvdGV4dD48L3N2Zz4=",
      },
      {
        photo:
          "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMjQwIDMwMCI+PHJlY3Qgd2lkdGg9IjI0MCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmZmZmZmYiLz48cGF0aCBkPSJNODAgNDAgTDQwIDcwIEw1OCAxMTAgTDc4IDEwMCBMNzggMjUwIEwxNjIgMjUwIEwxNjIgMTAwIEwxODIgMTEwIEwyMDAgNzAgTDE2MCA0MCBRMTIwIDcwIDgwIDQwIFoiIGZpbGw9IiMxZTNhOGEiIHN0cm9rZT0iIzljYTNhZiIgc3Ryb2tlLXdpZHRoPSIzIi8+PHRleHQgeD0iMTIwIiB5PSIyODUiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2YjcyODAiPkZvdG8gMzwvdGV4dD48L3N2Zz4=",
      },
      {
        photo:
          "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMjQwIDMwMCI+PHJlY3Qgd2lkdGg9IjI0MCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmZmZmZmYiLz48cGF0aCBkPSJNODAgNDAgTDQwIDcwIEw1OCAxMTAgTDc4IDEwMCBMNzggMjUwIEwxNjIgMjUwIEwxNjIgMTAwIEwxODIgMTEwIEwyMDAgNzAgTDE2MCA0MCBRMTIwIDcwIDgwIDQwIFoiIGZpbGw9IiM2YjcyODAiIHN0cm9rZT0iIzljYTNhZiIgc3Ryb2tlLXdpZHRoPSIzIi8+PHRleHQgeD0iMTIwIiB5PSIyODUiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2YjcyODAiPkZvdG8gNDwvdGV4dD48L3N2Zz4=",
      },
      {
        photo:
          "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMjQwIDMwMCI+PHJlY3Qgd2lkdGg9IjI0MCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmZmZmZmYiLz48cGF0aCBkPSJNODAgNDAgTDQwIDcwIEw1OCAxMTAgTDc4IDEwMCBMNzggMjUwIEwxNjIgMjUwIEwxNjIgMTAwIEwxODIgMTEwIEwyMDAgNzAgTDE2MCA0MCBRMTIwIDcwIDgwIDQwIFoiIGZpbGw9IiM5OTFiMWIiIHN0cm9rZT0iIzljYTNhZiIgc3Ryb2tlLXdpZHRoPSIzIi8+PHRleHQgeD0iMTIwIiB5PSIyODUiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2YjcyODAiPkZvdG8gNTwvdGV4dD48L3N2Zz4=",
      },
      {
        photo:
          "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMjQwIDMwMCI+PHJlY3Qgd2lkdGg9IjI0MCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmZmZmZmYiLz48cGF0aCBkPSJNODAgNDAgTDQwIDcwIEw1OCAxMTAgTDc4IDEwMCBMNzggMjUwIEwxNjIgMjUwIEwxNjIgMTAwIEwxODIgMTEwIEwyMDAgNzAgTDE2MCA0MCBRMTIwIDcwIDgwIDQwIFoiIGZpbGw9IiMwNjVmNDYiIHN0cm9rZT0iIzljYTNhZiIgc3Ryb2tlLXdpZHRoPSIzIi8+PHRleHQgeD0iMTIwIiB5PSIyODUiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2YjcyODAiPkZvdG8gNjwvdGV4dD48L3N2Zz4=",
      },
    ],
  },
  // Requerimiento de materiales (buildMaterialRequirementDocument,
  // materialRequirementDocument/build.ts): los materiales de la explosión de
  // una orden, sumados para todo el lote, en una sección por clase («TELAS»,
  // «AVÍOS»…). Llegan ordenados por clase, «SIN CLASIFICAR» al final.
  material_requirement: {
    id: "material_requirement",
    label: "Datos del requerimiento",
    fields: [
      // «SIN CLASIFICAR» si el material no tiene clase. Agrupa las filas
      // («Agrupar por»); no es una columna.
      {
        key: "materialClass",
        label: "Clase",
        type: "text",
        widthMm: 30,
        align: "left",
        tone: "muted",
      },
      { key: "material", label: "Material", type: "text", align: "left" },
      {
        key: "unit",
        label: "U/M",
        type: "text",
        widthMm: 16,
        align: "left",
        tone: "muted",
      },
      {
        key: "quantity",
        label: "Cantidad",
        type: "text",
        widthMm: 26,
        align: "right",
      },
      {
        key: "stock",
        label: "Stock",
        type: "text",
        widthMm: 24,
        align: "right",
        tone: "muted",
        empty: "—",
      },
      // La parte del stock que ya está en un almacén de proveedor.
      {
        key: "atSuppliers",
        label: "En talleres",
        type: "text",
        widthMm: 26,
        align: "right",
        tone: "muted",
        empty: "—",
      },
      {
        key: "missing",
        label: "Faltante",
        type: "text",
        widthMm: 26,
        align: "right",
        empty: "—",
      },
      {
        key: "unitCost",
        label: "C. unit.",
        type: "text",
        widthMm: 24,
        align: "right",
        tone: "muted",
        empty: "—",
      },
      {
        key: "amount",
        label: "Importe",
        type: "text",
        widthMm: 28,
        align: "right",
        empty: "—",
      },
    ],
    defaultColumns: [
      "material",
      "unit",
      "quantity",
      "stock",
      "atSuppliers",
      "missing",
      "unitCost",
      "amount",
    ],
    mockRows: [
      {
        materialClass: "TELAS",
        material: "Tela jersey 30/1 algodón peinado",
        unit: "KG",
        quantity: "180",
        stock: "120",
        atSuppliers: "20",
        missing: "40",
        unitCost: "S/ 28.50",
        amount: "S/ 5,130.00",
      },
      {
        materialClass: "TELAS",
        material: "Rib 1x1 algodón lycra",
        unit: "KG",
        quantity: "24",
        stock: "30",
        atSuppliers: null,
        missing: null,
        unitCost: "S/ 32.00",
        amount: "S/ 768.00",
      },
      {
        materialClass: "TELAS",
        material: "Tela piqué",
        unit: "KG",
        quantity: "60",
        stock: "10",
        atSuppliers: null,
        missing: "50",
        unitCost: "S/ 30.00",
        amount: "S/ 1,800.00",
      },
      {
        materialClass: "HILOS",
        material: "Hilo de coser 40/2",
        unit: "UND",
        quantity: "48",
        stock: "60",
        atSuppliers: "12",
        missing: null,
        unitCost: "S/ 6.50",
        amount: "S/ 312.00",
      },
      {
        materialClass: "HILOS",
        material: "Hilo de remalle",
        unit: "UND",
        quantity: "36",
        stock: "20",
        atSuppliers: null,
        missing: "16",
        unitCost: "S/ 5.80",
        amount: "S/ 208.80",
      },
      {
        materialClass: "AVÍOS",
        material: "Etiqueta tejida de marca",
        unit: "UND",
        quantity: "1,200",
        stock: "2,000",
        atSuppliers: null,
        missing: null,
        unitCost: "S/ 0.12",
        amount: "S/ 144.00",
      },
      {
        materialClass: "AVÍOS",
        material: "Etiqueta de talla",
        unit: "UND",
        quantity: "1,200",
        stock: "800",
        atSuppliers: null,
        missing: "400",
        unitCost: "S/ 0.05",
        amount: "S/ 60.00",
      },
      {
        materialClass: "AVÍOS",
        material: "Etiqueta de composición",
        unit: "UND",
        quantity: "1,200",
        stock: "1,500",
        atSuppliers: null,
        missing: null,
        unitCost: "S/ 0.06",
        amount: "S/ 72.00",
      },
      {
        materialClass: "AVÍOS",
        material: "Botón de 4 huecos",
        unit: "UND",
        quantity: "3,600",
        stock: "1,000",
        atSuppliers: "500",
        missing: "2,100",
        unitCost: "S/ 0.08",
        amount: "S/ 288.00",
      },
      {
        materialClass: "EMPAQUE",
        material: "Bolsa de empaque",
        unit: "UND",
        quantity: "1,200",
        stock: "0",
        atSuppliers: null,
        missing: "1,200",
        unitCost: "S/ 0.15",
        amount: "S/ 180.00",
      },
      {
        materialClass: "EMPAQUE",
        material: "Hang tag",
        unit: "UND",
        quantity: "1,200",
        stock: "600",
        atSuppliers: null,
        missing: "600",
        unitCost: "S/ 0.10",
        amount: "S/ 120.00",
      },
      {
        materialClass: "SIN CLASIFICAR",
        material: "Cinta de faya",
        unit: "MT",
        quantity: "300",
        stock: "150",
        atSuppliers: null,
        missing: "150",
        unitCost: "S/ 0.40",
        amount: "S/ 120.00",
      },
    ],
    values: [
      // «REQ-» y el código de la orden.
      {
        key: "requirementNumber",
        label: "N.º de requerimiento",
        type: "text",
        align: "left",
      },
      {
        key: "orderCode",
        label: "Orden de producción",
        type: "text",
        align: "left",
      },
      {
        key: "orderDate",
        label: "Fecha de la orden",
        type: "text",
        align: "left",
      },
      {
        key: "promisedDate",
        label: "Entrega comprometida",
        type: "text",
        align: "left",
      },
      {
        key: "requestedQuantity",
        label: "Cantidad solicitada",
        type: "text",
        align: "left",
      },
      { key: "requester", label: "Solicitante", type: "text", align: "left" },
      { key: "categories", label: "Categoría", type: "text", align: "left" },
      {
        key: "modelCodes",
        label: "Código de modelo",
        type: "text",
        align: "left",
      },
      // Las clases de los materiales, separadas por comas.
      {
        key: "materialTypes",
        label: "Tipo de material",
        type: "text",
        align: "left",
      },
      {
        key: "distinctMaterials",
        label: "Materiales distintos",
        type: "text",
        align: "left",
      },
      {
        key: "toBuy",
        label: "Materiales por comprar",
        type: "text",
        align: "left",
      },
      {
        key: "estimatedCost",
        label: "Costo estimado",
        type: "text",
        align: "left",
      },
      // Las notas de la orden.
      {
        key: "observations",
        label: "Observaciones",
        type: "text",
        align: "left",
      },
    ],
    mockValues: {
      requirementNumber: "REQ-OP-0023",
      orderCode: "OP-0023",
      orderDate: "28/10/2026",
      promisedDate: "30/11/2026",
      requestedQuantity: "1,200",
      requester: "María Quispe",
      categories: "Polos, Básicos",
      modelCodes: "PO5088, PO5090",
      materialTypes: "Telas, Hilos, Avíos, Empaque",
      distinctMaterials: "12",
      toBuy: "9",
      estimatedCost: "S/ 9,202.80",
      observations: "Priorizar la compra de telas: el corte empieza el lunes.",
    },
  },
  // Receta (buildRecipeDocument, recipeDocument/build.ts): los materiales de
  // una prenda y su consumo, en una sección por clase. Llegan ordenados por
  // clase, «SIN CLASE» al final. «Por prenda» lleva, una por línea, las
  // prendas que usan otra cantidad que el consumo general («XL: 1.4»).
  recipe: {
    id: "recipe",
    label: "Datos de la receta",
    fields: [
      // «SIN CLASE» si el material no tiene clase. Agrupa las filas
      // («Agrupar por»); no es una columna.
      {
        key: "materialClass",
        label: "Clase",
        type: "text",
        widthMm: 30,
        align: "left",
        tone: "muted",
      },
      // El consumo por prenda.
      {
        key: "consumption",
        label: "Consumo",
        type: "text",
        widthMm: 26,
        align: "right",
        empty: "—",
      },
      {
        key: "unit",
        label: "U/M",
        type: "text",
        widthMm: 20,
        align: "left",
        empty: "—",
      },
      { key: "material", label: "Material", type: "text", align: "left" },
      { key: "perGarment", label: "Por prenda", type: "text", align: "left" },
      // Con 4 decimales si es menor a un céntimo.
      {
        key: "unitCost",
        label: "Costo unit.",
        type: "text",
        widthMm: 34,
        align: "right",
        empty: "—",
      },
      {
        key: "amount",
        label: "Importe",
        type: "text",
        widthMm: 34,
        align: "right",
      },
      // El subtotal de la clase de la fila (el mismo en todas las de la
      // clase): el pie de cada grupo.
      {
        key: "classSubtotal",
        label: "Subtotal de la clase",
        type: "text",
        align: "right",
      },
    ],
    defaultColumns: [
      "consumption",
      "unit",
      "material",
      "perGarment",
      "unitCost",
      "amount",
    ],
    mockRows: [
      {
        materialClass: "TELAS",
        classSubtotal: "S/ 38.19",
        consumption: "1.25",
        unit: "KG",
        material: "Tela jersey 30/1 algodón peinado",
        perGarment: "XL: 1.4\nXXL: 1.55",
        unitCost: "S/ 28.50",
        amount: "S/ 35.63",
      },
      {
        materialClass: "TELAS",
        classSubtotal: "S/ 38.19",
        consumption: "0.08",
        unit: "KG",
        material: "Rib 1x1 algodón lycra",
        perGarment: null,
        unitCost: "S/ 32.00",
        amount: "S/ 2.56",
      },
      {
        materialClass: "HILOS",
        classSubtotal: "S/ 0.19",
        consumption: "0.02",
        unit: "UND",
        material: "Hilo de coser 40/2",
        perGarment: null,
        unitCost: "S/ 6.50",
        amount: "S/ 0.13",
      },
      {
        materialClass: "HILOS",
        classSubtotal: "S/ 0.19",
        consumption: "0.01",
        unit: "UND",
        material: "Hilo de remalle",
        perGarment: null,
        unitCost: "S/ 5.80",
        amount: "S/ 0.06",
      },
      {
        materialClass: "AVÍOS",
        classSubtotal: "S/ 0.47",
        consumption: "1",
        unit: "UND",
        material: "Etiqueta tejida de marca",
        perGarment: null,
        unitCost: "S/ 0.12",
        amount: "S/ 0.12",
      },
      {
        materialClass: "AVÍOS",
        classSubtotal: "S/ 0.47",
        consumption: "1",
        unit: "UND",
        material: "Etiqueta de talla",
        perGarment: null,
        unitCost: "S/ 0.05",
        amount: "S/ 0.05",
      },
      {
        materialClass: "AVÍOS",
        classSubtotal: "S/ 0.47",
        consumption: "1",
        unit: "UND",
        material: "Etiqueta de composición",
        perGarment: null,
        unitCost: "S/ 0.06",
        amount: "S/ 0.06",
      },
      {
        materialClass: "AVÍOS",
        classSubtotal: "S/ 0.47",
        consumption: "3",
        unit: "UND",
        material: "Botón de 4 huecos",
        perGarment: "XXL: 4",
        unitCost: "S/ 0.08",
        amount: "S/ 0.24",
      },
      {
        materialClass: "EMPAQUE",
        classSubtotal: "S/ 0.15",
        consumption: "1",
        unit: "UND",
        material: "Bolsa de empaque",
        perGarment: null,
        unitCost: "S/ 0.15",
        amount: "S/ 0.15",
      },
      {
        materialClass: "SIN CLASE",
        classSubtotal: "S/ 0.10",
        consumption: "0.25",
        unit: "MT",
        material: "Cinta de faya",
        perGarment: null,
        unitCost: "S/ 0.40",
        amount: "S/ 0.10",
      },
    ],
    values: [
      // La descripción de la receta o, si no tiene, «#id».
      { key: "recipe", label: "Receta", type: "text", align: "left" },
      { key: "modelCode", label: "Modelo", type: "text", align: "left" },
      // La prenda (la variación) de la receta.
      { key: "garment", label: "Prenda", type: "text", align: "left" },
      {
        key: "registeredAt",
        label: "Fecha de registro",
        type: "text",
        align: "left",
      },
      {
        key: "distinctMaterials",
        label: "Materiales distintos",
        type: "text",
        align: "left",
      },
      // Las clases de los materiales, separadas por comas.
      { key: "types", label: "Tipos", type: "text", align: "left" },
      { key: "total", label: "Total por prenda", type: "text", align: "left" },
      // Solo si alguna prenda usa otra cantidad (la columna «Por prenda»).
      { key: "footnote", label: "Nota al pie", type: "text", align: "left" },
    ],
    mockValues: {
      recipe: "Polo básico cuello redondo",
      modelCode: "PO5088",
      garment: "Polo básico algodón - Negro",
      registeredAt: "15/10/2026",
      distinctMaterials: "10",
      types: "TELAS, HILOS, AVÍOS, EMPAQUE, SIN CLASE",
      total: "S/ 39.10",
      footnote:
        "Por prenda: las prendas listadas llevan esa cantidad en lugar del consumo general. Las que no aparecen usan el consumo general.",
    },
  },
  // Operaciones del estilo (styleOperationsDocument, styleOperationsPdf.ts):
  // las operaciones de cada proceso de la ruta, en una sección por fase y
  // bloque («1-CORTE · 1. TENDIDO»), con el total de cada bloque. Un proceso
  // sin operaciones sale como «(PROCESO COMPLETO)» con su máquina.
  style_operations: {
    id: "style_operations",
    label: "Datos de las operaciones",
    fields: [
      // La fase y el bloque: agrupa las filas («Agrupar por»).
      { key: "section", label: "Fase y bloque", type: "text", align: "left" },
      // La posición en su bloque.
      { key: "seq", label: "Sec", type: "text", widthMm: 12, align: "left" },
      // El código que el cliente le da a la operación.
      {
        key: "opCode",
        label: "Ope",
        type: "text",
        widthMm: 22,
        align: "left",
        tone: "code",
      },
      { key: "operation", label: "Operación", type: "text", align: "left" },
      {
        key: "machine",
        label: "Máquina",
        type: "text",
        widthMm: 44,
        align: "left",
        empty: "—",
      },
      // Minutos por prenda, con 4 decimales.
      {
        key: "std",
        label: "T.STD",
        type: "text",
        widthMm: 20,
        align: "right",
        empty: "—",
      },
      // S/ por prenda buena, con 5 decimales.
      {
        key: "rate",
        label: "Tarifa",
        type: "text",
        widthMm: 22,
        align: "right",
        empty: "—",
      },
      {
        key: "perHour",
        label: "Prod/h",
        type: "text",
        widthMm: 18,
        align: "right",
        empty: "—",
      },
      {
        key: "perDay",
        label: "Prod/día",
        type: "text",
        widthMm: 20,
        align: "right",
        empty: "—",
      },
      // «0.2000 min · S/ 0.02500» (y los de la fase, en su último bloque).
      {
        key: "blockTotal",
        label: "Total del bloque",
        type: "text",
        align: "right",
      },
      // «Total bloque» o, en el último bloque de su fase, «Total bloque / fase».
      {
        key: "blockLabel",
        label: "Rótulo del pie",
        type: "text",
        align: "left",
      },
    ],
    defaultColumns: [
      "seq",
      "opCode",
      "operation",
      "machine",
      "std",
      "rate",
      "perHour",
      "perDay",
    ],
    mockRows: [
      {
        section: "1-CORTE · 1. TENDIDO",
        seq: "1",
        opCode: "C01",
        operation: "TENDIDO DE TELA",
        machine: "Mesa de corte",
        std: "0.1200",
        rate: "0.01500",
        perHour: "500",
        perDay: "4,000",
        blockTotal: "0.2000 min · S/ 0.02500",
        blockLabel: "Total bloque",
      },
      {
        section: "1-CORTE · 1. TENDIDO",
        seq: "2",
        opCode: "C02",
        operation: "MARCADO DE MOLDES",
        machine: "Mesa de corte",
        std: "0.0800",
        rate: "0.01000",
        perHour: "750",
        perDay: "6,000",
        blockTotal: "0.2000 min · S/ 0.02500",
        blockLabel: "Total bloque",
      },
      {
        section: "1-CORTE · 2. CORTE",
        seq: "1",
        opCode: "C03",
        operation: "CORTE CON CUCHILLA",
        machine: "Cortadora vertical",
        std: "0.1500",
        rate: "0.02000",
        perHour: "400",
        perDay: "3,200",
        blockTotal: "0.2500 min · S/ 0.03200 · fase 0.4500 min · S/ 0.05700",
        blockLabel: "Total bloque / fase",
      },
      {
        section: "1-CORTE · 2. CORTE",
        seq: "2",
        opCode: "C04",
        operation: "HABILITADO Y NUMERADO",
        machine: "Manual",
        std: "0.1000",
        rate: "0.01200",
        perHour: "600",
        perDay: "4,800",
        blockTotal: "0.2500 min · S/ 0.03200 · fase 0.4500 min · S/ 0.05700",
        blockLabel: "Total bloque / fase",
      },
      {
        section: "2-COSTURA · 1. PREPARACIÓN",
        seq: "1",
        opCode: "S01",
        operation: "UNIR HOMBROS",
        machine: "Remalladora",
        std: "0.2500",
        rate: "0.03000",
        perHour: "240",
        perDay: "1,920",
        blockTotal: "0.7000 min · S/ 0.08500",
        blockLabel: "Total bloque",
      },
      {
        section: "2-COSTURA · 1. PREPARACIÓN",
        seq: "2",
        opCode: "S02",
        operation: "PEGAR CUELLO",
        machine: "Remalladora",
        std: "0.3000",
        rate: "0.03500",
        perHour: "200",
        perDay: "1,600",
        blockTotal: "0.7000 min · S/ 0.08500",
        blockLabel: "Total bloque",
      },
      {
        section: "2-COSTURA · 1. PREPARACIÓN",
        seq: "3",
        opCode: "S03",
        operation: "RECUBRIR CUELLO",
        machine: "Recubridora",
        std: "0.1500",
        rate: "0.02000",
        perHour: "400",
        perDay: "3,200",
        blockTotal: "0.7000 min · S/ 0.08500",
        blockLabel: "Total bloque",
      },
      {
        section: "2-COSTURA · 2. ENSAMBLE",
        seq: "1",
        opCode: "S04",
        operation: "PEGAR MANGAS",
        machine: "Remalladora",
        std: "0.4000",
        rate: "0.04500",
        perHour: "150",
        perDay: "1,200",
        blockTotal: "1.2000 min · S/ 0.13500 · fase 1.9000 min · S/ 0.22000",
        blockLabel: "Total bloque / fase",
      },
      {
        section: "2-COSTURA · 2. ENSAMBLE",
        seq: "2",
        opCode: "S05",
        operation: "CERRAR COSTADOS",
        machine: "Remalladora",
        std: "0.4500",
        rate: "0.05000",
        perHour: "133",
        perDay: "1,067",
        blockTotal: "1.2000 min · S/ 0.13500 · fase 1.9000 min · S/ 0.22000",
        blockLabel: "Total bloque / fase",
      },
      {
        section: "2-COSTURA · 2. ENSAMBLE",
        seq: "3",
        opCode: "S06",
        operation: "BASTA DE FALDA",
        machine: "Recubridora",
        std: "0.3500",
        rate: "0.04000",
        perHour: "171",
        perDay: "1,371",
        blockTotal: "1.2000 min · S/ 0.13500 · fase 1.9000 min · S/ 0.22000",
        blockLabel: "Total bloque / fase",
      },
      {
        section: "3-ACABADO",
        seq: null,
        opCode: null,
        operation: "(PROCESO COMPLETO)",
        machine: "Mesa de acabado",
        std: null,
        rate: null,
        perHour: null,
        perDay: null,
        blockTotal: null,
      },
    ],
    values: [
      // «Sin guardar» si la orden todavía no tiene código.
      {
        key: "orderCode",
        label: "Orden de producción",
        type: "text",
        align: "left",
      },
      { key: "issueDate", label: "Emisión", type: "text", align: "left" },
      { key: "status", label: "Estado", type: "text", align: "left" },
      // «Código · descripción» del estilo.
      { key: "article", label: "Artículo", type: "text", align: "left" },
      { key: "customer", label: "Cliente", type: "text", align: "left" },
      {
        key: "customerOrderRef",
        label: "O/Comercial",
        type: "text",
        align: "left",
      },
      // «480 min».
      { key: "workday", label: "Jornada", type: "text", align: "left" },
      { key: "totalStd", label: "T.STD total", type: "text", align: "left" },
      { key: "totalRate", label: "Tarifa total", type: "text", align: "left" },
      // La suma de los minutos por máquina.
      {
        key: "machinesTotal",
        label: "Total general de minutos",
        type: "text",
        align: "left",
      },
    ],
    mockValues: {
      orderCode: "OP-0023",
      issueDate: "30/10/2026",
      status: "En proceso",
      article: "PO5088 · Polo básico cuello redondo",
      customer: "Moda Andina E.I.R.L.",
      customerOrderRef: "P26.00065",
      workday: "480 min",
      totalStd: "2.3500 min",
      totalRate: "S/ 0.27700",
      machinesTotal: "2.35",
    },
  },
  // Los minutos por máquina de las Operaciones del estilo, de más a menos.
  style_operations_machines: {
    id: "style_operations_machines",
    label: "Minutos por máquina",
    fields: [
      { key: "machine", label: "Máquina", type: "text", align: "left" },
      {
        key: "minutes",
        label: "Total minutos",
        type: "text",
        widthMm: 36,
        align: "right",
      },
    ],
    defaultColumns: ["machine", "minutes"],
    mockRows: [
      { machine: "REMALLADORA", minutes: "1.40" },
      { machine: "RECUBRIDORA", minutes: "0.50" },
      { machine: "MESA DE CORTE", minutes: "0.20" },
      { machine: "CORTADORA VERTICAL", minutes: "0.15" },
      { machine: "MANUAL", minutes: "0.10" },
    ],
  },
  // Hoja de paquetes (bundleSheetDocument, bundleSheetPdf.ts): los paquetes
  // de una orden, en una sección por estilo y color, con sus prendas al pie.
  // La talla sale solo en el primer paquete de cada talla (en los demás llega
  // vacía) y «Observaciones» va vacía, para escribirla a mano.
  bundle_sheet: {
    id: "bundle_sheet",
    label: "Datos de los paquetes",
    fields: [
      // «Estilo · color»: agrupa las filas («Agrupar por»).
      { key: "garment", label: "Estilo y color", type: "text", align: "left" },
      { key: "size", label: "Talla", type: "text", widthMm: 28, align: "left" },
      // El número del paquete en la orden, con dos cifras.
      {
        key: "bundle",
        label: "# Paq",
        type: "text",
        widthMm: 30,
        align: "left",
        tone: "code",
      },
      {
        key: "cutOrder",
        label: "O. Corte",
        type: "text",
        widthMm: 26,
        align: "left",
        tone: "code",
        empty: "—",
      },
      {
        key: "quantity",
        label: "Cant",
        type: "text",
        widthMm: 24,
        align: "right",
      },
      // La numeración de las prendas del paquete: «01 - 25».
      {
        key: "range",
        label: "Inicio - Fin",
        type: "text",
        widthMm: 44,
        align: "left",
        tone: "code",
        empty: "—",
      },
      {
        key: "notes",
        label: "Observaciones",
        type: "text",
        align: "left",
        tone: "muted",
      },
      // Las prendas del grupo (el mismo en todas sus filas): su pie.
      {
        key: "garmentTotal",
        label: "Prendas del grupo",
        type: "text",
        align: "right",
      },
    ],
    defaultColumns: [
      "size",
      "bundle",
      "cutOrder",
      "quantity",
      "range",
      "notes",
    ],
    mockRows: [
      {
        garment: "PO5088 · NEGRO",
        size: "S",
        bundle: "01",
        cutOrder: "R26.4511",
        quantity: "25",
        range: "01 - 25",
        notes: null,
        garmentTotal: "125",
      },
      {
        garment: "PO5088 · NEGRO",
        size: "",
        bundle: "02",
        cutOrder: "R26.4511",
        quantity: "25",
        range: "26 - 50",
        notes: null,
        garmentTotal: "125",
      },
      {
        garment: "PO5088 · NEGRO",
        size: "M",
        bundle: "03",
        cutOrder: "R26.4511",
        quantity: "25",
        range: "01 - 25",
        notes: null,
        garmentTotal: "125",
      },
      {
        garment: "PO5088 · NEGRO",
        size: "",
        bundle: "04",
        cutOrder: "R26.4511",
        quantity: "25",
        range: "26 - 50",
        notes: null,
        garmentTotal: "125",
      },
      {
        garment: "PO5088 · NEGRO",
        size: "L",
        bundle: "05",
        cutOrder: "R26.4511",
        quantity: "25",
        range: "01 - 25",
        notes: null,
        garmentTotal: "125",
      },
      {
        garment: "PO5088 · BLANCO",
        size: "S",
        bundle: "06",
        cutOrder: "R26.4512",
        quantity: "20",
        range: "01 - 20",
        notes: null,
        garmentTotal: "90",
      },
      {
        garment: "PO5088 · BLANCO",
        size: "M",
        bundle: "07",
        cutOrder: "R26.4512",
        quantity: "25",
        range: "01 - 25",
        notes: null,
        garmentTotal: "90",
      },
      {
        garment: "PO5088 · BLANCO",
        size: "",
        bundle: "08",
        cutOrder: "R26.4512",
        quantity: "25",
        range: "26 - 50",
        notes: null,
        garmentTotal: "90",
      },
      {
        garment: "PO5088 · BLANCO",
        size: "L",
        bundle: "09",
        cutOrder: "R26.4512",
        quantity: "20",
        range: "01 - 20",
        notes: null,
        garmentTotal: "90",
      },
      {
        garment: "PO5090 · AZUL MARINO",
        size: "M",
        bundle: "10",
        cutOrder: "R26.4513",
        quantity: "30",
        range: "01 - 30",
        notes: null,
        garmentTotal: "60",
      },
      {
        garment: "PO5090 · AZUL MARINO",
        size: "L",
        bundle: "11",
        cutOrder: "R26.4513",
        quantity: "30",
        range: "01 - 30",
        notes: null,
        garmentTotal: "60",
      },
    ],
    values: [
      // El código de la orden o su nombre.
      { key: "orderCode", label: "O. Serv.", type: "text", align: "left" },
      // Los modelos de las prendas, separados por comas.
      { key: "models", label: "Modelo", type: "text", align: "left" },
      { key: "customer", label: "Cliente", type: "text", align: "left" },
      { key: "bundleCount", label: "Paquetes", type: "text", align: "left" },
      { key: "garmentCount", label: "Prendas", type: "text", align: "left" },
    ],
    mockValues: {
      orderCode: "OP-0023",
      models: "PO5088, PO5090",
      customer: "Moda Andina E.I.R.L.",
      bundleCount: "11",
      garmentCount: "275",
    },
  },
  // Comprobante de registro (workLogBatchDocument, workLogBatchPdf.ts): lo
  // que se le registró a un operario con los tickets o cupones que entregó,
  // un renglón por ticket o cupón.
  work_log_batch: {
    id: "work_log_batch",
    label: "Datos del registro",
    fields: [
      {
        key: "code",
        label: "Código",
        type: "text",
        widthMm: 30,
        align: "left",
        tone: "code",
      },
      {
        key: "orderCode",
        label: "OP",
        type: "text",
        widthMm: 26,
        align: "left",
        tone: "code",
        empty: "—",
      },
      // El número del paquete, con dos cifras; un cupón no tiene.
      {
        key: "bundle",
        label: "Paq",
        type: "text",
        widthMm: 14,
        align: "left",
        tone: "code",
        empty: "—",
      },
      { key: "item", label: "Prenda", type: "text", align: "left", empty: "—" },
      {
        key: "operation",
        label: "Operación",
        type: "text",
        widthMm: 52,
        align: "left",
        empty: "—",
      },
      {
        key: "good",
        label: "Buenas",
        type: "text",
        widthMm: 18,
        align: "right",
      },
      // Vacía si no hubo falladas.
      {
        key: "bad",
        label: "Falladas",
        type: "text",
        widthMm: 18,
        align: "right",
      },
      // Prendas buenas × tiempo estándar de la operación.
      {
        key: "minutes",
        label: "Min",
        type: "text",
        widthMm: 18,
        align: "right",
        empty: "—",
      },
      // Prendas buenas × tarifa destajo; «—» si la operación no tiene pago.
      {
        key: "amount",
        label: "S/",
        type: "text",
        widthMm: 20,
        align: "right",
        empty: "—",
      },
    ],
    defaultColumns: [
      "code",
      "orderCode",
      "bundle",
      "item",
      "operation",
      "good",
      "bad",
      "minutes",
      "amount",
    ],
    mockRows: [
      {
        code: "T-000412",
        orderCode: "OP-0023",
        bundle: "01",
        item: "PO5088 · NEGRO · S",
        operation: "Unir hombros",
        good: "25",
        bad: null,
        minutes: "8,75",
        amount: "2,50",
      },
      {
        code: "T-000413",
        orderCode: "OP-0023",
        bundle: "01",
        item: "PO5088 · NEGRO · S",
        operation: "Pegar cuello",
        good: "25",
        bad: "1",
        minutes: "12,50",
        amount: "3,75",
      },
      {
        code: "T-000420",
        orderCode: "OP-0023",
        bundle: "02",
        item: "PO5088 · NEGRO · S",
        operation: "Unir hombros",
        good: "25",
        bad: null,
        minutes: "8,75",
        amount: "2,50",
      },
      {
        code: "T-000421",
        orderCode: "OP-0023",
        bundle: "02",
        item: "PO5088 · NEGRO · S",
        operation: "Pegar cuello",
        good: "24",
        bad: "1",
        minutes: "12,00",
        amount: "3,60",
      },
      {
        code: "T-000433",
        orderCode: "OP-0023",
        bundle: "03",
        item: "PO5088 · NEGRO · M",
        operation: "Recubrir bajos",
        good: "25",
        bad: null,
        minutes: "10,00",
        amount: null,
      },
      {
        code: "C-001208",
        orderCode: "OP-0027",
        bundle: null,
        item: "PO5090 · AZUL MARINO · L",
        operation: "Pegar etiqueta",
        good: "30",
        bad: null,
        minutes: "4,50",
        amount: "1,20",
      },
      {
        code: "C-001209",
        orderCode: "OP-0027",
        bundle: null,
        item: "PO5090 · AZUL MARINO · L",
        operation: "Cerrar costados con una operación de nombre largo",
        good: "30",
        bad: "2",
        minutes: "15,60",
        amount: "4,68",
      },
    ],
    values: [
      // Nombre · código de cada operario, separados por comas.
      { key: "operator", label: "Operario", type: "text", align: "left" },
      // El día o «del … al …».
      { key: "workedOn", label: "Día trabajado", type: "text", align: "left" },
      // Fecha y hora del registro.
      { key: "registeredAt", label: "Registrado", type: "text", align: "left" },
      { key: "recordCount", label: "Tickets", type: "text", align: "left" },
      { key: "goodTotal", label: "Buenas", type: "text", align: "left" },
      { key: "badTotal", label: "Falladas", type: "text", align: "left" },
      {
        key: "minutesTotal",
        label: "Minutos ganados",
        type: "text",
        align: "left",
      },
      // Con «S/ » delante.
      { key: "amountTotal", label: "A pagar", type: "text", align: "left" },
    ],
    mockValues: {
      operator: "Rosa Quispe Huamán · OP-114",
      workedOn: "29/10/2026",
      registeredAt: "29/10/2026 18:42",
      recordCount: "7",
      goodTotal: "184",
      badTotal: "4",
      minutesTotal: "72,10",
      amountTotal: "S/ 18,23",
    },
  },
};

export const fieldOf = (
  source: PrintDataSource,
  key: string,
): PrintDataField | undefined =>
  source.fields.find((field) => field.key === key);

/**
 * El valor de un campo como se imprime. Sin dato (null), su `empty`; un texto
 * vacío queda vacío: así una línea extra no lleva el «—» del descuento.
 */
export function formatFieldValue(
  field: PrintDataField,
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined) return field.empty ?? "";
  if (typeof value === "string") return value;
  switch (field.type) {
    case "money":
      return value.toFixed(2);
    case "quantity":
      return value % 1 === 0 ? String(value) : value.toFixed(2);
    default:
      return String(value);
  }
}
