import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { execSync } from "node:child_process";

// Release que reporta el RUM: en Coolify llega como SOURCE_COMMIT (Dockerfile);
// en local se lee de git; si no hay nada, "unknown".
function rumRelease(): string {
  const fromEnv = process.env.VITE_RUM_RELEASE || process.env.SOURCE_COMMIT;
  if (fromEnv) return fromEnv.slice(0, 12);
  try {
    return execSync("git rev-parse --short=12 HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  define: {
    __RUM_RELEASE__: JSON.stringify(rumRelease()),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@app": path.resolve(__dirname, "./src/app"),
      "@modules": path.resolve(__dirname, "./src/modules"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
}));