import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // T-523: las edge functions se llaman SOLO por invokeFunction, que es
      // quien saca el mensaje real del backend. Mientras el acceso directo
      // siguiera siendo posible, cada archivo nuevo volvia a introducir el
      // toast "Edge Function returned a non-2xx status code".
      // Ojo: esto NO restringe `.from()`, `.select()` ni `.rpc()`; los selects
      // siguen llamando a Supabase directamente.
      "no-restricted-syntax": [
        "error",
        {
          selector: 'CallExpression[callee.property.name="invoke"][callee.object.property.name="functions"]',
          message:
            "No llames a supabase.functions.invoke directamente: usa invokeFunction de @/integrations/supabase/invokeFunction, que normaliza el error del backend.",
        },
        {
          // esquery delimita el regex con `/`, y no admite escaparlo dentro:
          // por eso la barra se expresa como `.` en vez de `\/`.
          selector: 'Literal[value=/functions.v1./]',
          message:
            "No armes la URL de una edge function a mano: usa invokeFunction de @/integrations/supabase/invokeFunction.",
        },
        {
          selector: 'TemplateElement[value.raw=/functions.v1./]',
          message:
            "No armes la URL de una edge function a mano: usa invokeFunction de @/integrations/supabase/invokeFunction.",
        },
      ],
    },
  },
  {
    // El chokepoint es el unico sitio donde la llamada directa es legitima.
    files: ["src/integrations/supabase/invokeFunction.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    files: ["supabase/functions/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        Deno: "readonly",
        Request: "readonly",
        Response: "readonly",
        Headers: "readonly",
        fetch: "readonly",
        crypto: "readonly",
        console: "readonly",
      },
    },
    rules: {
      // (opcional) apaga reglas de React aquí; no aplican en Deno
      "react-refresh/only-export-components": "off",
    },
  },
);
