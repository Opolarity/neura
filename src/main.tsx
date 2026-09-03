import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./index.css";

// Vite dispara `vite:preloadError` cuando falla un import() dinámico; el caso
// típico es un chunk con hash viejo tras un deploy. Recargar una sola vez trae
// el index nuevo; el flag en sessionStorage evita un bucle si vuelve a fallar.
window.addEventListener("vite:preloadError", (event) => {
  const key = "neura:preload-reloaded";
  if (sessionStorage.getItem(key) === window.location.href) return;
  event.preventDefault();
  sessionStorage.setItem(key, window.location.href);
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(<App />);
