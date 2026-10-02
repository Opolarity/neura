import { useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/modules/auth";
import { PageLoader } from "@/shared/components/page-loader";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import ChatbotTemplatesHeader from "../components/chatbot-templates/ChatbotTemplatesHeader";
import ChatbotTemplatesTable from "../components/chatbot-templates/ChatbotTemplatesTable";
import ChatbotTemplateFormDialog from "../components/chatbot-templates/ChatbotTemplateFormDialog";
import { useChatbotTemplates } from "../hooks/useChatbotTemplates";
import type { ChatbotTemplate } from "../types/chatbotTemplates.types";

/**
 * T-902. Los textos fijos del chatbot de WhatsApp. Solo se edita el texto: los
 * nombres los usa el código del bot. Solo admin (lo exigen también los SP).
 */
export default function ChatbotTemplatesPage() {
  const { isAdmin } = useAuth();
  const {
    loading,
    saving,
    rows,
    search,
    onSearchChange,
    pagination,
    onPageChange,
    onPageSizeChange,
    save,
  } = useChatbotTemplates(isAdmin);
  const [editing, setEditing] = useState<ChatbotTemplate | null>(null);

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
      <ChatbotTemplatesHeader />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por nombre o texto..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <ChatbotTemplatesTable rows={rows} searching={!!search.trim()} onEdit={setEditing} />
        </CardContent>
        <CardFooter className="!p-0">
          <PaginationBar pagination={pagination} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />
        </CardFooter>
      </Card>

      <ChatbotTemplateFormDialog
        template={editing}
        saving={saving}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={save}
      />
    </div>
  );
}
