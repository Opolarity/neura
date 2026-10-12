// Nombre legible y ejemplo de cada dato que el bot rellena en las plantillas
// (T-902). En la base las plantillas guardan `{clave}`, `{clave?}` o
// `{clave|texto}` (la sintaxis de fillTemplate en neura-chatbot); en el editor
// se muestran como `[Nombre]` y se vuelven a convertir al guardar.
//
// Si el bot suma un dato nuevo, agregarlo acá; mientras tanto se muestra con un
// nombre armado a partir de la clave.

interface VariableInfo {
  label: string;
  example: string;
}

export const TEMPLATE_VARIABLES: Record<string, VariableInfo> = {
  // Pedido y pago
  numero_pedido: { label: "Número de pedido", example: "178245" },
  total: { label: "Total", example: "129.90" },
  subtotal: { label: "Subtotal", example: "139.80" },
  anterior: { label: "Total anterior", example: "159.80" },
  nuevo: { label: "Total nuevo", example: "139.80" },
  total_label: { label: "Nombre del total", example: "Total con el envío" },
  nombre_metodo: { label: "Método de pago", example: "Yape" },
  numero: { label: "Número de cuenta", example: "987 654 321" },
  sin_datos: { label: "Aviso de datos de pago", example: "En un momento te paso los datos de la cuenta para el pago." },
  verifica: { label: "Aviso para verificar el nombre", example: "Antes de realizar el pago, verifica que aparezca el nombre indicado." },
  items: { label: "Lista de productos", example: "• Polo Oversize Negro talla M x1 — S/.69.90" },
  promocion: { label: "Promoción", example: "Envío gratis por compras desde S/.150" },
  linea_envio: { label: "Costo de envío", example: "Envío: S/.10.00" },
  costo: { label: "Costo del recojo", example: "sin costo" },
  // Cupón
  codigo: { label: "Código del cupón", example: "BIENVENIDO10" },
  ahorro: { label: "Ahorro del cupón", example: "15.00" },
  motivo: { label: "Motivo del rechazo", example: "el cupón ya venció" },
  // Datos del cliente
  saludo: { label: "Saludo", example: "¡Hola, buenas tardes!" },
  nombre: { label: "Nombre del cliente", example: "Juan Pérez" },
  documento: { label: "Documento", example: "DNI 45678912" },
  direccion: { label: "Dirección", example: "Av. Larco 123, Miraflores, Lima" },
  correo: { label: "Correo", example: "cliente@gmail.com" },
  intro: { label: "Introducción", example: "👽 Para registrar tu pedido necesito estos datos:" },
  linea_comprobante: { label: "Pedir comprobante", example: "¿Boleta o factura?:" },
  linea_documento: { label: "Pedir documento", example: "Tipo y número de documento:" },
  linea_nombre: { label: "Pedir nombre", example: "Nombre y apellido:" },
  linea_direccion: { label: "Pedir dirección", example: "Dirección exacta (con distrito y provincia):" },
  linea_referencia: { label: "Pedir referencia", example: "Referencia para ubicarte (una tienda, un parque, color de puerta…):" },
  linea_celular: { label: "Pedir celular", example: "Número de celular:" },
  linea_correo: { label: "Pedir correo", example: "Correo electrónico (opcional):" },
  // OVTK Crew y cumpleaños
  n: { label: "Nivel", example: "2" },
  pct: { label: "Porcentaje de descuento", example: "10%" },
  puntos: { label: "Puntos", example: "1650" },
  nivel_siguiente: { label: "Nivel siguiente", example: "3" },
  umbral: { label: "Puntos del nivel siguiente", example: "2000" },
  faltan: { label: "Puntos que faltan", example: "350" },
  hasta: { label: "Fecha límite", example: "15/10/2026" },
  // Sucursales y links
  ciudad: { label: "Ciudad", example: "Arequipa" },
  sede: { label: "Sucursal", example: "la sucursal de Arequipa" },
  nombre_sede: { label: "Nombre de la sucursal", example: "Overtake Arequipa" },
  link_wsp: { label: "WhatsApp de la sucursal", example: "https://wa.me/51987654321" },
  link: { label: "Link al WhatsApp del equipo", example: "https://wa.me/51903333409?text=Hola" },
  url: { label: "Link de las prendas", example: "https://overtake.com.pe/tienda" },
  instagram: { label: "Instagram", example: "@overtake.pe" },
  tiktok: { label: "TikTok", example: "@overtake.pe" },
  facebook: { label: "Facebook", example: "facebook.com/overtake.pe" },
  web: { label: "Página web", example: "overtake.com.pe" },
};

const humanize = (key: string) => {
  const s = key.replace(/_/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const variableLabel = (key: string): string => TEMPLATE_VARIABLES[key]?.label ?? humanize(key);

export const variableExample = (key: string): string => TEMPLATE_VARIABLES[key]?.example ?? variableLabel(key);

/**
 * [Nombre] del editor → clave del bot (T-917, 05/10/2026): la de un dato
 * conocido ("Ciudad" → ciudad) o una armada con el nombre ("Talla del cliente"
 * → talla_del_cliente). "" si el nombre no tiene letras ni números.
 */
export const variableKeyForLabel = (label: string): string => {
  const wanted = label.trim().toLowerCase();
  const known = Object.entries(TEMPLATE_VARIABLES).find(([, v]) => v.label.toLowerCase() === wanted);
  if (known) return known[0];
  return label
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
};
