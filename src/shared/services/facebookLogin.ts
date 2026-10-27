/**
 * Inicio de sesión con Facebook para empresas (Facebook Login for Business).
 *
 * Lo usa CRM > Canales de mensajería para que el negocio conecte su página de
 * Facebook y su cuenta de Instagram. El navegador solo obtiene un `code` de un
 * uso: el canje por el token lo hace el servicio del bot, que tiene el secreto
 * de la app y guarda el token cifrado. Acá no se maneja ningún token.
 *
 * Los ids son públicos (aparecen en la URL del diálogo de Facebook). Por
 * defecto, los de la app "Chat IA OVTK" y su configuración "NEURA Mensajeria
 * FB IG"; se pueden cambiar con VITE_META_APP_ID y VITE_META_FB_IG_CONFIG_ID.
 */

const APP_ID = import.meta.env.VITE_META_APP_ID || "1528157598923207";
const CONFIG_ID = import.meta.env.VITE_META_FB_IG_CONFIG_ID || "1160965463165144";
const SDK_VERSION = "v22.0";
const SDK_URL = "https://connect.facebook.net/es_LA/sdk.js";

interface FacebookLoginResponse {
  status?: string;
  authResponse?: { code?: string } | null;
}

interface FacebookSdk {
  init: (options: Record<string, unknown>) => void;
  login: (callback: (response: FacebookLoginResponse) => void, options: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    FB?: FacebookSdk;
    fbAsyncInit?: () => void;
  }
}

let sdkPromise: Promise<FacebookSdk> | null = null;

/** Carga el SDK una sola vez por sesión. */
const loadSdk = (): Promise<FacebookSdk> => {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<FacebookSdk>((resolve, reject) => {
    if (window.FB) {
      resolve(window.FB);
      return;
    }

    window.fbAsyncInit = () => {
      if (!window.FB) {
        reject(new Error("No se pudo iniciar el SDK de Facebook."));
        return;
      }
      window.FB.init({ appId: APP_ID, autoLogAppEvents: false, xfbml: false, version: SDK_VERSION });
      resolve(window.FB);
    };

    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error("No se pudo cargar el inicio de sesión de Facebook. Revisa tu conexión o el bloqueador de anuncios."));
    };
    document.body.appendChild(script);
  });

  return sdkPromise;
};

/**
 * Precarga el SDK al abrir la pantalla: así el click abre el diálogo enseguida
 * y el navegador no lo toma como una ventana emergente no pedida.
 */
export const preloadFacebookSdk = (): void => {
  loadSdk().catch(() => {
    // El error se muestra recién si la persona intenta conectar.
  });
};

/**
 * Abre el diálogo de Facebook y devuelve el `code`, o null si la persona lo
 * cerró sin terminar. Tiene que llamarse desde un click: si no, el navegador
 * bloquea la ventana emergente.
 */
export const loginWithFacebookForBusiness = async (): Promise<string | null> => {
  const FB = await loadSdk();
  return new Promise((resolve) => {
    FB.login(
      (response) => resolve(response.authResponse?.code ?? null),
      {
        config_id: CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
      }
    );
  });
};
