import { useState } from "react";
import { Layers, ChartNoAxesColumnIncreasing } from "lucide-react";
import { ButtonLink, Card, EmptyState, PageHeading } from "../components/ui";
import { StatusMessage } from "../components/learning-ui";
import { SessionRunner } from "./Training";
import { useLearningData } from "../lib/useLearningData";
import { progressMetrics } from "../lib/progress";
import { worlds, type World } from "../lib/content";
import { localDay } from "../lib/scheduler";
export function Gym() {
  const { data, error, now } = useLearningData();
  const daily = data?.sessions.find(
    (session) => session.id === `daily:${localDay(now)}`,
  );
  const goal =
    data?.preferences.find((pref) => pref.key === "dailyGoal")?.value ?? "3";
  return (
    <>
      <PageHeading eyebrow="TRAININGSSTUDIO" title="Dein nächstes Sprachlevel.">
        Drei Perspektiven. Ein Ziel: Deutsch, das im echten Leben trägt.
      </PageHeading>
      <StatusMessage error={error} loading={!data} />
      {data && (
        <Card>
          <p className="eyebrow">HEUTE · {localDay(now)}</p>
          <h2 className="mt-4">
            {daily?.completedAt != null
              ? "Dein Tagestraining ist geschafft."
              : "Dein tägliches Deutschtraining"}
          </h2>
          <p className="muted mt-4">
            {daily
              ? `${daily.cursor} / ${daily.queue.length} Ausdrücke bearbeitet · ${daily.newIds.length} neue eingeplant`
              : `Zuerst fällige Wiederholungen, danach bis zu ${goal} neue Ausdrücke aus allen Lernwelten.`}
          </p>
          <ButtonLink to="/train">
            {daily?.completedAt != null
              ? "Zusammenfassung"
              : daily
                ? "Training fortsetzen"
                : "Training starten"}
          </ButtonLink>
        </Card>
      )}
      <div className="space-y-4 mt-4">
        {Object.entries(worlds).map(([key, title]) => (
          <Card key={key}>
            <h2>{title}</h2>
            <p className="muted mt-2">20 praktische Ausdrücke · B2–C1</p>
            <ButtonLink to={`/library?category=${key}`}>
              Ausdrücke entdecken
            </ButtonLink>
          </Card>
        ))}
      </div>
    </>
  );
}
export function Review() {
  const { data, error, now } = useLearningData();
  const [started, setStarted] = useState(false);
  const metrics = data ? progressMetrics(data, now) : null;
  const active = data?.sessions.find(
    (session) => session.kind === "review" && session.completedAt === null,
  );
  return (
    <>
      <PageHeading eyebrow="WIEDERHOLEN & FESTIGEN" title="Was bleibt, zählt.">
        Erst erinnern, dann aufdecken. Deine Bewertungen bestimmen den nächsten
        Termin.
      </PageHeading>
      <StatusMessage error={error} loading={!data} />
      {data && (
        <>
          <Card>
            <h2>{metrics!.dueToday} heute fällig</h2>
            <p className="muted mt-2">
              {metrics!.dueNow} jetzt verfügbar · inklusive überfälliger
              Ausdrücke. Again-Karten warten zehn Minuten.
            </p>
            {!started && (metrics!.dueNow > 0 || active) && (
              <button className="button" onClick={() => setStarted(true)}>
                {active ? "Wiederholung fortsetzen" : "Wiederholung starten"}
              </button>
            )}
          </Card>
          {started ? (
            <div className="mt-4">
              <SessionRunner kind="review" />
            </div>
          ) : metrics!.dueToday === 0 && !active ? (
            <div className="mt-4">
              <EmptyState icon={<Layers />} title="Noch keine Wiederholungen">
                Alles erledigt. Neu gelernte Ausdrücke erscheinen hier
                automatisch, sobald sie fällig sind.
              </EmptyState>
            </div>
          ) : null}
          <ButtonLink to="/library?favorites=1">
            Favoriten durchsehen
          </ButtonLink>
          <p className="footnote">
            Favoriten lesen verändert deinen Wiederholungsplan nicht.
          </p>
        </>
      )}
    </>
  );
}
export function Progress() {
  const { data, error, now } = useLearningData();
  const metrics = data ? progressMetrics(data, now) : null;
  return (
    <>
      <PageHeading
        eyebrow="DEINE ENTWICKLUNG"
        title="Fortschritt braucht Zeit."
      >
        Dein Lernen wird sichtbar — mit deinen tatsächlichen Aktivitäten.
      </PageHeading>
      <StatusMessage error={error} loading={!data} />
      {metrics && (
        <>
          {data!.events.length === 0 && (
            <EmptyState
              icon={<ChartNoAxesColumnIncreasing />}
              title="Deine Geschichte beginnt bald"
            >
              Starte eine Tageslektion oder markiere einen Ausdruck als gelernt.
            </EmptyState>
          )}
          <dl className="stats-grid mt-4">
            {[
              ["Gelernt", metrics.learned],
              ["Gefestigt", metrics.mastered],
              ["Heute fällig", metrics.dueToday],
              ["Tage in Folge", metrics.streak],
              ["Abgeschlossene Review-Sitzungen", metrics.reviewSessions],
            ].map(([label, value]) => (
              <div className="card" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <Card className="mt-4">
            <h2>Deine letzten 7 Tage</h2>
            <p className="muted mt-2">
              Bewertungen und neue „Gelernt“-Markierungen
            </p>
            <ol className="activity-list">
              {metrics.activity.map(({ day, count }) => (
                <li key={day}>
                  <time dateTime={day}>{day.slice(5)}</time>
                  <meter
                    min={0}
                    max={Math.max(
                      1,
                      ...metrics.activity.map((entry) => entry.count),
                    )}
                    value={count}
                    aria-label={`Aktivitäten am ${day}`}
                  />
                  <span>{count}</span>
                </li>
              ))}
            </ol>
          </Card>
          <Card className="mt-4">
            <h2>Deine Lernwelten</h2>
            {metrics.worlds.map(({ world, learned, total }) => (
              <div className="world-progress" key={world}>
                <p>
                  {worlds[world as World]}{" "}
                  <span>
                    {learned} / {total}
                  </span>
                </p>
                <progress
                  max={total}
                  value={learned}
                  aria-label={worlds[world as World]}
                />
              </div>
            ))}
          </Card>
          <p className="footnote">
            Gelernt = Good, Easy oder manuell markiert. Gefestigt = mindestens
            21 Tage Intervall. Die Serie zählt aktive lokale Kalendertage;
            gestern zählt weiter, solange heute noch offen ist.
          </p>
        </>
      )}
    </>
  );
}
