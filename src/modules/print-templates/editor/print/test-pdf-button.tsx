import { useEffect, useState } from "react";
import { useEditor } from "@craftjs/core";
import { FileDown, Loader2 } from "lucide-react";
import type jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { toast } from "@/shared/hooks/use-toast";
import { usePaper } from "../lib/paper-context";
import { useDataSources } from "../lib/data-table";
import { EditorTooltip } from "../components/editor-tooltip";
import { PdfRenderJob } from "./pdf-render-job";
import { PdfPreviewDialog } from "./pdf-preview-dialog";

/**
 * «Probar PDF»: dibuja la hoja tal como está (con los datos de ejemplo) en el
 * PDF de impresión y lo muestra aquí mismo (PdfPreviewDialog), para
 * compararlo con el PDF de hoy. No guarda nada.
 */
export function TestPdfButton() {
  const { query } = useEditor();
  const paper = usePaper();
  const dataSources = useDataSources();
  const [content, setContent] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  // El PDF vive mientras se ve: al cerrarlo se suelta.
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  const finish = (doc: jsPDF) => {
    setContent(null);
    setUrl(URL.createObjectURL(doc.output("blob")));
  };

  const fail = (error: unknown) => {
    setContent(null);
    toast({
      title: "No se pudo generar el PDF",
      description: error instanceof Error ? error.message : undefined,
      variant: "destructive",
    });
  };

  if (!paper) return null;
  return (
    <>
      <EditorTooltip label="Ver cómo sale impresa, con los datos de ejemplo">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setContent(query.serialize())}
          disabled={Boolean(content)}
        >
          {content ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          Probar PDF
        </Button>
      </EditorTooltip>

      {content && (
        <PdfRenderJob
          content={content}
          paper={paper}
          dataSources={dataSources}
          onDone={finish}
          onError={fail}
        />
      )}

      {/* Al cerrarlo mientras se genera, se deja de generar. */}
      <PdfPreviewDialog
        title="PDF de prueba"
        url={url}
        open={Boolean(content || url)}
        fileName="plantilla-prueba"
        onClose={() => {
          setContent(null);
          setUrl(null);
        }}
      />
    </>
  );
}
