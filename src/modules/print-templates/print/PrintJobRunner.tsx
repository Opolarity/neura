import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import type jsPDF from "jspdf";
import { toast } from "@/shared/hooks/use-toast";
import { findSystemPrintTemplate } from "../constants/systemPrintTemplates";
import { printTemplateDefaultContentApi } from "../services/printTemplates.service";
import { SYSTEM_DESIGNS } from "../editor/designs";
import { sourcesOf } from "../editor/lib/data-table";
import { pageProps } from "../editor/lib/page-props";
import { paperOf, type Paper } from "../editor/lib/paper-context";
import { PdfRenderJob } from "../editor/print/pdf-render-job";
import { PdfPreviewDialog } from "../editor/print/pdf-preview-dialog";
import { printQueue, type PrintRequest } from "./printDocument";
import "../editor/print-template-editor.css";

/**
 * «Imprimir directo»: el PDF en un iframe oculto y su diálogo de impresión,
 * como el POS de hoy (useInvoicePrint). El iframe se quita a los 5 minutos:
 * antes, el diálogo podría seguir abierto.
 */
function printDirect(pdfUrl: string) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:0;opacity:0;pointer-events:none";
  document.body.appendChild(iframe);
  iframe.src = pdfUrl;
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    window.setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
      iframe.remove();
    }, 300000);
  };
}

/** Con qué se arma: la plantilla guardada o el diseño del sistema. */
interface Job {
  content?: string;
  design?: ReactElement;
  paper: Paper;
}

/**
 * Imprime un pedido de printDocument: busca la plantilla de por defecto del
 * tenant (si no tiene, el diseño de la plantilla del sistema), la arma con
 * los datos del documento (PdfRenderJob) y muestra el PDF.
 */
export default function PrintJobRunner({ request }: { request: PrintRequest }) {
  const system = findSystemPrintTemplate(request.code);
  const dataSources = useMemo(
    () => (system ? sourcesOf(system.dataSources, system.dataColumns) : []),
    [system],
  );
  const [job, setJob] = useState<Job | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  // Con una lista de registros: cuántos van armados.
  const [progress, setProgress] = useState<string | null>(null);
  // El pedido se responde una sola vez.
  const settled = useRef(false);
  const settle = (pdf: Blob | null) => {
    if (settled.current) return;
    settled.current = true;
    request.done(pdf);
  };

  const fail = (error: unknown) => {
    toast({
      title: "No se pudo generar el PDF",
      description: error instanceof Error ? error.message : undefined,
      variant: "destructive",
    });
    settle(null);
    printQueue.finish(request.id);
  };
  const failRef = useRef(fail);
  failRef.current = fail;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!system)
          throw new Error("Este documento no tiene plantilla de impresión.");
        if (Array.isArray(request.data) && !request.data.length)
          throw new Error("No hay nada que imprimir.");
        const saved = await printTemplateDefaultContentApi(system.code);
        if (cancelled) return;
        if (saved) {
          // Las medidas y la imposición, las que guarda su Hoja.
          const root = (saved.ROOT as { props?: Record<string, unknown> })
            ?.props;
          setJob({
            content: JSON.stringify(saved),
            paper: paperOf(system, root),
          });
          return;
        }
        const design = SYSTEM_DESIGNS[system.code];
        if (!design)
          throw new Error(
            "Este documento todavía no tiene un diseño para imprimir.",
          );
        const page = pageProps(system);
        setJob({ design: design(page), paper: paperOf(system, page) });
      } catch (error) {
        if (!cancelled) failRef.current(error);
      }
    })();
    return () => {
      cancelled = true;
    };
    // El pedido es el mismo mientras vive (key = su id).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [system]);

  // El PDF vive mientras se ve: al cerrarlo se suelta.
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  const finish = (doc: jsPDF) => {
    doc.setProperties({ title: request.fileName });
    const pdf = doc.output("blob");
    settle(pdf);
    if (request.mode === "blob") {
      printQueue.finish(request.id);
      return;
    }
    const pdfUrl = URL.createObjectURL(pdf);
    if (request.mode === "direct") {
      printDirect(pdfUrl);
      printQueue.finish(request.id);
      return;
    }
    setUrl(pdfUrl);
  };

  return (
    <>
      {job && !url && (
        <PdfRenderJob
          content={job.content}
          design={job.design}
          data={request.data}
          paper={job.paper}
          dataSources={dataSources}
          onDone={finish}
          onError={fail}
          onProgress={(done, total) =>
            setProgress(total > 1 ? `${done} de ${total}` : null)
          }
        />
      )}
      {/* Al cerrarlo mientras se genera, se deja de generar. */}
      {request.mode === "preview" && (
        <PdfPreviewDialog
          title={system?.section ?? "Imprimir"}
          url={url}
          open
          fileName={request.fileName}
          progress={progress}
          onClose={() => {
            settle(null);
            printQueue.finish(request.id);
          }}
        />
      )}
    </>
  );
}
