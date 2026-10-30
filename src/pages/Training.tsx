import { useEffect, useState } from "react";
import { ButtonLink, Card, PageHeading } from "../components/ui";
import {
  ExpressionCard,
  StatusMessage,
  useAction,
} from "../components/learning-ui";
import { expressionById } from "../lib/content";
import { openSession, rateSession } from "../lib/engine";
import { freshCard, schedule } from "../lib/scheduler";
import { useLearningData } from "../lib/useLearningData";
import type { LearningSession, Rating } from "../lib/learning-types";
const ratings: { value: Rating; label: string; hint: string }[] = [
  { value: "again", label: "Again", hint: "Noch einmal" },
  { value: "hard", label: "Hard", hint: "Schwierig" },
  { value: "good", label: "Good", hint: "Gut erinnert" },
  { value: "easy", label: "Easy", hint: "Sehr leicht" },
];
export function SessionRunner({ kind }: { kind: "daily" | "review" }) {
  const [session, setSession] = useState<LearningSession | null>();
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const { data, error, now } = useLearningData();
  const action = useAction();
  useEffect(() => {
    let active = true;
    setLoadError("");
    void openSession(kind)
      .then((value) => {
        if (active) setSession(value);
      })
      .catch(() => {
        if (active)
          setLoadError(
            "Sitzung konnte nicht geöffnet werden. Bitte erneut versuchen.",
          );
      });
    return () => {
      active = false;
    };
  }, [kind, attempt]);
  const saved = data?.sessions.find((item) => item.id === session?.id);
  const current =
    saved && (!session || saved.cursor >= session.cursor) ? saved : session;
  const failed = loadError || error;
  if (failed)
    return (
      <>
        <StatusMessage error={failed} />
        <button
          className="button"
          onClick={() => setAttempt((value) => value + 1)}
        >
          Erneut versuchen
        </button>
      </>
    );
  if (current === undefined || !data) return <StatusMessage loading />;
  if (!current || current.completedAt !== null) {
    const learned =
      current?.newIds.filter((id) =>
        data.cards.some(
          (card) => card.expressionId === id && card.learnedAt !== null,
        ),
      ).length ?? 0;
    return (
      <Card className="empty-state">
        <h2>
          {current ? "Sitzung abgeschlossen" : "Alles für jetzt erledigt"}
        </h2>
        <p className="muted mt-4">
          {current
            ? `${current.cursor} Ausdrücke bearbeitet${kind === "daily" ? ` · ${learned} neue Ausdrücke gelernt` : ""}. Jede Bewertung ist lokal gespeichert.`
            : "Aktuell ist keine Wiederholung fällig. Kurze Again-Wiederholungen werden nach zehn Minuten verfügbar."}
        </p>
        <p className="muted mt-4">
          Again bleibt im Lernen. Good und Easy zählen als gelernt. Gefestigt
          wird ein Ausdruck ab 21 Tagen Intervall.
        </p>
        <ButtonLink to="/review">Fälligkeit prüfen</ButtonLink>{" "}
        <ButtonLink to="/progress">Fortschritt ansehen</ButtonLink>
        {kind === "review" && (
          <button
            className="secondary mt-4"
            onClick={() => {
              setSession(undefined);
              setAttempt((value) => value + 1);
            }}
          >
            Neue Fälligkeiten laden
          </button>
        )}
      </Card>
    );
  }
  const item = expressionById.get(current.queue[current.cursor]);
  if (!item)
    return (
      <StatusMessage error="Dieser Ausdruck ist nicht verfügbar. Bitte eine Sicherung exportieren und die App aktualisieren." />
    );
  const card =
    data.cards.find((value) => value.expressionId === item.id) ??
    freshCard(item.id);
  return (
    <>
      <div className="session-progress">
        <span>
          {current.newIds.includes(item.id) ? "Neu lernen" : "Wiederholen"}
        </span>
        <span>
          {current.cursor + 1} / {current.queue.length}
        </span>
      </div>
      <progress
        aria-label="Sitzungsfortschritt"
        max={current.queue.length}
        value={current.cursor}
      />
      <ExpressionCard key={`${current.id}:${current.cursor}`} item={item}>
        <div className="rating-grid" aria-label="Erinnerung bewerten">
          {ratings.map(({ value, label, hint }) => {
            const next = schedule(card, value, now);
            return (
              <button
                disabled={action.busy}
                key={value}
                onClick={() =>
                  void action.run(async () => {
                    setSession(
                      await rateSession(current.id, current.cursor, value),
                    );
                  })
                }
              >
                <strong>{label}</strong>
                <span>{hint}</span>
                <small>
                  {value === "again"
                    ? "10 Min."
                    : `${next.interval} ${next.interval === 1 ? "Tag" : "Tage"}`}
                </small>
              </button>
            );
          })}
        </div>
      </ExpressionCard>
      <StatusMessage error={action.error} />
      <p className="footnote">
        Du kannst die App jederzeit schließen. Bereits bewertete Karten bleiben
        gespeichert.
      </p>
    </>
  );
}
export function Training() {
  return (
    <>
      <PageHeading
        eyebrow="DEINE TAGESSESSION"
        title="Ein Ausdruck nach dem anderen."
      >
        Fällige Wiederholungen zuerst. Danach dein neues Deutsch für heute.
      </PageHeading>
      <SessionRunner kind="daily" />
    </>
  );
}
