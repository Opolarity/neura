import type { PromptBlock } from "../types/chatbotConsiderations.types";
import { headingText } from "./chatbotConsiderations.adapter";

/**
 * Cómo se muestran las secciones del prompt en Consideraciones: un nombre
 * claro y un grupo por tema. Es solo de la pantalla: el bot sigue leyendo el
 * prompt con sus títulos y en su orden (los títulos no se cambian en el prompt
 * porque el recorte por tema y las ediciones de la tienda cuelgan de ellos).
 *
 * La clave es la de la sección en chatbot_prompt_blocks (`h:` + el título en
 * minúsculas, sin tildes). Una sección que el equipo agregue al prompt y no
 * esté acá aparece en "Otros", con su título del prompt.
 */
export const SECTION_GROUPS: ReadonlyArray<{ name: string; sections: ReadonlyArray<readonly [key: string, name: string]> }> = [
  {
    name: "Quién es y cómo habla",
    sections: [
      ["h:identidad", "Quién es el bot"],
      ["h:formato-de-respuesta-nunca-violar", "Formato de los mensajes"],
      ["h:saludo-inicial", "Saludo"],
      ["h:cierre", "Cómo termina cada mensaje"],
      ["h:temas-fuera-de-contexto", "Temas que no son de la tienda"],
    ],
  },
  {
    name: "Productos",
    sections: [
      ["h:productos-y-stock", "Productos y stock"],
      ["h:tallas-el-corte-y-el-link-nunca-una-recomendacion", "Tallas y guía de tallas"],
      ["h:links-de-categoria", "Links de categorías"],
      ["h:links-que-manda-el-cliente", "Links que manda el cliente"],
    ],
  },
  {
    name: "Venta",
    sections: [
      ["h:flujo-de-venta", "Paso a paso de la venta"],
      ["h:sesion-de-compra-actual", "Datos de la compra en curso"],
    ],
  },
  {
    name: "Promociones y descuentos",
    sections: [
      ["h:promociones", "Promociones"],
      ["h:descuentos-y-promociones-en-el-carrito", "Descuentos en el carrito"],
      ["h:cupones-y-codigos-de-descuento", "Cupones"],
      ["h:descuento-de-cumpleanos", "Descuento de cumpleaños"],
    ],
  },
  {
    name: "OVTK Crew",
    sections: [
      ["h:ovtk-crew-niveles-y-beneficios", "Niveles y beneficios"],
      ["h:ovtk-crew-antes-de-cerrar-la-venta", "Crew antes de cerrar la venta"],
      ["h:ovtk-crew-al-recibir-el-comprobante", "Crew al recibir el comprobante"],
    ],
  },
  {
    name: "Envíos y tiendas",
    sections: [
      ["h:hacen-envios-a-provincia", "Envíos a provincia"],
      ["h:plazos-de-entrega", "Plazos de entrega"],
      ["h:tiendas-y-sucursales", "Tiendas y sucursales"],
    ],
  },
  {
    name: "Pedidos ya hechos",
    sections: [
      ["h:consultas-de-cliente-pedidos", "Consultar un pedido"],
      ["h:modificar-un-pedido-ya-creado", "Modificar un pedido"],
      ["h:cancelar-un-pedido", "Cancelar un pedido"],
      ["h:errores-en-la-web-ecommerce", "Fallas de la web"],
      ["h:problemas-con-la-cuenta", "Problemas con la cuenta"],
    ],
  },
  {
    name: "Asesor y otros contactos",
    sections: [
      ["h:atencion-humana-pedido-de-asesor", "Cuando pide un asesor"],
      ["h:recopilar-informacion-antes-de-derivar", "Datos antes de derivar"],
      ["h:regla-general-lo-que-no-podes-resolver-se-deriva", "Cuándo se deriva"],
      ["h:propuestas-de-marketing-auspicios-colaboraciones-prensa", "Propuestas de marketing"],
      ["h:redes-sociales", "Redes sociales"],
      ["h:preguntas-frecuentes", "Preguntas frecuentes"],
    ],
  },
  {
    name: "Reglas del sistema",
    sections: [
      ["h:regla-absoluta", "Regla principal"],
      ["h:mensajes-seguidos-un-solo-turno", "Varios mensajes seguidos"],
      ["h:reglas-tecnicas", "Reglas técnicas"],
      ["h:plantillas", "Respuestas fijas"],
    ],
  },
];

export const OTHERS_GROUP = "Otros";

const BY_KEY = new Map(SECTION_GROUPS.flatMap((g) => g.sections.map(([key, name]) => [key, { group: g.name, name }] as const)));

/** El nombre de una sección en la pantalla; si no está en el mapa, su título del prompt. */
export const sectionName = (heading: PromptBlock): string => BY_KEY.get(heading.headingKey)?.name ?? headingText(heading);

/** ¿El nombre de la pantalla es distinto del título del prompt? (entonces el original va en chico). */
export const hasFriendlyName = (heading: PromptBlock): boolean => BY_KEY.has(heading.headingKey) && sectionName(heading) !== headingText(heading);

/** Una sección del prompt (título `## ` y todo lo que sigue hasta el próximo) con su lugar en la pantalla. */
export interface PromptSection {
  heading: PromptBlock;
  group: string;
  /** Subtítulos `### ` y párrafos, en el orden del prompt. */
  items: PromptBlock[];
}

/**
 * Parte los párrafos en secciones `## ` y las ordena por grupo (en el orden del
 * mapa; las que no están, al final en "Otros"). El título `# ` del prompt no se
 * muestra.
 */
export const groupSections = (blocks: PromptBlock[]): { group: string; sections: PromptSection[] }[] => {
  const sections: PromptSection[] = [];
  for (const b of blocks) {
    if (b.kind === "heading" && (b.headingLevel ?? 1) <= 2) {
      if ((b.headingLevel ?? 1) === 2) sections.push({ heading: b, group: BY_KEY.get(b.headingKey)?.group ?? OTHERS_GROUP, items: [] });
      continue;
    }
    sections.at(-1)?.items.push(b);
  }
  const order = (s: PromptSection) => {
    const g = SECTION_GROUPS.findIndex((x) => x.name === s.group);
    const i = g < 0 ? -1 : SECTION_GROUPS[g].sections.findIndex(([key]) => key === s.heading.headingKey);
    return g < 0 ? [SECTION_GROUPS.length, 0] : [g, i];
  };
  const sorted = sections
    .map((s, n) => ({ s, n, o: order(s) }))
    .sort((a, b) => a.o[0] - b.o[0] || a.o[1] - b.o[1] || a.n - b.n)
    .map((x) => x.s);
  const out: { group: string; sections: PromptSection[] }[] = [];
  for (const s of sorted) {
    const last = out.at(-1);
    if (last && last.group === s.group) last.sections.push(s);
    else out.push({ group: s.group, sections: [s] });
  }
  return out;
};
