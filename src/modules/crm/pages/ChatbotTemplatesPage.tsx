import { useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/modules/auth";
import { PageLoader } from "@/shared/components/page-loader";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import ChatbotTemplatesHeader from "../components/chatbot-templates/ChatbotTemplatesHeader";
import ChatbotTemplatesTable from "../components/chatbot-templates/ChatbotTemplatesTable";
import ChatbotTemplateFormDialog from "../components/chatbot-templates/ChatbotTemplateFormDialog";
import { useChatbotTemplates } from "../hooks/useChatbotTemplates";
import type { ChatbotTemplate } from "../types/chatbotTemplates.types";

/** Valor del Select para "todos": Radix no admite un SelectItem con value "". */
const ALL = "__all__";

/**
 * T-902. Los textos fijos del chatbot de WhatsApp. En las del sistema solo se
 * edita el texto: los nombres los usa el código del bot. T-917: etiquetas (una
 * principal de Jev y extras), filtro por etiqueta y plantillas nuevas creadas
 * desde acá. Solo admin (lo exigen también los SP).
 */
export default function ChatbotTemplatesPage() {
  const { isAdmin } = useAuth();
  const {
    loading,
    saving,
    rows,
    search,
    onSearchChange,
    tags,
    tagFilter,
    onTagFilterChange,
    withoutTopic,
    pagination,
    onPageChange,
    onPageSizeChange,
    save,
    create,
  } = useChatbotTemplates(isAdmin);
  const [editing, setEditing] = useState<ChatbotTemplate | null>(null);
  const [creating, setCreating] = useState(false);

  if (!isAdmin) {
    return (
      <div className="h-full min-h-0 flex flex-col gap-4">
        <ChatbotTemplatesHeader />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Solo un administrador puede editar las plantillas del chatbot.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) return <PageLoader message="Cargando plantillas..." />;

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <ChatbotTemplatesHeader onCreate={() => setCreating(true)} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar por nombre o texto..."
                className="pl-9"
              />
            </div>
            <Select value={tagFilter || ALL} onValueChange={(v) => onTagFilterChange(v === ALL ? "" : v)}>
              <SelectTrigger className="w-full sm:w-[260px]" aria-label="Filtrar por etiqueta">
                <SelectValue placeholder="Todas las etiquetas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas las etiquetas</SelectItem>
                <SelectGroup>
                  <SelectLabel>Principales</SelectLabel>
                  {tags
                    .filter((g) => g.is_jev)
                    .map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>
                        {g.name} ({g.templates_count})
                      </SelectItem>
                    ))}
                </SelectGroup>
                {tags.some((g) => !g.is_jev) && (
                  <SelectGroup>
                    <SelectLabel>Otras</SelectLabel>
                    {tags
                      .filter((g) => !g.is_jev)
                      .map((g) => (
                        <SelectItem key={g.id} value={String(g.id)}>
                          {g.name} ({g.templates_count})
                        </SelectItem>
                      ))}
                  </SelectGroup>
                )}
                {withoutTopic ? <SelectItem value="none">Sin etiqueta principal ({withoutTopic})</SelectItem> : null}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <ChatbotTemplatesTable rows={rows} searching={!!search.trim() || !!tagFilter} onEdit={setEditing} />
        </CardContent>
        <CardFooter className="!p-0">
          <PaginationBar pagination={pagination} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />
        </CardFooter>
      </Card>

      <ChatbotTemplateFormDialog
        template={editing}
        creating={creating}
        saving={saving}
        tagOptions={tags.map((g) => g.name)}
        onOpenChange={(open) => {
          if (open) return;
          setEditing(null);
          setCreating(false);
        }}
        onSave={save}
        onCreate={create}
      />
    </div>
  );
}
