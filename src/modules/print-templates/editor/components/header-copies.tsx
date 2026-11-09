import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";
import type { HeaderCopy } from "../lib/pagination";
import { cloneForCopy } from "../lib/clone-copy";
import { writePageNumbers } from "../lib/document-values";

/** Marca cada copia: la impresión también las dibuja (editor/print). */
export const HEADER_COPY_ATTR = "data-print-header-copy";

/**
 * Las copias del encabezado de una Tabla de datos arriba de cada página en la
 * que sigue (lib/pagination). Son solo para ver: un clon del encabezado, que
 * no se selecciona ni está en la Estructura, y se rehace cuando el original
 * cambia.
 */
export function HeaderCopies({
  copies,
  pageCount,
}: {
  copies: HeaderCopy[];
  /** Para los números de página de las copias: «de N». */
  pageCount: number;
}) {
  return (
    <>
      {copies.map((copy) => (
        <HeaderClone
          key={`${copy.headerId}-${copy.top}-${copy.suffix ?? ""}-${copy.text ?? ""}-${copy.hiddenColumns?.join(".") ?? ""}`}
          copy={copy}
          pageCount={pageCount}
        />
      ))}
    </>
  );
}

function HeaderClone({
  copy,
  pageCount,
}: {
  copy: HeaderCopy;
  pageCount: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { headerDom } = useEditor((state) => ({
    headerDom: state.nodes[copy.headerId]?.dom ?? null,
  }));

  useEffect(() => {
    const target = ref.current;
    const paper = target?.parentElement;
    if (!target || !paper || !headerDom) return;
    const render = () => {
      // Donde está el original en horizontal, a la altura de la página.
      const paperBox = paper.getBoundingClientRect();
      const box = headerDom.getBoundingClientRect();
      const zoom = paper.offsetWidth ? paperBox.width / paper.offsetWidth : 1;
      target.style.left = `${(box.left - paperBox.left) / zoom}px`;
      target.style.width = `${box.width / zoom}px`;
      // El título de una tabla que sigue: el nombre de su grupo, si lo
      // tiene, y « (continuación)» al final.
      const clone = cloneForCopy(headerDom, {
        text: copy.text,
        suffix: copy.suffix,
        hiddenColumns: copy.hiddenColumns,
      });
      clone.style.margin = "0";
      // Su número de página: el de la página de la copia.
      writePageNumbers(clone, () => copy.page, pageCount);
      target.replaceChildren(clone);
    };
    render();
    // Una vez por cuadro aunque el original cambie muchas veces seguidas.
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(render);
    };
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(headerDom);
    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(headerDom, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["style"],
    });
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [
    headerDom,
    copy.page,
    copy.suffix,
    copy.text,
    copy.hiddenColumns,
    pageCount,
  ]);

  return (
    <div
      ref={ref}
      aria-hidden
      {...{ [HEADER_COPY_ATTR]: "" }}
      className="pointer-events-none absolute"
      style={{ top: copy.top, zIndex: 1 }}
    />
  );
}
