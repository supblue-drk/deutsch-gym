import {
  ArrowUpRight,
  BriefcaseBusiness,
  MessageCircle,
  CarFront,
  Layers,
  ChartNoAxesColumnIncreasing,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { ButtonLink, Card, EmptyState, PageHeading } from "../components/ui";
import { useTheme } from "../lib/theme";
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
    title: "Natürlich ausdrücken",
    text: "Nuancen, Redewendungen & präzise Sprache",
    tag: "EXPRESSION",
  },
  {
    icon: CarFront,
    title: "Strategisch mitreden",
    text: "Automobil, Produkt & Marktpositionierung",
    tag: "AUTOMOTIVE",
  },
];
export function Today() {
  return (
    <>
      <PageHeading
        eyebrow="DEIN PERSÖNLICHES DEUTSCHSTUDIO"
        title="Mehr als nur Worte."
      >
        Dein Raum für souveränes Deutsch. Im Beruf und darüber hinaus.
      </PageHeading>
      <Card className="hero">
        <span className="pill">B2 — C1 · PHASE 1</span>
        <div className="hero-decoration" aria-hidden="true">
          Aa<span>↗</span>
        </div>
        <h2>Sprache wird Stärke.</h2>
        <p>Ein klarer Gedanke. Der richtige Ausdruck. Dein nächster Schritt.</p>
        <ButtonLink to="/gym">
          Das Gym entdecken <ArrowUpRight size={18} />
        </ButtonLink>
        <p className="hero-note">Dein Studio steht. Die Trainings folgen.</p>
      </Card>
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
export function Gym() {
  return (
    <>
      <PageHeading eyebrow="TRAININGSSTUDIO" title="Dein nächstes Sprachlevel.">
        Drei Perspektiven. Ein Ziel: Deutsch, das im echten Leben trägt.
      </PageHeading>
      <div className="space-y-4">
        {tracks.map(({ icon: Icon, title, text, tag }) => (
          <Card key={title}>
            <div className="flex items-center justify-between">
              <div className="icon-tile">
                <Icon />
              </div>
              <span className="eyebrow">{tag}</span>
            </div>
            <h2 className="mt-5">{title}</h2>
            <p className="muted mt-2">{text}</p>
            <span className="status-label">
              Training folgt in einer späteren Phase
            </span>
          </Card>
        ))}
      </div>
    </>
  );
}
export function Review() {
  return (
    <>
      <PageHeading eyebrow="WIEDERHOLEN & FESTIGEN" title="Was bleibt, zählt.">
        Hier werden später deine fälligen Wiederholungen gesammelt.
      </PageHeading>
      <EmptyState icon={<Layers />} title="Noch keine Wiederholungen">
        Sobald du mit dem Training beginnst, entsteht hier deine persönliche
        Wiederholungsliste.
      </EmptyState>
    </>
  );
}
export function Progress() {
  return (
    <>
      <PageHeading
        eyebrow="DEINE ENTWICKLUNG"
        title="Fortschritt braucht Zeit."
      >
        Dein Lernen wird sichtbar — sobald du loslegst.
      </PageHeading>
      <EmptyState
        icon={<ChartNoAxesColumnIncreasing />}
        title="Deine Geschichte beginnt bald"
      >
        Es gibt noch keine abgeschlossenen Trainings. Hier erscheinen später
        ausschließlich deine tatsächlichen Lerndaten.
      </EmptyState>
    </>
  );
}
export function Library() {
  return (
    <>
      <PageHeading eyebrow="DEINE BIBLIOTHEK" title="Gute Worte. Griffbereit.">
        Ein zukünftiger Ort für nützliche Ausdrücke und persönliche
        Sprachbausteine.
      </PageHeading>
      <EmptyState icon={<BookOpen />} title="Noch keine Einträge">
        Die Bibliothek ist vorbereitet. Lerninhalte und das Speichern eigener
        Ausdrücke folgen später.
      </EmptyState>
    </>
  );
}
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
      <p className="footnote">Deutsch Gym · Version 0.1.0 · Phase 1</p>
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
