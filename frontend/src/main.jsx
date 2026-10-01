/* eslint-disable react-refresh/only-export-components */
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { DEMO_MODE } from "./lib/auth";
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const root = createRoot(document.getElementById("root"));

// Mode demo: tanpa ClerkProvider, tanpa login — langsung masuk zona chat.
if (DEMO_MODE) {
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
} else if (!PUBLISHABLE_KEY) {
  // Avoid throwing so the app doesn't produce a blank page during dev
  // Render an instructive message instead so the developer can fix env
  root.render(
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: 8 }}>Missing Clerk publishable key</h2>
      <p style={{ margin: 0 }}>Add <strong>VITE_CLERK_PUBLISHABLE_KEY</strong> to frontend/.env and restart the dev server.</p>
    </div>,
  );
} else {
  root.render(
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>,
  );
}
