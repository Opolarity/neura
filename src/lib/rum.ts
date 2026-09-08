/**
 * Real User Monitoring (NEURA RUM, SDK @opolarity/rum).
 *
 * Es el PRIMER import de main.tsx a proposito: initRum parchea window.fetch y
 * los imports de ES se evaluan antes que el cuerpo del modulo, asi que si se
 * importara despues del cliente de Supabase el parche no lo alcanzaria.
 * Ademas client.ts pasa `rumFetch` explicitamente, por si cambia el orden.
 *
 * Sin VITE_RUM_ENDPOINT / VITE_RUM_KEY no se inicializa nada y todas las
 * funciones exportadas son no-op: un entorno local sin variables sigue
 * funcionando igual.
 */
import { initRum } from "@opolarity/rum";

/** main | develop | perception. La variable manda; el hostname es el respaldo. */
function inferEnv(): string {
  const configured = import.meta.env.VITE_RUM_ENV as string | undefined;
  if (configured) return configured;
  const host = window.location.hostname;
  if (host.startsWith("percept")) return "perception";
  if (host.includes("demo") || host === "localhost" || host === "127.0.0.1") return "develop";
  return "main";
}

const endpoint = import.meta.env.VITE_RUM_ENDPOINT as string | undefined;
const projectKey = import.meta.env.VITE_RUM_KEY as string | undefined;

if (endpoint && projectKey) {
  initRum({
    endpoint,
    projectKey,
    env: inferEnv(),
    release: typeof __RUM_RELEASE__ === "string" ? __RUM_RELEASE__ : null,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    sampleRate: 1,
    debug: import.meta.env.VITE_RUM_DEBUG === "true",
  });
}

export {
  captureError,
  captureEvent,
  measure,
  setTenant,
  setUser,
  startMeasure,
} from "@opolarity/rum";
