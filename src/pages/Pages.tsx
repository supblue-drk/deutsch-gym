import {
  ArrowUpRight,
  BriefcaseBusiness,
  MessageCircle,
  CarFront,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { ButtonLink, Card, PageHeading } from "../components/ui";
import { useTheme } from "../lib/theme";
import { DataSettings } from "../components/DataSettings";
import { useLearningData } from "../lib/useLearningData";
import { progressMetrics } from "../lib/progress";
import { StatusMessage } from "../components/learning-ui";
import type { Theme } from "../lib/db";
const tracks = [
  {
    icon: BriefcaseBusiness,
    title: "Souverän im Beruf",
    text: "Meetings, Feedback & klare Kommunikation",
    tag: "WORKPLACE",
  },
  {
    icon: MessageCircle,
    title: "Natürlich im Alltag",
    text: "Nuancen, Redewendungen & präzise Sprache",
    tag: "EXPRESSION",
  },
  {
    icon: CarFront,
    title: "Automotive & Strategy",
    text: "Automobil, Produkt & Marktpositionierung",
    tag: "AUTOMOTIVE",
  },
];
export function Today() {
  const { data, error, now } = useLearningData();
  const metrics = data ? progressMetrics(data, now) : null;
  const goal =
    data?.preferences.find((pref) => pref.key === "dailyGoal")?.value ?? "3";
  return (
    <>
      <PageHeading
        eyebrow="DEIN PERSÖNLICHES DEUTSCHSTUDIO"
        title="Mehr als nur Worte."
      >
        Dein Raum für souveränes Deutsch. Im Beruf und darüber hinaus.
      </PageHeading>
      <Card className="hero">
        <span className="pill">B2 — C1 · DEIN TÄGLICHES TRAINING</span>
        <div className="hero-decoration" aria-hidden="true">
          Aa<span>↗</span>
        </div>
        <h2>Sprache wird Stärke.</h2>
        <p>Ein klarer Gedanke. Der richtige Ausdruck. Dein nächster Schritt.</p>
        <ButtonLink to="/train">
          Tagestraining öffnen <ArrowUpRight size={18} />
        </ButtonLink>
        <p className="hero-note">
          {metrics
            ? `${metrics.dueNow} jetzt fällig · Tagesziel: ${goal} neue Ausdrücke`
            : "Dein Training ist auch offline verfügbar."}
        </p>
      </Card>
      <StatusMessage error={error} />
      <div className="section-label">
        <h2>Deine Trainingswelten</h2>
        <span>03 BEREICHE</span>
      </div>
      <div className="track-list">
        {tracks.map(({ icon: Icon, title, text }) => (
          <Link className="track-row" to="/gym" key={title}>
            <div className="icon-tile">
              <Icon size={21} />
            </div>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
            <ChevronRight className="muted" size={18} />
          </Link>
        ))}
      </div>
      <p className="footnote">Mit Absicht lernen. Mit Sicherheit sprechen.</p>
    </>
  );
}
export { Gym, Review, Progress } from "./LearningPages";
export { Library } from "./Library";
export function Settings() {
  const { theme, setTheme } = useTheme();
  const [error, setError] = useState("");
  return (
    <>
      <PageHeading eyebrow="EINSTELLUNGEN" title="Dein Studio. Dein Stil.">
        So fühlt sich Deutsch Gym für dich richtig an.
      </PageHeading>
      <Card>
        <h2>Erscheinungsbild</h2>
        <p className="muted mt-2">
          Wähle hell, dunkel oder die Einstellung deines iPhones.
        </p>
        <fieldset className="theme-picker">
          <legend className="sr-only">Farbschema</legend>
          {(
            [
              { value: "system", label: "System" },
              { value: "light", label: "Hell" },
              { value: "dark", label: "Dunkel" },
            ] as { value: Theme; label: string }[]
          ).map(({ value, label }) => (
            <label key={value}>
              <input
                type="radio"
                name="theme"
                checked={theme === value}
                onChange={() => {
                  setError("");
                  void setTheme(value).catch(() =>
                    setError(
                      "Die Einstellung konnte nicht gespeichert werden.",
                    ),
                  );
                }}
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
        {error && <p role="alert">{error}</p>}
      </Card>
      <DataSettings />
      <Card className="mt-4">
        <h2>Auf deinem iPhone</h2>
        <p className="muted mt-2">
          Öffne Deutsch Gym in Safari. Tippe auf „Teilen“ und dann auf „Zum
          Home-Bildschirm“.
        </p>
        <p className="muted mt-4">
          Nach dem ersten vollständigen Laden ist die App-Oberfläche offline
          verfügbar. Deine Daten bleiben lokal in diesem Browser. Das Löschen
          von Website-Daten entfernt sie.
        </p>
      </Card>
      <p className="footnote">Deutsch Gym · Version 0.2.0 · Offline lernen</p>
    </>
  );
}
export function NotFound() {
  return (
    <>
      <PageHeading eyebrow="404" title="Hier geht’s nicht weiter.">
        Diese Seite gibt es nicht.
      </PageHeading>
      <ButtonLink to="/">Zurück zu Today</ButtonLink>
    </>
  );
}
