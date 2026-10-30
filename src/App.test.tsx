import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, afterEach, expect, it } from "vitest";
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
it("navigates through all four tabs with honest empty states", () => {
  mount();
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Mehr als nur Worte.",
  );
  fireEvent.click(screen.getByRole("link", { name: /^Gym$/ }));
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Dein nächstes Sprachlevel.",
  );
  fireEvent.click(screen.getByRole("link", { name: "Review" }));
  expect(screen.getByText("Noch keine Wiederholungen")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: "Progress" }));
  expect(screen.getByText("Deine Geschichte beginnt bald")).toBeInTheDocument();
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
