import { MessageSquare } from "lucide-react";

/** "1 respuesta…" / "N respuestas…": el mismo texto va al title y al aria-label. */
const formatTeamRepliesLabel = (count: number): string =>
  count === 1
    ? "1 respuesta de OPOLARITY sin contestar"
    : `${count} respuestas de OPOLARITY sin contestar`;

interface SupportTeamRepliesIndicatorProps {
  /** `team_replies_new`: mensajes del equipo posteriores al último del cliente. */
  count: number;
}

/**
 * Avisa que el equipo de OPOLARITY escribió y el cliente todavía no contestó.
 * En 0 no se pinta nada. El icono hereda el color del texto (neura-styles) y
 * el contador usa el primario de marca.
 */
export const SupportTeamRepliesIndicator = ({ count }: SupportTeamRepliesIndicatorProps) => {
  if (!Number.isFinite(count) || count <= 0) return null;

  const label = formatTeamRepliesLabel(count);

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="inline-flex shrink-0 items-center gap-1"
    >
      <MessageSquare className="w-4 h-4" aria-hidden="true" />
      <span
        aria-hidden="true"
        className="min-w-[1rem] rounded-full bg-primary px-1 text-center text-[11px] font-semibold leading-4 text-primary-foreground tabular-nums"
      >
        {count > 99 ? "99+" : count}
      </span>
    </span>
  );
};
