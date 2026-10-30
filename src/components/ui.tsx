import type { ReactNode } from "react";
import { Link } from "react-router-dom";
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children && <p className="muted intro">{children}</p>}
    </header>
  );
}
export function EmptyState({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="empty-state">
      <div className="icon-tile">{icon}</div>
      <h2>{title}</h2>
      <p className="muted">{children}</p>
    </Card>
  );
}
export function ButtonLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link className="button" to={to}>
      {children}
    </Link>
  );
}
