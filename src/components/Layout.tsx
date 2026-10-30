import { NavLink, Outlet, Link } from "react-router-dom";
import {
  Sun,
  Dumbbell,
  Layers,
  ChartNoAxesColumnIncreasing,
  BookOpen,
  Settings,
} from "lucide-react";
const tabs = [
  { to: "/", label: "Today", icon: Sun },
  { to: "/gym", label: "Gym", icon: Dumbbell },
  { to: "/review", label: "Review", icon: Layers },
  { to: "/progress", label: "Progress", icon: ChartNoAxesColumnIncreasing },
];
export function Layout() {
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Zum Inhalt
      </a>
      <header className="topbar">
        <Link to="/" className="brand" aria-label="Deutsch Gym Startseite">
          <span className="brand-mark">
            D<span>G</span>
          </span>
          <span>DEUTSCH GYM</span>
        </Link>
        <div className="top-actions">
          <NavLink to="/library" className="icon-button" aria-label="Library">
            <BookOpen size={21} />
          </NavLink>
          <NavLink to="/settings" className="icon-button" aria-label="Settings">
            <Settings size={21} />
          </NavLink>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <nav className="tabbar" aria-label="Hauptnavigation">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === "/"}>
            <Icon size={23} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
