import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App";
import { initializeDatabase } from "./lib/db";
import { ThemeProvider } from "./lib/theme";
import "./styles.css";

function UpdateNotice({ apply }: { apply: () => Promise<void> }) {
  const [visible, setVisible] = useState(true);
  return visible ? (
    <aside className="notice" aria-label="App-Update">
      <p>Eine neue Version ist bereit.</p>
      <button onClick={() => void apply()}>Aktualisieren</button>
      <button onClick={() => setVisible(false)}>Später</button>
    </aside>
  ) : null;
}
async function start() {
  const root = createRoot(document.getElementById("root")!);
  try {
    await initializeDatabase();
  } catch {
    root.render(
      <main className="startup-error">
        <h1>Speicher nicht verfügbar</h1>
        <p>
          Deutsch Gym benötigt lokalen Browserspeicher. Prüfe deine
          Safari-Einstellungen und lade die Seite erneut.
        </p>
        <button onClick={() => location.reload()}>Erneut versuchen</button>
      </main>,
    );
    return;
  }
  root.render(
    <StrictMode>
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </StrictMode>,
  );
  const updateSW = registerSW({
    onNeedRefresh() {
      const node = document.createElement("div");
      document.body.append(node);
      createRoot(node).render(<UpdateNotice apply={() => updateSW(true)} />);
    },
    onRegisterError(error) {
      console.error("Offline-Registrierung fehlgeschlagen", error);
    },
  });
}
void start();
