import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/modules/auth";
import { PageLoader } from "@/shared/components/page-loader";
import { cn } from "@/shared/utils/utils";
import { headingText, matchesQuery } from "../adapters/chatbotConsiderations.adapter";
import AddPromptBlockDialog from "../components/chatbot-considerations/AddPromptBlockDialog";
import PromptBlockHistoryDialog from "../components/chatbot-considerations/PromptBlockHistoryDialog";
import PromptBlockItem from "../components/chatbot-considerations/PromptBlockItem";
import PromptSettingsDialog from "../components/chatbot-considerations/PromptSettingsDialog";
import PromptSettingHistoryDialog from "../components/chatbot-behavior/PromptSettingHistoryDialog";
import { useChatbotConsiderations } from "../hooks/useChatbotConsiderations";
import type { ChatbotPromptSetting } from "../types/chatbotBehavior.types";
import type { PromptBlock } from "../types/chatbotConsiderations.types";

/** Valor del Select para "todas": Radix no admite un SelectItem con value "". */
const ALL = "__all__";

type Row = { kind: "heading"; block: PromptBlock } | { kind: "paragraph"; block: PromptBlock };

/**
 * Consideraciones del chatbot: el prompt completo, en el orden en que lo lee
 * el bot, partido en párrafos que se editan como un bloc de notas. Arriba, un
 * buscador; a la izquierda, el índice. Lo técnico va con candado. Si lo buscado
 * no está, se agrega ahí mismo. Todo lo guardado queda vivo en menos de un
 * minuto. Solo admin (lo exigen también los SP).
 */
export default function ChatbotConsiderationsPage() {
  const { isAdmin } = useAuth();
  const c = useChatbotConsiderations(isAdmin);
  const [query, setQuery] = useState("");
  const [onlyEditable, setOnlyEditable] = useState(false);
  const [onlyStore, setOnlyStore] = useState(false);
  const [tag, setTag] = useState(ALL);
  const [adding, setAdding] = useState<{ title: string; headingKey: string | null } | null>(null);
  const [history, setHistory] = useState<PromptBlock | null>(null);
  const [settingCodes, setSettingCodes] = useState<string[]>([]);
  const [settingHistory, setSettingHistory] = useState<ChatbotPromptSetting | null>(null);

  const headings = useMemo(() => c.blocks.filter((b) => b.kind === "heading" && (b.headingLevel ?? 0) >= 2), [c.blocks]);
  const allTags = useMemo(() => [...new Set(c.blocks.flatMap((b) => b.tags))].sort(), [c.blocks]);
  const filtering = !!query.trim() || onlyEditable || onlyStore || tag !== ALL;

  /** Los párrafos que pasan los filtros, con sus títulos de sección (solo los que tienen algo). */
  const { rows, counts, total } = useMemo(() => {
    const visible = (b: PromptBlock) =>
      b.kind === "paragraph" &&
      matchesQuery(b, query) &&
      (!onlyEditable || !b.locked) &&
      (!onlyStore || b.origin === "store") &&
      (tag === ALL || b.tags.includes(tag));
    const out: Row[] = [];
    const counts = new Map<string, number>();
    let pending: PromptBlock[] = [];
    let section: string | null = null;
    let total = 0;
    for (const b of c.blocks) {
      if (b.kind === "heading") {
        if (!filtering) out.push({ kind: "heading", block: b });
        else pending = [...pending.filter((h) => (h.headingLevel ?? 1) < (b.headingLevel ?? 1)), b];
        if ((b.headingLevel ?? 0) <= 2) section = b.headingKey;
        continue;
      }
      if (!visible(b)) continue;
      if (filtering) {
        for (const h of pending) out.push({ kind: "heading", block: h });
        pending = [];
      }
      out.push({ kind: "paragraph", block: b });
      total += 1;
      if (section) counts.set(section, (counts.get(section) ?? 0) + 1);
    }
    return { rows: out, counts, total };
  }, [c.blocks, query, onlyEditable, onlyStore, tag, filtering]);

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Solo un administrador puede ver las consideraciones del chatbot.</CardContent>
      </Card>
    );
  }
  if (c.loading) return <PageLoader message="Cargando las consideraciones del chatbot..." />;

  const goTo = (h: PromptBlock) => document.getElementById(`block-${h.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const settingsOpen = c.settings.filter((s) => settingCodes.includes(s.code));

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Consideraciones del chatbot</h1>
          <p className="text-sm text-muted-foreground">
            Todo lo que sabe el bot, en el orden en que lo lee. Haz clic en un párrafo para editarlo; lo que tiene candado lo usa el sistema. Al guardar, el bot lo usa en menos de un minuto.
          </p>
        </div>
        <Button onClick={() => setAdding({ title: query.trim(), headingKey: null })}>
          <Plus className="mr-2 h-4 w-4" /> Agregar
        </Button>
      </div>

      <Card>
        <CardContent className="!p-3 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar: recojo, garantía, Gamarra, boleta…" className="pl-9" aria-label="Buscar en lo que sabe el bot" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={onlyEditable} onCheckedChange={(v) => setOnlyEditable(v === true)} /> Solo lo editable
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={onlyStore} onCheckedChange={(v) => setOnlyStore(v === true)} /> Solo lo de la tienda
          </label>
          {allTags.length > 0 && (
            <Select value={tag} onValueChange={setTag}>
              <SelectTrigger className="w-44" aria-label="Etiqueta">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas las etiquetas</SelectItem>
                {allTags.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {filtering && <span className="text-xs text-muted-foreground">{total === 1 ? "1 resultado" : `${total} resultados`}</span>}
        </CardContent>
      </Card>

      <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        <Card className="hidden min-h-0 overflow-y-auto md:block">
          <CardContent className="!p-2">
            <p className="px-2 py-1 text-xs text-muted-foreground">Secciones</p>
            {headings
              .filter((h) => h.headingLevel === 2)
              .map((h) => {
                const n = counts.get(h.headingKey) ?? 0;
                return (
                  <button
                    key={h.id}
                    onClick={() => goTo(h)}
                    disabled={filtering && n === 0}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                      filtering && n === 0 && "opacity-40"
                    )}
                  >
                    <span className="truncate">{headingText(h)}</span>
                    {filtering && n > 0 && <span className="text-xs text-primary">{n}</span>}
                  </button>
                );
              })}
          </CardContent>
        </Card>

        <div className="min-h-0 space-y-2 overflow-y-auto pb-8 pr-1">
          {filtering && total === 0 ? (
            <Card>
              <CardContent className="space-y-3 p-6 text-center">
                <p className="text-sm text-muted-foreground">{query.trim() ? `No hay nada sobre «${query.trim()}».` : "Nada coincide con los filtros."}</p>
                <Button onClick={() => setAdding({ title: query.trim(), headingKey: null })}>
                  <Plus className="mr-2 h-4 w-4" /> Agregar{query.trim() ? ` «${query.trim()}»` : ""}
                </Button>
              </CardContent>
            </Card>
          ) : (
            rows.map((r) =>
              r.kind === "heading" ? (
                <div
                  key={`h-${r.block.id}`}
                  id={`block-${r.block.id}`}
                  className={cn("flex scroll-mt-2 items-center justify-between gap-2 pt-4", (r.block.headingLevel ?? 1) <= 2 ? "border-b pb-1" : "pt-2")}
                >
                  <h2 className={cn("font-semibold text-foreground", (r.block.headingLevel ?? 1) <= 2 ? "text-lg" : "text-base")}>{headingText(r.block)}</h2>
                  {(r.block.headingLevel ?? 0) >= 2 && (
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setAdding({ title: query.trim(), headingKey: r.block.headingKey })}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Agregar aquí
                    </Button>
                  )}
                </div>
              ) : (
                <PromptBlockItem
                  key={`p-${r.block.id}-${r.block.updatedAt}`}
                  block={r.block}
                  settings={c.settings}
                  query={query}
                  saving={c.saving}
                  onSave={(content, meta) => c.saveBlock(r.block, content, meta)}
                  onToggle={(active) => c.setActive(r.block, active)}
                  onRestore={() => c.restore(r.block)}
                  onDelete={() => c.remove(r.block)}
                  onHistory={() => setHistory(r.block)}
                  onSettings={setSettingCodes}
                />
              )
            )
          )}
        </div>
      </div>

      <AddPromptBlockDialog
        open={!!adding}
        headings={headings}
        initialTitle={adding?.title ?? ""}
        initialHeadingKey={adding?.headingKey ?? null}
        saving={c.saving}
        onClose={() => setAdding(null)}
        onCreate={c.createBlock}
      />
      <PromptBlockHistoryDialog block={history} saving={c.saving} onClose={() => setHistory(null)} onUse={(b, content) => c.saveBlock(b, content)} />
      <PromptSettingsDialog settings={settingsOpen} saving={c.saving} onClose={() => setSettingCodes([])} onSave={c.saveSetting} onHistory={setSettingHistory} />
      <PromptSettingHistoryDialog
        setting={settingHistory}
        onClose={() => setSettingHistory(null)}
        onUse={(code, value) => {
          const s = c.settings.find((x) => x.code === code);
          if (s) c.saveSetting(s, value);
        }}
      />
    </div>
  );
}
