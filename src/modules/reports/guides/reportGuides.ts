/**
 * Contenido del panel "Detalle del reporte" de cada pestaña de Reportes.
 *
 * Es la versión corta del manual (docs/manual-reportes.md): qué mide la
 * pestaña, qué es cada tarjeta y de dónde sale, qué muestra cada gráfico,
 * qué trae el Excel y cómo validar los números contra los módulos del ERP.
 * Va como datos y no como JSX para que el texto se lea y se corrija fácil.
 */

export interface GuideCard {
  title: string;
  /** Qué es, en una o dos frases. */
  what: string;
  /** De dónde sale el número. */
  source: string;
}

export interface GuideChart {
  title: string;
  text: string;
}

export interface GuideValidation {
  /** Qué se quiere comprobar. */
  check: string;
  /** Contra qué módulo o archivo, y qué debe cuadrar. */
  how: string;
}

export interface ReportGuide {
  /** Nombre de la pestaña, tal como aparece en el menú. */
  name: string;
  /** Qué mide y de dónde salen los datos, en dos o tres frases. */
  summary: string;
  /** Reglas que hay que tener en la cabeza para leer bien la pestaña. */
  rules: string[];
  cards: GuideCard[];
  charts: GuideChart[];
  excel: string;
  validation: GuideValidation[];
}

/** Conceptos que se repiten en todas las pestañas; van al pie de cada panel. */
export const COMMON_CONCEPTS: GuideChart[] = [
  {
    title: 'Tres formas de medir "venta"',
    text:
      'Cobranza neta: lo efectivamente pagado del pedido menos lo reembolsado (Ventas). ' +
      'Valor del pedido: el total del pedido, con flete y descuentos, se haya cobrado o no (Clientes, Regla de precios, Vendedores). ' +
      'Líneas de producto: unidades × precio − descuento por unidad, sin flete (Productos, Top productos, Financiero). ' +
      'Es la causa más común de que dos cifras no cuadren.',
  },
  {
    title: 'Estado de pedido por defecto',
    text:
      'Ventas, Clientes, Financiero, Regla de precios y Vendedores cuentan todo menos Cancelado y Reembolsado. ' +
      'Productos cuenta solo Enviado y Entregado (mercadería que salió del almacén). ' +
      'Cambios/Retornos cuenta solo retornos Aceptados. El filtro Estado de pedido cambia ese default.',
  },
  {
    title: 'Productos activos e inactivos',
    text:
      'Productos e Inventario solo cuentan productos activos. Ventas, Financiero, Retornos y Vendedores cuentan también los inactivos ' +
      '(Retornos los marca con "inactivo"). Un producto vendido y luego desactivado desaparece de Productos pero sigue sumando en Ventas.',
  },
  {
    title: 'Lista de ventas muestra solo tu sucursal',
    text:
      'El módulo Ventas > Lista de ventas filtra por la sucursal del usuario conectado, salvo que sea administrador. ' +
      'Los reportes muestran todas las sucursales: para comparar, entrá como administrador o poné el mismo filtro de Sede en el reporte.',
  },
  {
    title: 'El Excel es la herramienta de validación',
    text:
      'El botón Descargar exporta con los mismos filtros aplicados en la barra y los mismos cálculos de la pantalla. ' +
      'Primero comprobá que el Excel cuadra con las tarjetas; después cruzá el Excel con el módulo del ERP. ' +
      'Si cuadra con la pantalla pero no con el módulo, la diferencia es de definición, no de cálculo.',
  },
];

export const salesGuide: ReportGuide = {
  name: 'Ventas',
  summary:
    'Mide cuánto se cobró y cuánto se pidió en el período. Los datos salen de los pedidos, sus pagos registrados y los reembolsos de devoluciones. ' +
    'Un pedido entra al rango por su fecha de pedido, la misma que se ve en Lista de ventas.',
  rules: [
    'Por defecto cuenta todos los estados menos Cancelado y Reembolsado.',
    'Los montos son cobranza neta: un pedido entregado pero sin pago registrado aporta 0.',
    'Los productos inactivos siguen contando.',
  ],
  cards: [
    {
      title: 'Ventas Totales',
      what: 'Cobranza neta del período: pagos registrados de los pedidos del rango, menos reembolsos.',
      source: 'Pagos del pedido + pagos de retorno (negativos).',
    },
    {
      title: 'N° de Pedidos',
      what: 'Pedidos del rango con estado dentro del default. Cuenta el pedido esté cobrado o no.',
      source: 'Tabla de pedidos, por fecha de pedido.',
    },
    {
      title: 'Ticket Promedio',
      what: 'Promedio de lo cobrado por pedido.',
      source: 'Cobranza ÷ pedidos.',
    },
    {
      title: 'Descuentos Totales',
      what: 'Suma del descuento de cada pedido. No incluye los descuentos por unidad dentro de las líneas.',
      source: 'Campo descuento del pedido.',
    },
  ],
  charts: [
    {
      title: 'Ventas en el tiempo',
      text: 'Cobranza neta por día, semana o mes. Se fecha por la fecha del pedido, no la del pago.',
    },
    {
      title: 'Ventas por sucursal, canal, método de pago y estado',
      text:
        'Cobranza neta repartida por cada dimensión. En método de pago, un pedido con dos métodos suma en los dos, así que las porciones pueden superar el total. ' +
        'Los valores en cero no se dibujan y la cola se agrupa en "Otros".',
    },
    {
      title: 'Mapa de calor',
      text:
        'Cobranza o cantidad de pedidos por departamento según la dirección de entrega, con clic para bajar a provincia y distrito. ' +
        'Los pedidos sin dirección solo aparecen en la tabla lateral.',
    },
    {
      title: 'Top productos',
      text:
        'Ranking por ingresos o unidades. Acá los ingresos son líneas de producto (unidades × precio − descuento), no cobranza, ' +
        'y las unidades son brutas: no descuentan devoluciones.',
    },
  ],
  excel:
    'Hoja "Ventas": un pedido por fila con fecha, cliente, canal, sede, vendedor, estado, total del pedido, cobrado y reembolsado. ' +
    'Hoja "Ventas Detalle": una línea de producto por fila.',
  validation: [
    {
      check: 'N° de Pedidos',
      how:
        'En Lista de ventas (con usuario administrador) poné el mismo rango y excluí cancelados y reembolsados: el total de filas debe ser la tarjeta. ' +
        'Con la Sede filtrada en el reporte coincide con lo que ve un usuario no administrador de esa sede.',
    },
    {
      check: 'Ventas Totales',
      how:
        'Descargá el Excel y sumá la columna de cobrado menos la de reembolsado de la hoja Ventas: debe dar la tarjeta. ' +
        'La diferencia contra el total de los pedidos son los pedidos sin cobrar o cobrados en parte (filtrá la hoja por cobrado menor al total).',
    },
    {
      check: 'Top productos',
      how: 'Sumá unidades por producto en la hoja Ventas Detalle.',
    },
  ],
};
