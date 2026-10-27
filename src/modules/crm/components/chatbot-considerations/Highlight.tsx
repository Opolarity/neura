import { normalize } from "../../adapters/chatbotConsiderations.adapter";

/**
 * El texto con lo buscado resaltado, sin importar mayúsculas ni tildes
 * ("garantia" resalta "Garantía").
 */
export default function Highlight({ text, query }: { text: string; query: string }) {
  const q = normalize(query.trim());
  if (!q) return <>{text}</>;
  // Cada letra del texto normalizado apunta a su posición en el original.
  const map: number[] = [];
  let norm = "";
  for (let i = 0; i < text.length; i++) {
    const n = normalize(text[i]!);
    for (let j = 0; j < n.length; j++) map.push(i);
    norm += n;
  }
  const parts: Array<{ text: string; hit: boolean }> = [];
  let from = 0;
  let idx = norm.indexOf(q);
  while (idx >= 0) {
    const start = map[idx]!;
    const end = (map[idx + q.length - 1] ?? text.length - 1) + 1;
    if (start > from) parts.push({ text: text.slice(from, start), hit: false });
    parts.push({ text: text.slice(start, end), hit: true });
    from = end;
    idx = norm.indexOf(q, idx + q.length);
  }
  if (from < text.length) parts.push({ text: text.slice(from), hit: false });
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <mark key={i} className="rounded-sm bg-warning-soft text-inherit px-0.5">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );
}
