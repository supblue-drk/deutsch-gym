import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { App } from "./App";
import { db, initializeDatabase } from "./lib/db";
import { ThemeProvider } from "./lib/theme";
beforeEach(async () => {
  await initializeDatabase();
});
afterEach(async () => {
  await db.delete();
});
function mount(path = "/") {
  render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </MemoryRouter>,
  );
}
it("navigates through all four tabs with honest empty states", async () => {
  mount();
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Mehr als nur Worte.",
  );
  fireEvent.click(screen.getByRole("link", { name: /^Gym$/ }));
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Dein nächstes Sprachlevel.",
  );
  fireEvent.click(screen.getByRole("link", { name: "Review" }));
  expect(
    await screen.findByText("Noch keine Wiederholungen"),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: "Progress" }));
  expect(
    await screen.findByText("Deine Geschichte beginnt bald"),
  ).toBeInTheDocument();
});
it.each([
  ["/library", "Gute Worte. Griffbereit."],
  ["/settings", "Dein Studio. Dein Stil."],
  ["/unknown", "Hier geht’s nicht weiter."],
])("supports direct route %s", (path, heading) => {
  mount(path);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(heading);
});
it("persists and applies a selected theme", async () => {
  mount("/settings");
  fireEvent.click(screen.getByRole("radio", { name: "Dunkel" }));
  await waitFor(() =>
    expect(document.documentElement.dataset.theme).toBe("dark"),
  );
  expect((await db.preferences.get("theme"))?.value).toBe("dark");
});

it("finishes three expressions through the reveal-and-rate interface and shows actual progress", async () => {
  mount("/train");
  for (const id of ["work-001", "life-001", "auto-001"]) {
    await screen.findByRole("button", { name: "Antwort aufdecken" });
    expect(
      screen.queryByRole("button", { name: /^Good/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Antwort aufdecken" }));
    const good = screen.getByRole("button", { name: /^Good/ });
    fireEvent.click(good);
    await waitFor(async () =>
      expect((await db.cards.get(id))?.learnedAt).toEqual(expect.any(Number)),
    );
    await waitFor(() => expect(good).not.toBeInTheDocument());
  }
  expect(await screen.findByText("Sitzung abgeschlossen")).toBeInTheDocument();
  expect(await db.cards.count()).toBe(3);
  fireEvent.click(screen.getByRole("link", { name: "Progress" }));
  await screen.findByText("Deine letzten 7 Tage");
  expect(screen.getByText("Gelernt").nextElementSibling).toHaveTextContent("3");
});
it("favorites do not schedule reviews, while explicit learned marking does", async () => {
  mount("/library/work-001");
  const favorite = screen.getByRole("button", {
    name: /Als Favorit speichern/,
  });
  await waitFor(() => expect(favorite).toBeEnabled());
  fireEvent.click(favorite);
  await waitFor(async () =>
    expect((await db.cards.get("work-001"))?.favorite).toBe(true),
  );
  expect((await db.cards.get("work-001"))?.dueAt).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Als gelernt markieren" }),
  );
  await waitFor(async () =>
    expect((await db.cards.get("work-001"))?.state).toBe("review"),
  );
  expect((await db.cards.get("work-001"))?.dueAt).not.toBeNull();
});

it("completes a due review through the UI and records a real review session", async () => {
  const { freshCard, schedule } = await import("./lib/scheduler");
  await db.cards.put(
    schedule(freshCard("work-001"), "good", Date.now() - 3 * 86400000),
  );
  mount("/review");
  fireEvent.click(
    await screen.findByRole("button", { name: "Wiederholung starten" }),
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Antwort aufdecken" }),
  );
  fireEvent.click(screen.getByRole("button", { name: /^Easy/ }));
  expect(await screen.findByText("Sitzung abgeschlossen")).toBeInTheDocument();
  const sessions = await db.learningSessions
    .where("kind")
    .equals("review")
    .toArray();
  expect(sessions).toHaveLength(1);
  expect(sessions[0].completedAt).toEqual(expect.any(Number));
  expect((await db.cards.get("work-001"))?.reviewCount).toBe(2);
});
it("requires explicit confirmation before resetting progress", async () => {
  const { markLearned } = await import("./lib/engine");
  await markLearned("work-001");
  mount("/settings");
  const reset = screen.getByRole("button", {
    name: "Lernfortschritt zurücksetzen",
  });
  await waitFor(() => expect(reset).toBeEnabled());
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  try {
    fireEvent.click(reset);
    expect(confirm).toHaveBeenCalled();
    expect(await db.cards.count()).toBe(1);
    confirm.mockReturnValue(true);
    fireEvent.click(reset);
    await waitFor(async () => expect(await db.cards.count()).toBe(0));
    expect(await db.preferences.get("theme")).toBeDefined();
  } finally {
    confirm.mockRestore();
  }
});
