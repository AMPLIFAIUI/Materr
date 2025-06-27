import { createRoot } from "react-dom/client";
import App from "./App";

import "./index.css";

// Force dark mode on HTML and BODY elements
document.documentElement.classList.add('dark');
document.body.classList.add('dark');

createRoot(document.getElementById("root")!).render(<App />);
