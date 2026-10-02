import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatbotTemplatesHeaderProps {
  /** Sin él (usuario sin permiso) no se muestra el botón. */
  onCreate?: () => void;
}

export default function ChatbotTemplatesHeader({ onCreate }: ChatbotTemplatesHeaderProps) {
  return (
    <div className="flex justify-between items-start gap-4">
      <h1 className="text-2xl font-bold text-foreground">Plantillas del chatbot</h1>
      {onCreate && (
        <Button onClick={onCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva plantilla
        </Button>
      )}
    </div>
  );
}
