import type { AiApp } from "../types";

/** URL unica del MCP: la misma para Claude, ChatGPT y cualquier cliente MCP. */
export const MCP_URL = (import.meta.env.VITE_MCP_URL || "https://mcp.neura.pe").replace(/\/+$/, "");

/** Guia publica con el mismo paso a paso, para quien quiera mas detalle. */
export const MCP_GUIDE_URL = "https://neura.pe/chatgpt-claude-tiendas-de-ropa#conectar";

export const CLAUDE_CODE_COMMAND = `claude mcp add --transport http neura ${MCP_URL}`;

export interface AiAppGuide {
  label: string;
  /** Pagina de conectores de la app. "other" no tiene: se configura a mano. */
  settingsUrl: string | null;
  steps: string[];
}

// Los pasos son los de neura.pe (chatgpt-claude-tiendas-de-ropa), con el
// primero adaptado al boton que copia la URL y abre la app.
export const AI_APP_GUIDES: Record<AiApp, AiAppGuide> = {
  claude: {
    label: "Claude",
    settingsUrl: "https://claude.ai/settings/connectors",
    steps: [
      "Pulsa «Abrir Claude y conectar»: copiamos la URL y se abre Configuración → Conectores.",
      "Elige «Agregar conector personalizado», ponle de nombre Neura y pega la URL.",
      "Pulsa Conectar: elige tu empresa, entra con tu usuario de Neura y autoriza.",
      "En un chat nuevo, activa Neura en el menú de herramientas y pregunta.",
    ],
  },
  chatgpt: {
    label: "ChatGPT",
    settingsUrl: "https://chatgpt.com/#settings/Connectors",
    steps: [
      "Pulsa «Abrir ChatGPT y conectar»: copiamos la URL y se abre Configuración → Apps y conectores.",
      "Si tu cuenta lo pide, activa el modo desarrollador en la configuración avanzada.",
      "Crea una app: nombre Neura, pega la URL y elige autenticación OAuth.",
      "Elige tu empresa, entra con tu usuario de Neura, autoriza y selecciona Neura en el chat.",
    ],
  },
  other: {
    label: "Otro cliente",
    settingsUrl: null,
    steps: [
      "Copia el comando o usa la URL como servidor MCP por HTTP en Claude Code, Codex u otro cliente.",
      "Al primer uso se abre el navegador: elige tu empresa y autoriza con tu usuario de Neura.",
    ],
  },
};

export const AI_APP_ORDER: AiApp[] = ["claude", "chatgpt", "other"];
