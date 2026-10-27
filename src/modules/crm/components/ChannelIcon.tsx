import { useId } from "react";
import { WhatsAppIcon } from "@/shared/components/WhatsAppIcon";
import { cn } from "@/shared/utils/utils";
import type { ConversationChannel } from "../types/crm.types";

/*
 * Logos de las redes con SUS colores de marca. Es una excepción deliberada a
 * la regla de neura-styles de íconos sin color propio: un logo de WhatsApp,
 * Instagram, Facebook o TikTok se reconoce por su color, y en la bandeja ese
 * reconocimiento instantáneo es justamente lo que se busca. Por eso los hex van
 * fijos en el SVG y no en clases ni tokens. El negro de TikTok sí usa
 * currentColor, para que en modo oscuro se vea blanco.
 */
const BRAND = {
  whatsapp: "#25D366",
  facebook: "#1877F2",
  tiktokCyan: "#25F4EE",
  tiktokRed: "#FE2C55",
};

const FACEBOOK_PATH =
  "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z";

const TIKTOK_PATH =
  "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z";

const InstagramLogo = ({ className }: { className?: string }) => {
  // Un id por instancia: varios logos en la misma pantalla no deben compartir
  // (ni pisarse) el gradiente.
  const gradientId = `ig-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4 shrink-0", className)} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#FEDA75" />
          <stop offset="25%" stopColor="#FA7E1E" />
          <stop offset="50%" stopColor="#D62976" />
          <stop offset="75%" stopColor="#962FBF" />
          <stop offset="100%" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#${gradientId})`} strokeWidth="2.2">
        <rect x="2.1" y="2.1" width="19.8" height="19.8" rx="5.5" />
        <circle cx="12" cy="12" r="4.6" />
      </g>
      <circle cx="17.6" cy="6.4" r="1.35" fill={`url(#${gradientId})`} />
    </svg>
  );
};

const FacebookLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("h-4 w-4 shrink-0", className)} aria-hidden="true">
    {/* La "f" se ve blanca porque el círculo la recorta sobre el fondo. */}
    <circle cx="12" cy="12" r="11" fill="#fff" />
    <path d={FACEBOOK_PATH} fill={BRAND.facebook} />
  </svg>
);

const TikTokLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("h-4 w-4 shrink-0", className)} aria-hidden="true">
    <path d={TIKTOK_PATH} fill={BRAND.tiktokCyan} transform="translate(-0.7 -0.5)" />
    <path d={TIKTOK_PATH} fill={BRAND.tiktokRed} transform="translate(0.7 0.5)" />
    <path d={TIKTOK_PATH} fill="currentColor" />
  </svg>
);

/** Logo de la red de una conversación, con sus colores de marca. */
export const ChannelIcon = ({
  channel,
  className,
}: {
  channel: ConversationChannel;
  className?: string;
}) => {
  if (channel === "instagram") return <InstagramLogo className={className} />;
  if (channel === "facebook") return <FacebookLogo className={className} />;
  if (channel === "tiktok") return <TikTokLogo className={className} />;
  return (
    <span style={{ color: BRAND.whatsapp }} className="inline-flex shrink-0">
      <WhatsAppIcon className={className} />
    </span>
  );
};
