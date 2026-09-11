/**
 * Contenido del panel "Entender este reporte" de cada pestaña de Reportes.
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

export const productsGuide: ReportGuide = {
  name: 'ventas de productos',
  summary:
    'Mide la mercadería que salió del almacén. Los datos salen de las líneas de producto de los pedidos Enviado y Entregado, ' +
    'netas de devoluciones confirmadas, y solo de productos activos.',
  rules: [
    'Por defecto cuenta solo pedidos Enviado y Entregado; los En proceso y Armado no entran (sí en Ventas).',
    'Solo productos activos: un producto desactivado desaparece de esta pestaña aunque se haya vendido.',
    'Ingresos valoriza la línea de producto (unidades × precio − descuento), sin flete: es lo que valía la mercadería, no lo que se cobró.',
  ],
  cards: [
    { title: 'Unidades Vendidas', what: 'Unidades netas: vendidas menos devueltas en devoluciones confirmadas.', source: 'Líneas de pedido.' },
    { title: 'Ingresos', what: 'Unidades netas × precio unitario − descuento por unidad. Sin flete ni otros conceptos.', source: 'Líneas de pedido.' },
    { title: 'Productos con Venta', what: 'Productos distintos con al menos una unidad, y en cuántos pedidos.', source: 'Líneas de pedido.' },
    { title: 'Precio Promedio', what: 'Ingresos ÷ unidades.', source: 'Calculado.' },
  ],
  charts: [
    {
      title: 'Ventas por categoría',
      text: 'Ingresos o unidades por categoría. Un producto con varias categorías cuenta entero en cada una, por eso la suma de los bloques supera las unidades de la tarjeta.',
    },
    { title: 'Productos más vendidos', text: 'Ranking por ingresos o unidades, con filtro de categoría y Top 5/10/20.' },
    {
      title: 'Pareto de productos (ABC)',
      text: 'Productos ordenados por ingresos con la línea de acumulado. Clase A: los que juntos llegan al 80 % de los ingresos; B hasta el 95 %; C el resto.',
    },
    {
      title: 'Margen vs volumen',
      text: 'Cada burbuja es un producto (unidades, margen %, tamaño = ingresos). Solo entran productos con costo cargado mayor a cero; las líneas punteadas son las medianas.',
    },
    { title: 'Ingresos por categoría en el tiempo', text: 'Áreas apiladas, 6 categorías principales y "Otras".' },
    {
      title: 'Unidades vendidas por talla y categoría',
      text: 'Matriz de calor. Cada talla pertenece a su grupo: una M de camisas y una M de boxers son columnas distintas.',
    },
    {
      title: 'Análisis de producto individual',
      text: 'Se busca un producto (solo activos) y con Aplicar se ve su ficha: unidades y monto, stock por almacén, participación por sede y canal, evolución diaria y variaciones más vendidas. Respeta los filtros aplicados arriba.',
    },
  ],
  excel:
    'Hoja "Por Producto": una fila por producto × SKU × sucursal × lista de precios, con marca, categorías y etiquetas. Hoja "Por Categoría".',
  validation: [
    {
      check: 'Unidades de un producto',
      how: 'En Lista de ventas filtrá el rango y los estados Enviado y Entregado, abrí los pedidos y sumá las unidades del producto: debe coincidir con "Productos más vendidos" (un producto inactivo no aparece en el reporte aunque esté en el pedido).',
    },
    {
      check: 'Unidades Vendidas e Ingresos',
      how: 'Sumá la columna Cantidad del Excel "Por Producto": da Unidades Vendidas. Sumá Ingresos: da la tarjeta Ingresos.',
    },
    {
      check: 'Stock de la ficha individual',
      how: 'Compará el stock por almacén con Inventario > Lista de inventario filtrando ese producto.',
    },
  ],
};

export const inventoryGuide: ReportGuide = {
  name: 'inventario',
  summary:
    'Es una foto del stock de hoy. No depende del rango de fechas, salvo Flujo de inventario, Tipos de movimiento y Rotación, que miden movimientos del período. ' +
    'Solo cuenta productos, variaciones y almacenes activos.',
  rules: [
    'Filtros propios: Almacén, Umbral de stock bajo (por defecto el de Configuración > Negocio > Operación) y Valorizar con (Minorista o Mayorista).',
    'No hay filtros de canal, pago ni geografía porque el stock no sale de un pedido; el equivalente de sede es el almacén.',
    'Con un almacén elegido, Unidades en stock son las de ese almacén, pero Stock bajo cuenta el SKU sumando todos los almacenes: se repone por SKU, no por depósito.',
  ],
  cards: [
    { title: 'Total SKUs', what: 'Variaciones activas con stock registrado en almacenes activos.', source: 'Stock por variación y almacén.' },
    { title: 'Unidades en stock', what: 'Suma de unidades. Con almacén elegido, las de ese almacén.', source: 'Stock por variación y almacén.' },
    { title: 'Stock bajo', what: 'SKUs cuyo stock sumando todos los almacenes está en o por debajo del umbral. No cambia al elegir un almacén.', source: 'Stock total del SKU contra el umbral.' },
    { title: 'Sin stock', what: 'SKUs con stock total 0.', source: 'Stock total del SKU.' },
    { title: 'Valor del inventario (costo)', what: 'Stock × costo del producto en el catálogo.', source: 'Stock y costo de la variación.' },
    { title: 'Valor potencial de venta', what: 'Stock × precio de la lista elegida (Minorista por defecto). El subtítulo dice con qué lista se valorizó.', source: 'Stock y lista de precios.' },
    { title: 'Margen potencial', what: 'Venta potencial − costo, y su % sobre venta.', source: 'Calculado.' },
    { title: 'Valor inmovilizado', what: 'Costo del stock sin salidas en N días (el N del selector de Stock muerto).', source: 'Stock y movimientos de salida.' },
  ],
  charts: [
    { title: 'Flujo de inventario', text: 'Unidades que entraron y salieron por período según los movimientos de stock, y el neto.' },
    { title: 'Stock por categoría', text: 'Unidades por categoría. Un producto con varias categorías cuenta en todas.' },
    { title: 'Stock por talla', text: 'Unidades y SKUs por talla, con selector de grupo de talla.' },
    { title: 'Tipos de movimiento', text: 'Cuántos movimientos y cuántas unidades por tipo en el período.' },
    {
      title: 'Productos bajo el umbral (reposición)',
      text: 'SKUs con stock total en o bajo el umbral. Misma definición que la alerta de la campana del ERP: sin filtro de almacén su total es la tarjeta Stock bajo.',
    },
    { title: 'Stock sin rotación (stock muerto)', text: 'SKUs con stock y sin ninguna salida en los últimos 30/60/90/180 días, con valor a costo y última salida.' },
    {
      title: 'Análisis de rotación',
      text: 'Por SKU, unidades vendidas en el período contra stock actual. Rotación = vendidas ÷ stock: Alta desde 3, Media desde 1, Baja por debajo. Ordenable por columna.',
    },
  ],
  excel:
    'Hoja "Inventario": una fila por SKU y almacén con stock, stock total del SKU, marca de stock bajo, costo, valor a costo, precio y valor a venta. ' +
    'Hoja "Umbral bajo stock (N)": los SKUs bajo el umbral.',
  validation: [
    {
      check: 'Unidades y SKUs',
      how: 'En Inventario > Lista de inventario filtrá el mismo almacén y compará totales. El reporte solo cuenta productos, variaciones y almacenes activos.',
    },
    { check: 'Stock bajo', how: 'El número de la campana de alertas del ERP es el mismo que la tarjeta y que la tabla de reposición.' },
    {
      check: 'Valorización',
      how: 'Sumá la columna Valor a costo del Excel: da la tarjeta. Cambiá Valorizar con a Mayorista y confirmá que Valor potencial baja y el subtítulo cambia.',
    },
    { check: 'Flujo y tipos de movimiento', how: 'En Inventario > Movimientos de inventario filtrá el rango y contá movimientos por tipo.' },
  ],
};

export const returnsGuide: ReportGuide = {
  name: 'cambios/retornos',
  summary:
    'Mide las devoluciones y cambios registrados en el módulo de Retornos. Cuenta los retornos en situación Aceptado, fechados por el día del retorno, no del pedido.',
  rules: [
    'Por defecto solo retornos Aceptados; Pendientes y Anulados se agregan desde el filtro.',
    'Monto reembolsado es el neto de caja del retorno: los reembolsos suman y la diferencia que paga el cliente en un cambio resta.',
    'Los productos inactivos siguen contando; en el ranking y el Excel llevan la marca "inactivo".',
  ],
  cards: [
    { title: 'Total devoluciones', what: 'Retornos del período, y cuántas unidades volvieron.', source: 'Tabla de retornos.' },
    {
      title: 'Monto reembolsado',
      what: 'Neto de caja de los retornos. Los retornos sin movimiento registrado cuentan en cantidad pero no en monto.',
      source: 'Pagos del retorno.',
    },
    { title: 'Reembolso promedio', what: 'Monto ÷ retornos con movimiento.', source: 'Calculado.' },
    {
      title: 'Tasa de devolución',
      what: 'Retornos ÷ pedidos del período sin cancelados. Los reembolsados sí entran, porque esa situación se la pone la propia devolución.',
      source: 'Calculado.',
    },
  ],
  charts: [
    {
      title: 'Devoluciones en el tiempo',
      text: 'Cantidad (eje izquierdo) y monto reembolsado (eje derecho) por período. Los períodos sin retornos no aparecen.',
    },
    {
      title: 'Detalle por tipo de devolución y Devoluciones por tipo',
      text: 'Los tres tipos del catálogo, Devolución total, Devolución parcial y Cambio, con retornos, participación, unidades y monto. Se usa el tipo y no el motivo porque el motivo es texto libre.',
    },
    {
      title: 'Productos más devueltos',
      text: 'Productos con más retornos. Solo la mercadería que entra; el reemplazo que sale en un cambio no cuenta.',
    },
  ],
  excel:
    'Una fila por retorno: fecha, pedido, cliente, tipo, situación, motivo, sede, canal, productos devueltos, unidades, valor devuelto (precio de lista de lo que volvió) y reembolsado.',
  validation: [
    {
      check: 'Total devoluciones',
      how: 'En Cambios/Retornos > Lista cambios/retornos filtrá el rango por fecha de retorno y situación Aceptado: las filas deben ser la tarjeta.',
    },
    {
      check: 'Monto reembolsado y unidades',
      how: 'Sumá la columna Reembolsado del Excel: da Monto reembolsado. Sumá Unidades devueltas: da el subtítulo de la primera tarjeta.',
    },
    {
      check: 'Tasa de devolución',
      how: 'Total devoluciones ÷ N° de Pedidos de la pestaña Ventas con el mismo rango (Ventas excluye reembolsados y esta tasa no, así que puede diferir en pocos pedidos).',
    },
  ],
};

export const financialGuide: ReportGuide = {
  name: 'financiero',
  summary:
    'Mide dos cosas distintas con dos fuentes distintas: la caja (movimientos de las cuentas del negocio) y la ganancia de los pedidos (líneas de producto contra el costo actual del catálogo). Por eso las dos mitades no suman entre sí.',
  rules: [
    'Caja: cada movimiento es ingreso o egreso según el signo de su monto, que es lo que suma al saldo de la cuenta.',
    'Ganancia: unidades netas de devoluciones, valuadas al costo actual de la variación, no al del día de la venta. Solo cuentan unidades con costo mayor a cero.',
    'Sede y método de pago afectan a todo; cuenta y motivo solo a la caja; estado de pedido solo a la ganancia.',
  ],
  cards: [
    { title: 'Ingresos', what: 'Suma de movimientos con monto positivo, y cuántos son.', source: 'Movimientos de caja.' },
    { title: 'Egresos', what: 'Suma de movimientos con monto negativo, en valor absoluto.', source: 'Movimientos de caja.' },
    { title: 'Flujo neto', what: 'Ingresos − egresos.', source: 'Calculado.' },
    { title: 'Total transacciones', what: 'Movimientos del período.', source: 'Movimientos de caja.' },
    {
      title: 'Cobertura de costo',
      what: 'Qué parte de las unidades vendidas tiene costo cargado mayor a cero. Costo en 0 o vacío cuenta como no cargado. Si es baja, las tres tarjetas siguientes no representan el total.',
      source: 'Líneas de pedido y costo de la variación.',
    },
    { title: 'Ganancia Neta', what: 'Venta de líneas − costo, solo sobre unidades con costo.', source: 'Líneas de pedido y costo actual.' },
    { title: 'Margen', what: 'Ganancia ÷ venta de esas unidades, en %.', source: 'Calculado.' },
    { title: 'Costo Total', what: 'Unidades con costo × costo actual.', source: 'Líneas de pedido y costo actual.' },
  ],
  charts: [
    { title: 'Flujo de caja en el tiempo', text: 'Ingresos y egresos de caja por día, semana o mes.' },
    { title: 'Por clase de movimiento', text: 'Ingresos contra egresos según la clase del movimiento (venta, compra, gasto, retiro...).' },
    { title: 'Ingresos y egresos por método de pago', text: 'Un método puede tener solo egresos, por eso se muestran las dos series.' },
    { title: 'Por sucursal', text: 'Ingresos y egresos según la sucursal en la que se registró el movimiento.' },
    {
      title: 'Top 20 productos por margen',
      text: 'Los 20 con mayor ganancia. "Sin costo cargado" = ninguna unidad del producto tiene costo. "Sin % (venta en 0)" = tiene costo pero se vendió a S/ 0. Es un top, no el total.',
    },
  ],
  excel:
    'Hoja "Movimientos": un movimiento por fila con dirección por signo, tipo registrado, clase, método, cuenta, sucursal y usuario. ' +
    'Hoja "Margen por producto": todos los productos del período, sin el corte del Top 20.',
  validation: [
    {
      check: 'Ingresos y Egresos',
      how: 'En Movimientos > Lista de movimientos filtrá el rango y sumá montos positivos y negativos por separado. Si no cuadran, buscá movimientos tipo Egreso con monto positivo: son registros viejos anteriores al arreglo de julio de 2026, que el módulo clasifica por tipo y el reporte por signo.',
    },
    { check: 'Ganancia Neta', how: 'Sumá la columna de margen de la hoja Margen por producto del Excel: da la tarjeta (la pantalla solo muestra 20 filas).' },
    { check: 'Costo de un producto', how: 'Abrí un producto del Top 20 en Productos y confirmá que el costo de la variación es el que usa la fila (costo × unidades).' },
  ],
};

export const customersGuide: ReportGuide = {
  name: 'clientes',
  summary:
    'Mide quién compra. Un cliente es cualquiera con al menos una compra, con cuenta o sin ella, identificado por su documento. ' +
    'Los datos salen de los pedidos del período; venta es el valor del pedido.',
  rules: [
    'Un DNI y un RUC de la misma persona son dos clientes.',
    'Las ventas sin documento, sin cuenta y sin nombre van a un único "Sin identificar": es mostrador, no una persona.',
    'Distribución de lealtad solo cubre a los clientes con cuenta, porque el nivel vive en su ficha.',
  ],
  cards: [
    { title: 'Compradores únicos', what: 'Clientes distintos con al menos un pedido en el rango.', source: 'Pedidos, por documento.' },
    { title: 'Ticket promedio', what: 'Promedio del total del pedido.', source: 'Pedidos.' },
    { title: 'Con cuenta registrada', what: 'De esos compradores, los que tienen usuario en el sistema.', source: 'Pedidos y perfiles.' },
    { title: 'Sin cuenta', what: 'Los que compraron sin usuario. Con cuenta + Sin cuenta = Compradores únicos.', source: 'Pedidos.' },
  ],
  charts: [
    {
      title: 'Clientes nuevos vs recurrentes',
      text: 'Por período, quiénes compraron por primera vez (mirando todo el historial, no solo el rango) y quiénes ya habían comprado.',
    },
    { title: 'Frecuencia de compra', text: 'Compradores según cuántos pedidos hicieron en el rango.' },
    {
      title: 'Distribución por nivel de fidelización',
      text: 'Solo clientes con cuenta, por sus puntos: L1 desde 150, L2 desde 750, L3 desde 1.500, L4 desde 3.000.',
    },
    {
      title: 'Recencia de clientes',
      text: 'Días desde la última compra, medidos contra el fin del rango: Activos < 30, En riesgo 30-90, Inactivos 90-180, Dormidos > 180.',
    },
    { title: 'Concentración de ingresos (Pareto)', text: 'Clientes en deciles de gasto y % acumulado.' },
    { title: 'Distribución geográfica', text: 'Compradores por departamento y ciudad según la dirección del pedido.' },
    {
      title: 'Clientes por canal de venta y por sucursal',
      text: 'Compradores únicos por canal y por sede. Un cliente que compró en dos sedes cuenta en las dos.',
    },
    { title: 'Top clientes', text: 'Los que más gastaron, con documento, pedidos y nivel. "Sin identificar" aparece como una fila con muchas compras.' },
  ],
  excel:
    'Una fila por cliente: nombre, documento, tipo (con cuenta / sin cuenta / sin identificar), pedidos, gasto, ticket, primera y última compra, nivel, puntos, ' +
    'y las sucursales, canales y métodos de pago de sus compras.',
  validation: [
    {
      check: 'Compradores únicos',
      how: 'En Lista de ventas (administrador) con el mismo rango y estados, contá documentos distintos; las ventas sin documento son una sola fila "Sin identificar". El número de filas del Excel es la tarjeta.',
    },
    {
      check: 'Con cuenta',
      how: 'Los clientes con cuenta se encuentran en Clientes > Lista de clientes por documento; los sin cuenta no están ahí, y es normal.',
    },
    { check: 'Nivel', how: 'Abrí la ficha del cliente en Lista de clientes y compará puntos y nivel con el Excel.' },
  ],
};

export const priceRulesGuide: ReportGuide = {
  name: 'regla de precios',
  summary:
    'Mide cuánto se usan las reglas de descuento automáticas. Los datos salen de los descuentos registrados en cada pedido del período, acreditados a la regla que estaba vigente ese día.',
  rules: [
    'Una aplicación es un descuento de regla dentro de un pedido, contado una sola vez.',
    'Venta generada es la venta de los pedidos donde aplicó la regla, no el monto descontado: el sistema descuenta por unidad dentro de cada línea y no guarda ese monto atribuido a la regla.',
    'Otros descuentos junta lo que no sale de una regla (descuento manual, por producto, recargo de Mercado Pago) y queda fuera del % de uso.',
  ],
  cards: [
    { title: 'Reglas activas / apagadas', what: 'El catálogo de hoy. No cambia con el rango.', source: 'Reglas de precios.' },
    { title: 'Reglas usadas', what: 'Reglas con al menos una aplicación en el rango.', source: 'Descuentos de los pedidos.' },
    { title: 'Aplicaciones', what: 'Descuentos de regla dentro de pedidos, contados una vez cada uno.', source: 'Descuentos de los pedidos.' },
    {
      title: 'Venta con regla',
      what: 'Valor de los pedidos que tuvieron al menos una regla (un pedido con dos reglas cuenta una vez), y "N de M pedidos (X % del total)" sobre los pedidos del período.',
      source: 'Pedidos y sus descuentos.',
    },
  ],
  charts: [
    {
      title: 'Reglas por aplicación',
      text: 'Una fila por regla con su código (etiqueta gris; algunas reglas no tienen), estado (activa, apagada o Eliminada si ya no existe pero tuvo aplicaciones), aplicaciones, pedidos, venta generada y participación. La barra morada compara el uso de cada regla con la más usada, no es un porcentaje del total.',
    },
  ],
  excel: 'Una fila por regla con los mismos datos de la tabla, más la fila de Otros descuentos.',
  validation: [
    { check: 'Reglas activas', how: 'Contá en Descuentos > Reglas de precios las activas y las apagadas.' },
    {
      check: 'Aplicaciones',
      how: 'Abrí en Lista de ventas un pedido de los que figuran con regla; en su detalle se ve el descuento con el código de la regla.',
    },
    {
      check: 'Venta con regla',
      how: 'En Lista de ventas filtrá el mismo rango y estados; el "M" del subtítulo es ese total de pedidos (con usuario administrador, o con la Sede filtrada).',
    },
  ],
};

export const sellersGuide: ReportGuide = {
  name: 'ventas por usuarios',
  summary:
    'Mide quién registró cada venta. Vendedor es el usuario que creó el pedido desde el ERP o el POS. Los datos salen de los pedidos del período; venta es el valor del pedido.',
  rules: [
    'Las ventas de la web y el chatbot no tienen vendedor: se cuentan aparte como "Sin vendedor" y no entran al ranking.',
    'La sucursal del ranking y de la tabla es la del perfil del usuario; la del gráfico por sucursal es la del pedido.',
    'Por defecto cuenta todos los estados menos Cancelado y Reembolsado.',
  ],
  cards: [
    { title: 'Vendedores con venta', what: 'Usuarios distintos que registraron pedidos en el rango.', source: 'Pedidos, por usuario creador.' },
    { title: 'Ventas con vendedor', what: 'Valor de los pedidos con vendedor, y qué % son del total del período.', source: 'Pedidos.' },
    { title: 'Pedidos con vendedor', what: 'Cuántos pedidos tienen vendedor y cuántos no (web / chatbot).', source: 'Pedidos.' },
    { title: 'Ticket promedio', what: 'Promedio del pedido con vendedor.', source: 'Calculado.' },
  ],
  charts: [
    {
      title: 'Vendedores con más ventas',
      text: 'Ranking por ventas o pedidos, Top 5/10/20. El tooltip muestra ventas, pedidos, unidades y la sucursal del vendedor.',
    },
    {
      title: 'Vendedores por sucursal',
      text: 'Ventas apiladas por vendedor según la sucursal del pedido. 6 vendedores principales, "Otros vendedores" y "Sin vendedor" en gris.',
    },
    { title: 'Ventas por vendedor en el tiempo', text: 'Áreas apiladas por día, semana o mes.' },
    {
      title: 'Detalle por vendedor',
      text: 'Pedidos, unidades netas, ventas, ticket, participación y última venta, ordenable, con total. "Sin vendedor" cierra la tabla.',
    },
  ],
  excel:
    'Hoja "Por vendedor" (la tabla) y hoja "Pedidos": un pedido por fila con vendedor, sucursal del vendedor, sucursal del pedido, canal, estado, cliente, unidades y total.',
  validation: [
    {
      check: 'Ranking y tabla',
      how: 'El Excel de la pestaña Ventas tiene una columna Vendedor por pedido: con el mismo rango y estados, contá pedidos por vendedor. También se ve en Lista de ventas, en el historial de estados de cada pedido.',
    },
    {
      check: 'Total del período',
      how: 'Sumá la columna Total de la hoja Pedidos: da Ventas con vendedor + Sin vendedor, el mismo total que "Venta con regla" muestra como M en Regla de precios.',
    },
    { check: 'Sin vendedor', how: 'Los pedidos de canal web o chatbot deben aparecer siempre como "Sin vendedor".' },
  ],
};
