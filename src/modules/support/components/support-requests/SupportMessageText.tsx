import { Fragment, type ReactNode } from "react";
import { cn } from "@/shared/utils/utils";
import {
  parseBlocks,
  type InlineRun,
  type MdBlock,
  type MdList,
  type MdListItem,
} from "../../utils/supportMarkdown";

const URL_RE = /(https?:\/\/[^\s<>"]+)/g;
const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"»]+$/;

const LINK_CLASS = "underline underline-offset-2 [overflow-wrap:anywhere] hover:opacity-80";

/**
 * URLs sueltas → enlaces, armados como elementos de React (nunca innerHTML).
 * El punto o el paréntesis que cierra la frase no son parte del enlace.
 */
export const LinkifiedText = ({ text }: { text: string }) => {
  const parts = text.split(URL_RE);

  return (
    <>
      {parts.map((part, index) => {
        if (index % 2 === 0) return <Fragment key={index}>{part}</Fragment>;
        const trailing = part.match(TRAILING_PUNCTUATION)?.[0] ?? "";
        const href = trailing ? part.slice(0, -trailing.length) : part;
        return (
          <Fragment key={index}>
            <a href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
              {href}
            </a>
            {trailing}
          </Fragment>
        );
      })}
    </>
  );
};

const renderRun = (run: InlineRun, key: number): ReactNode => {
  const isCode = run.marks.includes("code");
  // Dentro de un enlace o de un código las URLs no se vuelven a enlazar
  let node: ReactNode = isCode ? (
    <code className="rounded bg-foreground/10 px-1 py-0.5 font-mono text-[0.85em]">{run.text}</code>
  ) : run.href ? (
    run.text
  ) : (
    <LinkifiedText text={run.text} />
  );

  if (run.marks.includes("strike")) node = <s>{node}</s>;
  if (run.marks.includes("italic")) node = <em>{node}</em>;
  if (run.marks.includes("bold")) node = <strong className="font-semibold">{node}</strong>;
  if (run.href) {
    node = (
      <a href={run.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
        {node}
      </a>
    );
  }

  return <Fragment key={key}>{node}</Fragment>;
};

const renderRuns = (runs: InlineRun[]) => runs.map(renderRun);

/** Varias líneas en el mismo bloque: se respetan con "\n" (pre-wrap). */
const renderLines = (lines: InlineRun[][]) =>
  lines.map((runs, index) => (
    <Fragment key={index}>
      {index > 0 && "\n"}
      {renderRuns(runs)}
    </Fragment>
  ));

const ListItem = ({ item }: { item: MdListItem }) => (
  <li className="min-w-0">
    {renderLines(item.lines)}
    {item.children.map((child, index) => (
      <List key={index} list={child} />
    ))}
  </li>
);

const List = ({ list }: { list: MdList }) => {
  const className = "my-1 min-w-0 space-y-0.5 pl-5 whitespace-normal [&_li]:whitespace-pre-wrap";
  return list.ordered ? (
    <ol className={cn("list-decimal", className)} start={list.start}>
      {list.items.map((item, index) => (
        <ListItem key={index} item={item} />
      ))}
    </ol>
  ) : (
    <ul className={cn("list-disc", className)}>
      {list.items.map((item, index) => (
        <ListItem key={index} item={item} />
      ))}
    </ul>
  );
};

/** Junta las líneas sueltas seguidas en un solo bloque de texto. */
const groupBlocks = (blocks: MdBlock[]) => {
  const groups: ({ type: "lines"; lines: InlineRun[][] } | MdList)[] = [];
  for (const block of blocks) {
    if (block.type === "list") {
      groups.push(block);
      continue;
    }
    const last = groups[groups.length - 1];
    if (last && last.type === "lines") last.lines.push(block.runs);
    else groups.push({ type: "lines", lines: [block.runs] });
  }
  return groups;
};

/**
 * Pinta un mensaje del hilo con su formato. El contenido es texto plano con
 * Markdown simple (ver supportMarkdown): un mensaje de antes, sin formato, se
 * ve exactamente igual que siempre. Nada pasa por innerHTML.
 */
export const SupportMessageText = ({ text, className }: { text: string; className?: string }) => {
  const groups = groupBlocks(parseBlocks(text));

  return (
    <div className={cn("min-w-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere]", className)}>
      {groups.map((group, index) =>
        group.type === "lines" ? (
          <p key={index} className="min-w-0">
            {renderLines(group.lines)}
          </p>
        ) : (
          <List key={index} list={group} />
        ),
      )}
    </div>
  );
};
