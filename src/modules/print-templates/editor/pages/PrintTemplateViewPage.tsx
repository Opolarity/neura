import { useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Editor } from "@craftjs/core";
import { Button } from "@/components/ui/button";
import { PRINT_TEMPLATES_PATH } from "../../constants/printTemplateRoutes";
import { findSystemPrintTemplate } from "../../constants/systemPrintTemplates";
import { printTemplateResolver } from "../lib/resolver";
import { SYSTEM_DESIGNS } from "../designs";
import { EditorWorkspace } from "./PrintTemplateEditorPage";
import "../print-template-editor.css";

/**
 * Una plantilla del sistema, solo para verla: su diseño de hoy armado con los
 * componentes del editor (editor/designs), en la misma pantalla del editor
 * siempre en «Vista previa» (EditorWorkspace con viewOnly): sin paneles,
 * edición, guardado ni historial, con Impresión y Probar PDF. Es otra ruta
 * (/view) para que no se tome por el editor.
 */
export default function PrintTemplateViewPage() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const system = findSystemPrintTemplate(code);
  const design = SYSTEM_DESIGNS[code];
  // Sin guardar: la referencia de cambios no se usa.
  const savedRef = useRef<string | null>(null);

  if (!system || !design) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <p className="text-sm text-muted-foreground">
          Esta plantilla del sistema todavía no tiene un diseño para ver.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate(PRINT_TEMPLATES_PATH)}
        >
          Volver a las plantillas
        </Button>
      </div>
    );
  }

  return (
    <Editor resolver={printTemplateResolver}>
      <EditorWorkspace
        template={null}
        system={system}
        savedRef={savedRef}
        dirty={false}
        setDirty={() => undefined}
        viewOnly
      />
    </Editor>
  );
}
