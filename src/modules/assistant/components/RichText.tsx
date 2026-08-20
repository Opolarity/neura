import { Fragment, type ReactNode } from "react";

/**
 * Renderiza el Markdown que devuelve el asistente.
 *
 * POR QUE NO SE USA UNA LIBRERIA: lo que el modelo emite es un subconjunto
 * pequeño y previsible (negritas, codigo, listas, bloques de SQL). Traer
 * react-markdown y su arbol de dependencias para eso no compensa.
 *
 * POR QUE NO HAY dangerouslySetInnerHTML: esto construye ELEMENTOS de React,
 * no cadenas de HTML. El texto llega de un modelo, y parte de ese texto puede
 * venir de datos del ERP. Sin HTML crudo de por medio, no hay nada que sanear
 * ni superficie de inyeccion que cerrar.
 */

/**
 * Limpia los marcadores de Markdown en linea.
 *
 * Decision del cliente: NADA de negritas. El modelo insiste en emitir
 * `**texto**` y aqui se descarta el marcador y se deja el texto plano, en vez
 * de pintarlo en negrita o dejar los asteriscos a la vista. La jerarquia la da
 * la estructura -- frase corta y luego lista -- no el peso de la fuente.
 */
function inline(texto: string, clave: string): ReactNode[] {
  const salida: ReactNode[] = [];
  // Se parte por los dos marcadores a la vez para respetar el orden original.
  const partes = texto.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  partes.forEach((parte, i) => {
    if (!parte) return;
    const k = `${clave}-${i}`;

    if (parte.startsWith("**") && parte.endsWith("**") && parte.length > 4) {
      // Se quita el marcador y se deja el texto tal cual.
      salida.push(<Fragment key={k}>{parte.slice(2, -2)}</Fragment>);
      return;
    }
    if (parte.startsWith("`") && parte.endsWith("`") && parte.length > 2) {
      salida.push(
        <code key={k} className="rounded bg-background/60 px-1 py-0.5 text-[0.85em]">
          {parte.slice(1, -1)}
        </code>,
      );
      return;
    }
    salida.push(<Fragment key={k}>{parte}</Fragment>);
  });

  return salida;
}

export function RichText({ text }: { text: string }) {
  const bloques: ReactNode[] = [];
  const lineas = text.split("\n");

  let i = 0;
  let n = 0;

  while (i < lineas.length) {
    const linea = lineas[i];

    // Bloque de codigo cercado. El modelo devuelve aqui el SQL que uso, que es
    // justo lo que conviene poder leer sin que se mezcle con la prosa.
    if (linea.trimStart().startsWith("```")) {
      const cuerpo: string[] = [];
      i++;
      while (i < lineas.length && !lineas[i].trimStart().startsWith("```")) {
        cuerpo.push(lineas[i]);
        i++;
      }
      i++; // cierre
      bloques.push(
        <pre
          key={`c${n++}`}
          className="overflow-x-auto rounded-md bg-background/60 p-3 text-xs leading-relaxed"
        >
          <code>{cuerpo.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // Lista: se acumulan los items seguidos en un solo <ul>/<ol>.
    const esViñeta = /^\s*[-*]\s+/.test(linea);
    const esNumero = /^\s*\d+[.)]\s+/.test(linea);
    if (esViñeta || esNumero) {
      const items: string[] = [];
      const numerada = esNumero;
      while (
        i < lineas.length &&
        (numerada ? /^\s*\d+[.)]\s+/ : /^\s*[-*]\s+/).test(lineas[i])
      ) {
        items.push(lineas[i].replace(/^\s*(?:[-*]|\d+[.)])\s+/, ""));
        i++;
      }
      const Lista = numerada ? "ol" : "ul";
      bloques.push(
        <Lista
          key={`l${n++}`}
          className={
            numerada
              ? "list-decimal space-y-1 pl-5"
              : "list-disc space-y-1 pl-5"
          }
        >
          {items.map((item, j) => (
            <li key={j}>{inline(item, `l${n}-${j}`)}</li>
          ))}
        </Lista>,
      );
      continue;
    }

    // Parrafo: se juntan las lineas seguidas hasta un salto en blanco.
    if (linea.trim()) {
      const parrafo: string[] = [];
      while (
        i < lineas.length &&
        lineas[i].trim() &&
        !lineas[i].trimStart().startsWith("```") &&
        !/^\s*(?:[-*]|\d+[.)])\s+/.test(lineas[i])
      ) {
        parrafo.push(lineas[i]);
        i++;
      }
      bloques.push(
        <p key={`p${n++}`} className="whitespace-pre-wrap break-words">
          {inline(parrafo.join("\n"), `p${n}`)}
        </p>,
      );
      continue;
    }

    i++;
  }

  return <div className="flex flex-col gap-2">{bloques}</div>;
}
