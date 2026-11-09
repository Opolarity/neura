/**
 * Lo que hace cada propiedad del panel, en el tooltip del icono de ayuda junto
 * a su nombre. Breve (una idea, una o dos frases cortas), neutro y sin
 * palabras técnicas: lo lee quien arma una plantilla sin saber de código. Una
 * propiedad nueva suma aquí su texto.
 */
export const PROPERTY_HELP = {
  // --- Contenedor (propias) ---
  paperPreset: "El tamaño del papel: uno recomendado o uno a tu medida.",
  paperWidth: "El ancho del papel, en mm.",
  paperHeight: "El alto del papel, en mm.",
  pageSize:
    "El tamaño del papel. Lo fija el tipo de plantilla; con alto automático, la hoja crece con su contenido.",
  direction: "Si los elementos van uno al lado del otro o uno debajo del otro.",
  alignment:
    "Dónde quedan los elementos dentro. Doble clic en una posición para repartirlos.",
  gap: "El espacio entre los elementos. En Auto se reparte el espacio libre.",
  clip: "Oculta lo que se salga del contenedor.",
  keepTogether:
    "Si no entra en lo que queda de la página, pasa entero a la siguiente, como «Conservar líneas juntas» en Word.",
  wrap: "Lo que no entra a lo ancho sigue en la fila de abajo. Si uno se oculta, los demás se corren.",
  pageHeader:
    "Un contenedor que sale arriba de las páginas, como en Word. Al apagarlo se quita con lo que lleva.",
  pageFooter:
    "Un contenedor que sale abajo de las páginas, como en Word. Al apagarlo se quita con lo que lleva.",
  zonePages:
    "En qué páginas sale: en todas, desde una (por ejemplo, un «(cont.)» desde la 2), solo en una o en un rango.",

  // --- Impresión (columnas y copias, en la barra del editor) ---
  impositionPreset:
    "El papel de tu impresora: uno recomendado o uno a tu medida.",
  impositionPerSize:
    "Cada medida de la hoja guarda su propia impresión: al cambiar de medida vuelven sus columnas, copias y márgenes. Apagado, la misma impresión sirve para todas.",
  impositionColumns:
    "Cuántas veces va la hoja lado a lado en el papel, como en los rollos de varias columnas.",
  impositionGap: "El espacio entre una columna y la siguiente.",
  impositionMarginLeft: "El espacio libre a la izquierda del papel.",
  impositionMarginRight: "El espacio libre a la derecha del papel.",
  impositionCopies: "Cuántas veces sale el documento entero.",
  impositionOrder:
    "Intercalado: cada copia completa, una tras otra. Agrupado: cada página repetida seguida.",

  // --- Texto (propias) ---
  content:
    "El texto que se imprime. También se escribe con doble clic en la hoja.",
  fontFamily: "El tipo de letra.",
  fontWeight: "Qué tan gruesa es la letra, según lo que tenga la fuente.",
  textStyle: "Cursiva, subrayado o tachado. Se pueden combinar.",
  textCase: "Cómo se ven las mayúsculas, sin cambiar lo escrito.",
  fontSize: "El tamaño de la letra.",
  lineHeight: "El espacio entre líneas. 1 es lo normal.",
  letterSpacing: "La separación entre letras. Con negativos se juntan.",
  textAlign: "Hacia qué lado se acomoda el texto.",
  textColor: "El color de la letra.",

  // --- Tabla de datos (propias) ---
  dataSource:
    "La lista de la que salen las filas. Al cambiarla, vuelven sus columnas.",
  columns: "Los datos de cada fila, en este orden. Arrastra para reordenarlos.",
  groupBy:
    "Cada vez que cambia el valor de esa columna, la tabla vuelve a poner su título (con el nombre del grupo) y su encabezado.",
  groupFooter:
    "Un pie al terminar cada grupo. Se arma como un contenedor: sus textos toman los datos del grupo desde su Origen.",
  hideEmptyColumns:
    "Las columnas sin ningún dato no salen: en toda la tabla, o en cada grupo (con su encabezado).",
  showTitle:
    "Un título arriba de la tabla. Se escribe en su Texto, con doble clic.",
  titleRepeat:
    "Si la tabla sigue en otra página, vuelve a poner el título arriba: igual o con un texto al final.",
  titleRepeatText:
    "Lo que se agrega al final del título repetido, como «(continuación)».",
  showHeader: "Muestra el nombre de cada columna arriba.",
  repeatHeader:
    "Si la tabla sigue en otra página, vuelve a poner el encabezado arriba.",
  rowGap: "El espacio entre una fila y la siguiente.",
  sampleRows:
    "Cuántas filas de ejemplo ves (hasta 40; con 0, cómo sale sin filas). Al imprimir salen todas.",
  emptyRows:
    "Qué sale cuando el documento no trae ninguna fila: el título y el encabezado solos, con un mensaje debajo, o nada de la tabla. Mientras editas, la tabla oculta sigue a la vista.",
  emptyRowsText: "Lo que dice la tabla cuando no trae ninguna fila.",
  headerBackground: "El color de fondo del encabezado de la tabla.",
  rowsBackground:
    "El color de fondo de todas las filas. Las filas coloreadas van encima.",
  tableLines: "Qué líneas lleva la tabla, como los bordes de Excel.",
  tableLineStyle: "Continua, discontinua, punteada o doble.",
  tableLineWidth: "Lo gruesas que son las líneas.",
  tableLineColor: "El color de las líneas.",
  hideWhenEmpty:
    "Oculta el contenedor cuando su dato está vacío o es cero. Al editar se ve, con una marca.",
  hideSource: "De dónde sale el dato. Sin elegir ninguno, se oculta siempre.",
  hideKey: "El dato que decide si se oculta.",
  barcodeOrigin:
    "Lo que guarda el código: un dato del documento o un texto tuyo.",
  barcodeContent: "El texto que guarda el código de barras.",
  barcodeShowValue: "Escribe el valor debajo de las barras.",
  barcodeQuietZone:
    "El espacio en blanco a los lados de las barras. Las etiquetas usan 0.",
  qrOrigin: "Lo que guarda el QR: un dato del documento o un texto tuyo.",
  qrContent: "El texto o la dirección web que guarda el QR.",
  qrQuietZone: "El borde blanco alrededor del código. Los comprobantes usan 1.",
  qrLevel:
    "Cuánto puede dañarse el código y seguir leyéndose. Los comprobantes usan Media.",
  stripeRows: "Colorea una fila sí y una no.",
  stripeOn: "Qué filas se colorean: las impares o las pares.",
  stripeColor: "El color de las filas coloreadas.",
  imageOrigin:
    "De dónde sale la imagen: una dirección web o el logo de la empresa.",
  imageUrl: "La dirección web de la imagen (https://...).",
  imageFit: "Cómo entra la imagen en su caja: entera, rellenándola o estirada.",
  overflowMode:
    "Qué pasa si el texto no cabe en su tamaño fijo: se ve todo, se achica la letra o se corta.",
  textOrigin:
    "De dónde sale el texto: un dato del documento o de la empresa. Sin elegir, se escribe a mano.",
  emptyText:
    "Lo que se escribe si el dato llega vacío, como «—». Vacío, no se escribe nada.",
  valueFormat:
    "Cómo se escribe. El número de página es el de cada página; la fecha, la del día en que se genera.",
  textValue: "Qué dato muestra. Los del documento se ven de ejemplo.",
  tableTextValue:
    "El dato de su columna. Se cambia en las columnas de la tabla.",
  tableImageOrigin:
    "Sale de la lista de la tabla: una imagen por fila. Se cambia desde la tabla.",
  rowsDirection:
    "Una debajo de otra, como una lista, o una al lado de otra (por ejemplo, fotos), pasando a otra fila si no entran.",
  tableTextOrigin: "Sale de la lista de la tabla. Se cambia desde la tabla.",

  // --- Posición ---
  free: "Coloca el elemento en cualquier parte de la hoja.",
  x: "La distancia desde el borde izquierdo de la hoja.",
  y: "La distancia desde el borde de arriba de la hoja.",
  positionAlign: "Lleva el elemento a un borde o al centro. Necesita Libre.",

  // --- Tamaño ---
  width:
    "Fijo: la medida que escribas. Rellenar: el espacio libre. Ajustar a contenido: lo que mide lo de dentro.",
  height:
    "Fijo: la medida que escribas. Rellenar: el espacio libre. Ajustar a contenido: lo que mide lo de dentro.",
  aspectRatio: "Mantiene la proporción: al cambiar el ancho, cambia el alto.",

  // --- Espaciado ---
  padding: "El espacio entre el borde y lo que tiene dentro.",
  margin: "El espacio libre alrededor, por fuera del borde.",

  // --- Apariencia ---
  background: "El color del fondo.",

  // --- Borde ---
  borderLineStyle: "Continua, discontinua, punteada o doble.",
  borderColor: "El color del borde.",
  borderRadius: "Qué tan redondas son las esquinas. Con 0, rectas.",
} as const;
