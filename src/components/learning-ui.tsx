import { useState, useRef, useEffect } from "react";
import { Card } from "./ui";
import { registers, worlds, type Expression } from "../lib/content";
import type { CardState } from "../lib/learning-types";
export const stateLabels: Record<CardState, string> = {
  new: "Neu",
  learning: "Im Lernen",
  review: "Wiederholen",
  mastered: "Gefestigt",
};
export function StatusMessage({
  error,
  loading = false,
}: {
  error?: string;
  loading?: boolean;
}) {
  return error ? (
    <p className="feedback error" role="alert">
      {error}
    </p>
  ) : loading ? (
    <p className="muted" role="status">
      Lokale Daten werden geladen …
    </p>
  ) : null;
}
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Speichern fehlgeschlagen: ${err.message}`
          : "Speichern fehlgeschlagen. Bitte erneut versuchen.",
      );
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}
export function ExpressionAnswer({ item }: { item: Expression }) {
  return (
    <div className="answer">
      <p className="chinese" lang="zh-CN">
        {item.chinese}
      </p>
      <p>{item.explanation}</p>
      <blockquote>
        <p>{item.example}</p>
        <p lang="zh-CN" className="muted">
          {item.exampleChinese}
        </p>
      </blockquote>
      <h3>Gut zu wissen</h3>
      <p className="muted">{item.notes}</p>
      <div className="tags">
        {item.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </div>
  );
}
export function ExpressionCard({
  item,
  children,
  revealInitially = false,
}: {
  item: Expression;
  children?: React.ReactNode;
  revealInitially?: boolean;
}) {
  const [revealed, setRevealed] = useState(revealInitially);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!revealInitially) heading.current?.focus();
  }, [item.id, revealInitially]);
  return (
    <Card>
      <p className="eyebrow">{worlds[item.category]}</p>
      <div className="tags">
        <span>{item.level}</span>
        <span>{registers[item.register]}</span>
      </div>
      <h2 ref={heading} tabIndex={-1} className="expression-title">
        {item.german}
      </h2>
      {revealed ? (
        <>
          <ExpressionAnswer item={item} />
          {children}
        </>
      ) : (
        <button className="button" onClick={() => setRevealed(true)}>
          Antwort aufdecken
        </button>
      )}
    </Card>
  );
}
