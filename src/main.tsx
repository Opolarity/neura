import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./index.css";
import "./shared/styles/App.css";

createRoot(document.getElementById("root")!).render(<App />);
