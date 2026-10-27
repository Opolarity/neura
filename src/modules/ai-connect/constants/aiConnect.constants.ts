import type { AiApp } from "../types";

/** URL unica del MCP: la misma para Claude y ChatGPT. */
export const MCP_URL = (import.meta.env.VITE_MCP_URL || "https://mcp.neura.pe").replace(/\/+$/, "");

/** Guia publica con el mismo paso a paso, para quien quiera mas detalle. */
export const MCP_GUIDE_URL = "https://neura.pe/chatgpt-claude-tiendas-de-ropa#conectar";

export interface AiAppGuide {
  label: string;
  /** Lo que abre el boton de conectar. */
  connectUrl: string;
  /**
   * Si hay que pegar la URL del MCP (conector personalizado). La app publicada
   * en ChatGPT ya la trae: ahi no se muestra ni se copia.
   */
  copyUrl: boolean;
  steps: string[];
}

export const AI_APP_GUIDES: Record<AiApp, AiAppGuide> = {
  claude: {
    label: "Claude",
    // Abre directo el formulario de «Agregar conector personalizado».
    connectUrl: "https://claude.ai/new?modal=add-custom-connector#customize/connectors/yours",
    copyUrl: true,
    steps: [
      "Pulsa «Abrir Claude y conectar»: copiamos la URL y se abre el formulario de conector personalizado.",
      "Ponle de nombre Neura, pega la URL y pulsa Agregar.",
      "Pulsa Conectar: elige tu empresa, entra con tu usuario de Neura y autoriza.",
      "En un chat nuevo, activa Neura en el menú de herramientas y pregunta.",
    ],
  },
  chatgpt: {
    label: "ChatGPT",
    // La app Neura publicada en ChatGPT: se conecta sin pegar ninguna URL.
    connectUrl: "https://chatgpt.com/plugins/plugin_asdk_app_6ac4334e18bc8191b80466dd72fa86ea?search=neura",
    copyUrl: false,
    steps: [
      "Pulsa «Abrir ChatGPT y conectar»: se abre la app Neura en ChatGPT.",
      "Pulsa Conectar.",
      "Elige tu empresa, entra con tu usuario de Neura y autoriza.",
      "En un chat nuevo, selecciona Neura en las herramientas y pregunta.",
    ],
  },
};

export const AI_APP_ORDER: AiApp[] = ["claude", "chatgpt"];
