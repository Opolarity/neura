import { useId } from "react";

// Íconos del patrón, centrados en (0,0) y de trazo fino, como los doodles del
// fondo de WhatsApp. El chip es el ícono de neura.pe; el resto, los temas de
// la web: ropa, ventas, inventario, envíos, ecommerce e IA.
const ICONS: Record<string, JSX.Element> = {
  chip: (
    <>
      <rect x="-7" y="-9" width="14" height="18" rx="3" />
      <path d="M-7 -4h-6l-4 -4M-7 0h-9M-7 4h-6M7 -4h6l4 -4M7 0h9M7 4h6l4 4M-3 -9v-5l-3 -3M3 -9v-5M-3 9v5M3 9v5l3 3" />
      <circle cx="-19" cy="-10" r="1.8" />
      <circle cx="-18" cy="0" r="1.8" />
      <circle cx="-15" cy="4" r="1.8" />
      <circle cx="19" cy="-10" r="1.8" />
      <circle cx="18" cy="0" r="1.8" />
      <circle cx="21" cy="10" r="1.8" />
      <circle cx="-8" cy="-19" r="1.8" />
      <circle cx="3" cy="-16" r="1.8" />
      <circle cx="-3" cy="16" r="1.8" />
      <circle cx="8" cy="19" r="1.8" />
    </>
  ),
  shirt: <path d="M-5 -10l-9 4 3 7 4 -2v13h14v-13l4 2 3 -7 -9 -4c-1 3 -9 3 -10 0z" />,
  hanger: <path d="M-2 -9a3 3 0 1 1 3 3v2l13 8h-28l12 -8" />,
  bag: (
    <>
      <path d="M-9 -4h18l-1 15h-16z" />
      <path d="M-4 -4v-3a4 4 0 0 1 8 0v3" />
    </>
  ),
  tag: (
    <>
      <path d="M-10 -10h9l11 11-9 9-11-11z" />
      <circle cx="-5" cy="-5" r="1.6" />
    </>
  ),
  truck: (
    <>
      <path d="M-13 -6h15v12h-15zM2 -2h6l4 4v4h-10" />
      <circle cx="-8" cy="7" r="2.4" />
      <circle cx="7" cy="7" r="2.4" />
    </>
  ),
  bubble: (
    <>
      <path d="M-11 -8h22v13h-13l-6 5v-5h-3z" />
      <path d="M-6 -2h8M-6 1h12" />
    </>
  ),
  box: (
    <>
      <path d="M0 -11l10 5v11l-10 5-10-5v-11z" />
      <path d="M-10 -6l10 5 10-5M0 -1v11" />
    </>
  ),
  chart: <path d="M-10 9h20M-7 9v-6M-2 9v-10M3 9v-4M8 9v-13" />,
  spark: <path d="M0 -10c1 6 4 9 10 10-6 1-9 4-10 10-1-6-4-9-10-10 6-1 9-4 10-10z" />,
  cart: (
    <>
      <path d="M-12 -8h4l3 12h13l3-9h-17" />
      <circle cx="-3" cy="8" r="1.8" />
      <circle cx="6" cy="8" r="1.8" />
    </>
  ),
  barcode: <path d="M-10 -7v14M-7 -7v14M-3 -7v14M0 -7v14M4 -7v14M8 -7v14M10 -7v14" />,
};

// Dónde va cada ícono dentro del mosaico de 300×300. Los giros leves son los
// que le dan el aire "dibujado a mano"; el mosaico se repite sin costuras.
const LAYOUT: Array<[keyof typeof ICONS, string]> = [
  ["chip", "translate(42 44) scale(1.3)"],
  ["shirt", "translate(130 30) rotate(-12)"],
  ["bubble", "translate(218 52) rotate(8)"],
  ["tag", "translate(272 118) rotate(18)"],
  ["hanger", "translate(96 108) rotate(6)"],
  ["spark", "translate(182 118) scale(.9)"],
  ["box", "translate(30 150) rotate(-8)"],
  ["chip", "translate(150 196) rotate(90) scale(1.05)"],
  ["bag", "translate(250 196) rotate(-10)"],
  ["truck", "translate(64 232) rotate(4)"],
  ["chart", "translate(212 262) rotate(-6)"],
  ["cart", "translate(120 274) rotate(8)"],
  ["barcode", "translate(278 280) rotate(-14)"],
  ["spark", "translate(22 284) scale(.6)"],
];

/**
 * Fondo del hilo, al estilo de WhatsApp: un patrón de dibujos lineales con el
 * ícono de Neura y temas de la marca. Va detrás del área que scrollea, así que
 * queda fijo mientras pasan los mensajes.
 *
 * El color sale de `text-primary` (currentColor) a opacidad baja: es el morado
 * de marca apenas visible sobre el plomo, y cambia solo en modo oscuro.
 */
export const ChatBackdrop = () => {
  // useId devuelve ":r0:"; los dos puntos rompen el url(#…) del fill.
  const id = `chat-doodle-${useId().replace(/:/g, "")}`;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full text-primary opacity-[0.08]"
    >
      <defs>
        <pattern id={id} width="300" height="300" patternUnits="userSpaceOnUse">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {LAYOUT.map(([icon, transform], i) => (
              <g key={i} transform={transform}>
                {ICONS[icon]}
              </g>
            ))}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
};
