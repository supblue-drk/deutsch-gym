import { useRef, useState } from "react";
import { Card } from "./ui";
import { StatusMessage, useAction } from "./learning-ui";
import { useLearningData } from "../lib/useLearningData";
import { db, type Theme } from "../lib/db";
import {
  exportBackup,
  importBackup,
  resetProgress,
  validateBackup,
} from "../lib/backup";
import { localDay } from "../lib/scheduler";
import { useTheme } from "../lib/theme";
export function DataSettings() {
  const { data, error } = useLearningData();
  const action = useAction();
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const { setTheme } = useTheme();
  const goal =
    data?.preferences.find((pref) => pref.key === "dailyGoal")?.value ?? "3";
  async function download() {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `deutsch-gym-${localDay()}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    setMessage(
      "Sicherung erstellt. In Safari: Downloads öffnen und die JSON-Datei in Dateien sichern; bei einer Vorschau das Teilen-Menü nutzen.",
    );
  }
  async function restore(file: File) {
    if (file.size > 10 * 1024 * 1024)
      throw new Error("Die Datei ist größer als 10 MB.");
    const backup = validateBackup(JSON.parse(await file.text()));
    if (
      !window.confirm(
        `Sicherung vom ${new Date(backup.exportedAt).toLocaleString("de-DE")} mit ${backup.cards.length} Lernständen importieren? Alle vorhandenen Lernstände, Favoriten und Einstellungen werden ersetzt.`,
      )
    )
      return;
    await importBackup(backup);
    await setTheme(
      (backup.preferences.find((pref) => pref.key === "theme")?.value ??
        "system") as Theme,
    );
    setMessage("Sicherung vollständig wiederhergestellt.");
  }
  return (
    <>
      <Card className="mt-4">
        <h2>Tägliches Lernziel</h2>
        <p className="muted mt-2">
          Neue Ausdrücke pro Tag. Eine bereits begonnene Tageslektion behält ihr
          Ziel; Änderungen gelten ab der nächsten Tageslektion.
        </p>
        <fieldset className="theme-picker">
          <legend className="sr-only">Neue Ausdrücke pro Tag</legend>
          {[3, 5, 10].map((value) => (
            <label key={value}>
              <input
                type="radio"
                name="dailyGoal"
                checked={goal === String(value)}
                disabled={action.busy || !data}
                onChange={() =>
                  void action.run(async () => {
                    await db.preferences.put({
                      key: "dailyGoal",
                      value: String(value),
                    });
                    setMessage("Lernziel gespeichert.");
                  })
                }
              />
              <span>{value}</span>
            </label>
          ))}
        </fieldset>
      </Card>
      <Card className="mt-4">
        <h2>Deine Daten</h2>
        <p className="muted mt-2">
          Fortschritt und Einstellungen bleiben auf diesem Gerät. Sichere sie
          regelmäßig. Die 60 Ausdrücke sind fest in der App enthalten.
        </p>
        <div className="action-stack">
          <button
            className="secondary"
            disabled={action.busy || !data}
            onClick={() => void action.run(download)}
          >
            JSON-Sicherung exportieren
          </button>
          <button
            className="secondary"
            disabled={action.busy || !data}
            onClick={() => input.current?.click()}
          >
            JSON-Sicherung importieren
          </button>
          <input
            ref={input}
            className="sr-only"
            type="file"
            accept=".json,application/json"
            aria-label="Sicherungsdatei wählen"
            disabled={action.busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) {
                setMessage("");
                void action.run(() => restore(file));
              }
            }}
          />
          <button
            className="secondary danger"
            disabled={action.busy || !data}
            onClick={() => {
              if (
                window.confirm(
                  "Alle Lernstände, Sitzungen, Aktivitäten und Favoriten auf diesem Gerät unwiderruflich löschen? Einstellungen und die 60 gebündelten Ausdrücke bleiben erhalten.",
                )
              )
                void action.run(async () => {
                  await resetProgress();
                  setMessage(
                    "Lernfortschritt zurückgesetzt. Inhalte und Einstellungen sind erhalten.",
                  );
                });
            }}
          >
            Lernfortschritt zurücksetzen
          </button>
        </div>
        <p className="muted mt-4">
          Import ersetzt vorhandene Daten erst nach vollständiger Prüfung und
          deiner Bestätigung. Kein Zusammenführen. Eine Sicherung enthält
          persönliche Lerndaten.
        </p>
        <StatusMessage error={error || action.error} />
        {message && (
          <p role="status" className="feedback">
            {message}
          </p>
        )}
      </Card>
    </>
  );
}
