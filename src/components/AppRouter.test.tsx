import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, expect, it } from "vitest";
import { AppRouter } from "./AppRouter";
import { App } from "../App";

import { db, initializeDatabase } from "../lib/db";
beforeEach(async () => {
  await initializeDatabase();
});
afterEach(async () => {
  window.history.replaceState(null, "", "/");
  await db.delete();
});

it("opens and reloads hash routes under the Pages project path", async () => {
  window.history.replaceState(null, "", "/deutsch-gym/#/settings");
  const first = render(
    <AppRouter>
      <App />
    </AppRouter>,
  );
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Dein Studio. Dein Stil.",
  );
  fireEvent.click(screen.getByRole("link", { name: "Review" }));
  expect(window.location.pathname).toBe("/deutsch-gym/");
  expect(window.location.hash).toBe("#/review");
  expect(
    await screen.findByText("Noch keine Wiederholungen"),
  ).toBeInTheDocument();
  first.unmount();
  render(
    <AppRouter>
      <App />
    </AppRouter>,
  );
  expect(
    await screen.findByText("Noch keine Wiederholungen"),
  ).toBeInTheDocument();
});
