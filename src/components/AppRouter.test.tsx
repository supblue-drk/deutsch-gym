import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { AppRouter } from "./AppRouter";
import { App } from "../App";

afterEach(() => window.history.replaceState(null, "", "/"));

it("opens and reloads hash routes under the Pages project path", () => {
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
  expect(screen.getByText("Noch keine Wiederholungen")).toBeInTheDocument();
  first.unmount();
  render(
    <AppRouter>
      <App />
    </AppRouter>,
  );
  expect(screen.getByText("Noch keine Wiederholungen")).toBeInTheDocument();
});
