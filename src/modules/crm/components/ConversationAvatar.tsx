import { cn } from "@/shared/utils/utils";
import type { ConversationChannel } from "../types/crm.types";
import { ChannelIcon } from "./ChannelIcon";

/** Iniciales del título; un número o un @usuario no tienen iniciales útiles. */
const initials = (name: string) => {
  if (/^[+@\d]/.test(name)) return "#";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
};

/**
 * Avatar de un chat: el logo de su red, porque el nombre del cliente ya va al
 * lado y lo que interesa distinguir de un vistazo es por dónde escribió. El
 * mismo en la lista y en el encabezado del chat abierto.
 *
 * Sin canal muestra iniciales: es el avatar de un asesor (p. ej. en AssignMenu).
 */
export const ConversationAvatar = ({
  name,
  channel,
  selected = false,
  size = "md",
}: {
  name: string;
  channel?: ConversationChannel;
  selected?: boolean;
  size?: "sm" | "md";
}) => {
  if (channel) {
    return (
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background text-foreground",
          // El seleccionado se marca con un anillo y no con relleno: así el
          // logo conserva su color.
          selected && "ring-2 ring-primary"
        )}
        aria-hidden="true"
      >
        <ChannelIcon channel={channel} className="h-[18px] w-[18px]" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        size === "sm" ? "h-4 w-4 text-[8px]" : "h-8 w-8 text-[11px]",
        selected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-foreground"
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
};
