import { useMemo, useState } from "react";
import { ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/modules/auth";
import { PageLoader } from "@/shared/components/page-loader";
import { cn } from "@/shared/utils/utils";
import { headingText, isIntroLine, matchesQuery, settingCodesIn } from "../adapters/chatbotConsiderations.adapter";
import { groupSections, hasFriendlyName, sectionName } from "../adapters/chatbotSections";
import AddPromptBlockDialog from "../components/chatbot-considerations/AddPromptBlockDialog";
import PromptBlockHistoryDialog from "../components/chatbot-considerations/PromptBlockHistoryDialog";
import PromptBlockItem from "../components/chatbot-considerations/PromptBlockItem";
import PromptSettingHistoryDialog from "../components/chatbot-behavior/PromptSettingHistoryDialog";
import { useChatbotConsiderations } from "../hooks/useChatbotConsiderations";
import type { ChatbotPromptSetting } from "../types/chatbotBehavior.types";
import type { PromptBlock } from "../types/chatbotConsiderations.types";

/** Valor del Select para "todas": Radix no admite un SelectItem con value "". */
const ALL = "__all__";

type Row =
  | { kind: "group"; name: string }
  | { kind: "section"; block: PromptBlock }
  | { kind: "heading"; block: PromptBlock }
  | { kind: "paragraph"; block: PromptBlock };

const groupId = (name: string) => `group-${name.replace(/\W+/g, "-")}`;

/**
 * Consideraciones del chatbot: el prompt completo partido en párrafos que se
 * editan como un bloc de notas, con las secciones agrupadas por tema y con
 * nombres claros (chatbotSections.ts; el bot las sigue leyendo en su orden).
 * Arriba, un buscador; a la izquierda, el índice por grupos. Lo técnico va con
 * candado y queda oculto salvo que se pida verlo (los que nombran un dato, como
 * las sedes, se ven igual: el dato se cambia ahí). Si lo buscado no está, se agrega ahí mismo. Todo lo guardado queda
 * vivo en menos de un minuto. Solo admin (lo exigen también los SP).
 */
export default function ChatbotConsiderationsPage() {
  const { isAdmin } = useAuth();
  const c = useChatbotConsiderations(isAdmin);
  const [query, setQuery] = useState("");
  const [showLocked, setShowLocked] = useState(false);
  const [onlyStore, setOnlyStore] = useState(false);
  const [tag, setTag] = useState(ALL);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<{ title: string; headingKey: string | null } | null>(null);
  const [history, setHistory] = useState<PromptBlock | null>(null);
  const [settingHistory, setSettingHistory] = useState<ChatbotPromptSetting | null>(null);

  const groups = useMemo(() => groupSections(c.blocks), [c.blocks]);
  /** Para "Agregar": cada sección con sus subtítulos, en el orden del índice. */
  const addGroups = useMemo(
    () =>
      groups.map((g) => ({
        group: g.group,
        headings: g.sections.flatMap((s) => [s.heading, ...s.items.filter((b) => b.kind === "heading" && (b.headingLevel ?? 0) >= 3)]),
      })),
    [groups]
  );
  /** En cuántos párrafos aparece cada ajuste: cambiarlo en uno los cambia a todos. */
  const settingUsage = useMemo(() => {
    const usage = new Map<string, number>();
    for (const b of c.blocks) for (const code of settingCodesIn(b.content)) usage.set(code, (usage.get(code) ?? 0) + 1);
    return usage;
  }, [c.blocks]);
  const allTags = useMemo(() => [...new Set(c.blocks.flatMap((b) => b.tags))].sort(), [c.blocks]);
  const filtering = !!query.trim() || onlyStore || tag !== ALL;
  /** Sin lo bloqueado, como con filtros: solo las secciones y subtítulos que tienen algo. */
  const compact = filtering || !showLocked;

  /** Los párrafos que pasan los filtros, por grupo y sección (con filtros, solo los que tienen algo). */
  const { rows, counts, groupCounts, total } = useMemo(() => {
    const hasData = (b: PromptBlock) => settingCodesIn(b.content).some((code) => c.settings.some((x) => x.code === code));
    const visible = (b: PromptBlock) =>
      b.kind === "paragraph" &&
      matchesQuery(b, query) &&
      (showLocked || !b.locked || isIntroLine(b) || hasData(b)) &&
      (!onlyStore || b.origin === "store") &&
      (tag === ALL || b.tags.includes(tag));
    const out: Row[] = [];
    const counts = new Map<string, number>();
    const groupCounts = new Map<string, number>();
    let total = 0;
    for (const g of groups) {
      const groupRows: Row[] = [];
      let inGroup = 0;
      for (const s of g.sections) {
        const sectionRows: Row[] = [];
        let pending: PromptBlock[] = [];
        // Sin lo bloqueado, la frase de entrada ("Reglas duras:") sale solo si debajo queda algo.
        let intro: PromptBlock | null = null;
        let n = 0;
        for (const b of s.items) {
          if (b.kind === "heading") {
            intro = null;
            if (!compact) sectionRows.push({ kind: "heading", block: b });
            else pending = [...pending.filter((h) => (h.headingLevel ?? 1) < (b.headingLevel ?? 1)), b];
            continue;
          }
          if (!visible(b)) continue;
          if (!showLocked && isIntroLine(b)) {
            intro = b;
            continue;
          }
          if (compact) {
            for (const h of pending) sectionRows.push({ kind: "heading", block: h });
            pending = [];
          }
          if (intro) {
            sectionRows.push({ kind: "paragraph", block: intro });
            intro = null;
          }
          sectionRows.push({ kind: "paragraph", block: b });
          n += 1;
        }
        counts.set(s.heading.headingKey, n);
        inGroup += n;
        if (!compact || n > 0) groupRows.push({ kind: "section", block: s.heading }, ...sectionRows);
      }
      groupCounts.set(g.group, inGroup);
      total += inGroup;
      if (groupRows.length) out.push({ kind: "group", name: g.group }, ...groupRows);
    }
    return { rows: out, counts, groupCounts, total };
  }, [groups, c.settings, query, showLocked, onlyStore, tag, compact]);

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Solo un administrador puede ver las consideraciones del chatbot.</CardContent>
      </Card>
    );
  }
  if (c.loading) return <PageLoader message="Cargando las consideraciones del chatbot..." />;

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const toggleGroup = (name: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Consideraciones del chatbot</h1>
          <p className="text-sm text-muted-foreground">
            Todo lo que sabe el bot, agrupado por tema. Haz clic en un párrafo para editarlo. Lo que usa el sistema está oculto (márcalo en «Mostrar lo bloqueado» para leerlo); si nombra un dato (sedes, números), se ve igual y lo cambias debajo. Al guardar, el bot lo usa en menos de un minuto.
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
            <Checkbox checked={showLocked} onCheckedChange={(v) => setShowLocked(v === true)} /> Mostrar lo bloqueado
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

      <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="hidden min-h-0 overflow-y-auto md:block">
          <CardContent className="!p-2">
            <p className="px-2 py-1 text-xs text-muted-foreground">Temas</p>
            {groups.map((g) => {
              const n = groupCounts.get(g.group) ?? 0;
              const open = openGroups.has(g.group) || (filtering && n > 0);
              const dim = compact && n === 0;
              return (
                <div key={g.group} className={cn(dim && "opacity-40")}>
                  <button
                    onClick={() => {
                      toggleGroup(g.group);
                      scrollTo(groupId(g.group));
                    }}
                    disabled={dim}
                    aria-expanded={open}
                    className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-sm font-medium hover:bg-muted"
                  >
                    <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-90")} />
                    <span className="flex-1 truncate">{g.group}</span>
                    {filtering && n > 0 && <span className="text-xs text-primary">{n}</span>}
                  </button>
                  {open &&
                    g.sections.map((s) => {
                      const k = counts.get(s.heading.headingKey) ?? 0;
                      return (
                        <button
                          key={s.heading.id}
                          onClick={() => scrollTo(`block-${s.heading.id}`)}
                          disabled={compact && k === 0}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded py-1 pl-7 pr-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                            compact && k === 0 && "opacity-40"
                          )}
                        >
                          <span className="truncate">{sectionName(s.heading)}</span>
                          {filtering && k > 0 && <span className="text-xs text-primary">{k}</span>}
                        </button>
                      );
                    })}
                </div>
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
            rows.map((r) => {
              if (r.kind === "group") {
                return (
                  <h2 key={`g-${r.name}`} id={groupId(r.name)} className="scroll-mt-2 pt-6 text-xs font-semibold uppercase tracking-wide text-primary first:pt-0">
                    {r.name}
                  </h2>
                );
              }
              if (r.kind === "section" || r.kind === "heading") {
                const section = r.kind === "section";
                return (
                  <div
                    key={`h-${r.block.id}`}
                    id={`block-${r.block.id}`}
                    className={cn("flex scroll-mt-2 items-center justify-between gap-2", section ? "border-b pb-1 pt-2" : "pt-2")}
                  >
                    <div className="min-w-0">
                      <h3 className={cn("font-semibold text-foreground", section ? "text-lg" : "text-base")}>{section ? sectionName(r.block) : headingText(r.block)}</h3>
                      {section && hasFriendlyName(r.block) && <p className="truncate text-xs text-muted-foreground">En el prompt: {headingText(r.block)}</p>}
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 shrink-0 px-2 text-xs" onClick={() => setAdding({ title: query.trim(), headingKey: r.block.headingKey })}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Agregar aquí
                    </Button>
                  </div>
                );
              }
              return (
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
                  settingUsage={settingUsage}
                  onSaveSetting={c.saveSetting}
                  onSettingHistory={setSettingHistory}
                />
              );
            })
          )}
        </div>
      </div>

      <AddPromptBlockDialog
        open={!!adding}
        groups={addGroups}
        initialTitle={adding?.title ?? ""}
        initialHeadingKey={adding?.headingKey ?? null}
        saving={c.saving}
        onClose={() => setAdding(null)}
        onCreate={c.createBlock}
      />
      <PromptBlockHistoryDialog block={history} saving={c.saving} onClose={() => setHistory(null)} onUse={(b, content) => c.saveBlock(b, content)} />
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
