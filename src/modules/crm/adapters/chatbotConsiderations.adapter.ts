import type { ChatbotPromptSetting } from "../types/chatbotBehavior.types";
import type { PromptBlock, PromptBlockApi } from "../types/chatbotConsiderations.types";
import { describeValue, toStoreLocations } from "./chatbotBehavior.adapter";

export const toPromptBlock = (row: PromptBlockApi): PromptBlock => ({
  id: row.id,
  origin: row.origin,
  kind: row.kind,
  headingKey: row.heading_key,
  headingLevel: row.heading_level,
  title: row.title,
  content: row.content,
  originalContent: row.original_content,
  locked: row.locked,
  tags: row.tags ?? [],
  active: row.active,
  updatedAt: row.updated_at,
  updatedByName: row.updated_by_name,
});

/** Para buscar: minúsculas y sin tildes ("Garantía" y "garantia" coinciden). */
export const normalize = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

export const matchesQuery = (b: PromptBlock, query: string): boolean => {
  const q = normalize(query.trim());
  if (!q) return true;
  return normalize(`${b.title}\n${b.content}\n${b.tags.join(" ")}`).includes(q);
};

/** ¿La tienda cambió el texto que publicó el equipo? */
export const isEditedByStore = (b: PromptBlock): boolean =>
  b.origin === "system" && b.originalContent != null && b.content !== b.originalContent;

/** El título de una sección sin los # del prompt. */
export const headingText = (b: PromptBlock): string => b.content.replace(/^#+\s*/, "");

const SLOT = /\{\{([a-z0-9_]+)(?:\|([^}]*))?\}\}/g;
const SI = /^\s*\[\[si\s+([a-z0-9_]+)(?:\s*(!=|!~|=|~)\s*("[^"]*"|[a-z0-9_,-]+))?(\s+\*)?\s*\]\]\s*$/;
const FIN = /^\s*\[\[fin\]\]\s*$/;

/** Los ajustes que nombra un párrafo técnico (para ofrecer cambiarlos desde ahí). */
export const settingCodesIn = (text: string): string[] => {
  const codes = new Set<string>();
  for (const m of text.matchAll(SLOT)) codes.add(m[1] === "sales_whatsapp_display" ? "sales_whatsapp" : m[1]);
  for (const line of text.split("\n")) {
    const m = SI.exec(line);
    if (m) codes.add(m[1]);
  }
  return [...codes];
};

/** Un trozo de un párrafo técnico: texto, o las versiones de un ajuste entre las que elige la tienda. */
export type ParagraphPart =
  | { kind: "text"; text: string }
  | { kind: "choice"; code: string; raw: string; variants: { value: string; text: string; isDefault: boolean }[] };

/**
 * Parte un párrafo técnico para mostrarlo: cada grupo seguido de
 * `[[si ajuste = valor]] … [[fin]]` del mismo ajuste es una elección (las
 * versiones del texto, una por valor). Lo demás queda como texto, con sus
 * marcas, para que renderWithSettings lo resuelva.
 */
export const splitChoices = (text: string): ParagraphPart[] => {
  const lines = text.split("\n");
  const parts: ParagraphPart[] = [];
  let plain: string[] = [];
  const flush = () => {
    if (plain.length) parts.push({ kind: "text", text: plain.join("\n") });
    plain = [];
  };
  let i = 0;
  while (i < lines.length) {
    const run: { code: string; op?: string; raw?: string; isDefault: boolean; body: string[] }[] = [];
    let j = i;
    while (j < lines.length) {
      const m = SI.exec(lines[j]);
      if (!m || (run.length && m[1] !== run[0].code)) break;
      const end = lines.findIndex((l, k) => k > j && FIN.test(l));
      if (end < 0) break;
      run.push({ code: m[1], op: m[2], raw: m[3], isDefault: !!m[4], body: lines.slice(j + 1, end) });
      j = end + 1;
    }
    if (!run.length) {
      plain.push(lines[i]);
      i += 1;
      continue;
    }
    if (run.every((r) => r.op === "=")) {
      flush();
      parts.push({
        kind: "choice",
        code: run[0].code,
        raw: lines.slice(i, j).join("\n"),
        variants: run.map((r) => ({
          value: r.raw?.startsWith('"') ? r.raw.slice(1, -1) : (r.raw ?? ""),
          text: r.body.join("\n"),
          isDefault: r.isDefault,
        })),
      });
    } else {
      plain.push(...lines.slice(i, j));
    }
    i = j;
  }
  flush();
  return parts;
};

/**
 * Cómo lo lee el bot hoy: las variantes que van según los ajustes publicados y
 * los huecos llenos. Sin la sintaxis interna, que confunde.
 */
export const renderWithSettings = (text: string, settings: ChatbotPromptSetting[]): string => {
  const value = (code: string): string | undefined => settings.find((s) => s.code === code)?.published;
  const list = (v: string) => v.split(",").map((x) => x.trim()).filter(Boolean);
  const out: string[] = [];
  let include = true;
  for (const line of text.split("\n")) {
    const m = SI.exec(line);
    if (m) {
      const [, code, op, raw, def] = m;
      const v = value(code);
      const target = raw?.startsWith('"') ? raw.slice(1, -1) : (raw ?? "");
      include =
        v === undefined
          ? !!def
          : !op
            ? v.trim() !== ""
            : op === "="
              ? v === target
              : op === "!="
                ? v !== target
                : op === "~"
                  ? list(v).includes(target)
                  : !list(v).includes(target);
      continue;
    }
    if (FIN.test(line)) {
      include = true;
      continue;
    }
    if (include) out.push(line);
  }
  return out.join("\n").replace(SLOT, (_m, code: string, def: string | undefined) => {
    if (code === "store_locations") {
      const s = settings.find((x) => x.code === code);
      return s ? toStoreLocations(s.published).map((x) => `• ${x.ciudad} — ${x.nombre} — ${x.direccion} — ${x.horario}`).join("\n") : (def ?? "");
    }
    if (code === "sales_whatsapp_display") {
      const v = value("sales_whatsapp");
      return v ? v.replace(/^51(?=\d{9}$)/, "").replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3") : (def ?? "");
    }
    const s = settings.find((x) => x.code === code);
    return s ? describeValue(s, s.published) : (def ?? "");
  });
};
