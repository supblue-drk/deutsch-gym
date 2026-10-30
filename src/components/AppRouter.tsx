import { HashRouter } from "react-router-dom";
import type { ReactNode } from "react";

// GitHub Pages cannot rewrite nested requests to index.html. The hash keeps
// every page request on /deutsch-gym/ while preserving shareable client routes.
export function AppRouter({ children }: { children: ReactNode }) {
  return <HashRouter>{children}</HashRouter>;
}
