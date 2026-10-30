import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { db, type Theme } from "./db";
const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (value: Theme) => Promise<void>;
}>({ theme: "system", setTheme: async () => {} });
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, updateTheme] = useState<Theme>("system");
  useEffect(() => {
    let active = true;
    void db.preferences
      .get("theme")
      .then((pref) => {
        if (active && ["system", "light", "dark"].includes(pref?.value ?? ""))
          updateTheme(pref!.value as Theme);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  async function setTheme(value: Theme) {
    await db.preferences.put({ key: "theme", value });
    updateTheme(value);
  }
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
