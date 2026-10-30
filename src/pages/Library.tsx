import { Link, useParams, useSearchParams } from "react-router-dom";
import { Star } from "lucide-react";
import { ButtonLink, Card, PageHeading } from "../components/ui";
import {
  ExpressionCard,
  stateLabels,
  StatusMessage,
  useAction,
} from "../components/learning-ui";
import {
  expressionById,
  expressions,
  searchExpressions,
  worlds,
  type World,
} from "../lib/content";
import { useLearningData } from "../lib/useLearningData";
import { markLearned, toggleFavorite } from "../lib/engine";
export function Library() {
  const [params, setParams] = useSearchParams();
  const { data, error } = useLearningData();
  const action = useAction();
  const query = params.get("q") ?? "";
  const category = params.get("category") ?? "all";
  const level = params.get("level") ?? "all";
  const favorites = params.get("favorites") === "1";
  function filter(key: string, value: string) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value && value !== "all") next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  }
  const cards = new Map(data?.cards.map((card) => [card.expressionId, card]));
  const items = searchExpressions(query, category, level).filter(
    (item) => !favorites || cards.get(item.id)?.favorite,
  );
  return (
    <>
      <PageHeading
        eyebrow={`${expressions.length} AUSDRÜCKE · OFFLINE`}
        title="Gute Worte. Griffbereit."
      >
        Deutsch zuerst. Chinesische Erklärungen, wenn du sie brauchst.
      </PageHeading>
      <div className="filters">
        <label>
          Ausdruck suchen
          <input
            type="search"
            value={query}
            placeholder="Deutsch, 中文, Tags …"
            onChange={(event) => filter("q", event.target.value)}
          />
        </label>
        <div className="filter-row">
          <label>
            Lernwelt
            <select
              value={category}
              onChange={(event) => filter("category", event.target.value)}
            >
              <option value="all">Alle Lernwelten</option>
              {Object.entries(worlds).map(([key, title]) => (
                <option value={key} key={key}>
                  {title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Niveau
            <select
              value={level}
              onChange={(event) => filter("level", event.target.value)}
            >
              <option value="all">B2 & C1</option>
              <option>B2</option>
              <option>C1</option>
            </select>
          </label>
        </div>
        <label className="check-label">
          <input
            type="checkbox"
            checked={favorites}
            onChange={(event) =>
              filter("favorites", event.target.checked ? "1" : "")
            }
          />
          Nur Favoriten
        </label>
      </div>
      <StatusMessage error={error || action.error} />
      <p role="status" className="muted results-count">
        {items.length} Ausdrücke
      </p>
      <div className="space-y-3">
        {items.map((item) => {
          const card = cards.get(item.id);
          return (
            <Card key={item.id}>
              <div className="library-row">
                <Link className="expression-link" to={`/library/${item.id}`}>
                  <span className="eyebrow">
                    {item.level} · {worlds[item.category]}
                  </span>
                  <h2>{item.german}</h2>
                  <p lang="zh-CN" className="muted">
                    {item.chinese}
                  </p>
                  <small>{stateLabels[card?.state ?? "new"]}</small>
                </Link>
                <button
                  className="icon-button"
                  disabled={action.busy || !data}
                  aria-label={`Favorit: ${item.german}`}
                  aria-pressed={card?.favorite ?? false}
                  onClick={() => void action.run(() => toggleFavorite(item.id))}
                >
                  <Star fill={card?.favorite ? "currentColor" : "none"} />
                </button>
              </div>
            </Card>
          );
        })}
      </div>
      {!items.length && (
        <Card>
          <h2>Keine passenden Ausdrücke</h2>
          <p className="muted">
            Ändere die Filter oder speichere einen Ausdruck als Favorit.
          </p>
        </Card>
      )}
    </>
  );
}
export function ExpressionDetail() {
  const { id } = useParams();
  const item = expressionById.get(id ?? "");
  const { data, error } = useLearningData();
  const action = useAction();
  if (!item)
    return (
      <>
        <PageHeading eyebrow="BIBLIOTHEK" title="Ausdruck nicht gefunden." />
        <ButtonLink to="/library">Zur Bibliothek</ButtonLink>
      </>
    );
  const card = data?.cards.find((value) => value.expressionId === item.id);
  return (
    <>
      <PageHeading
        eyebrow={worlds[item.category as World]}
        title="Dein Sprachbaustein."
      />
      <ExpressionCard item={item} revealInitially />
      <div className="action-row">
        <button
          className="secondary"
          disabled={action.busy || !data}
          aria-pressed={card?.favorite ?? false}
          onClick={() => void action.run(() => toggleFavorite(item.id))}
        >
          {card?.favorite ? "★ Favorit entfernen" : "☆ Als Favorit speichern"}
        </button>
        <button
          className="secondary"
          disabled={action.busy || !data || card?.learnedAt != null}
          onClick={() => void action.run(() => markLearned(item.id))}
        >
          {card?.learnedAt != null
            ? "Als gelernt markiert"
            : "Als gelernt markieren"}
        </button>
      </div>
      <StatusMessage error={error || action.error} />
      <p className="muted mt-4">
        {stateLabels[card?.state ?? "new"]}
        {card?.nextReviewDate
          ? ` · Nächste Wiederholung: ${card.nextReviewDate}`
          : ""}
      </p>
      <p className="muted mt-4">
        Favoriten ändern keine Fälligkeit. „Als gelernt markieren“ plant die
        erste Wiederholung für morgen ein und ändert keine bereits als gelernt
        gespeicherte Karte.
      </p>
      <ButtonLink to="/library">Zur Bibliothek</ButtonLink>
    </>
  );
}
