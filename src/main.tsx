import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// PrimeReact
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";

createRoot(document.getElementById("root")!).render(<App />);
