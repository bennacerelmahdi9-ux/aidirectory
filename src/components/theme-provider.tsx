"use client";

import * as React from "react";

/**
 * Minimal next-themes replacement (next-themes renders an inline <script>
 * inside the React tree, which React 19.3 refuses to execute on the client).
 * The no-flash script lives in the server root layout instead.
 *
 * The theme is modeled as an external store (localStorage + a same-tab
 * custom event) and read with useSyncExternalStore, so no setState-in-effect
 * sync is needed.
 */

type Theme = "dark" | "light" | "system";
const STORAGE_KEY = "theme";
/** Fired on window when the theme changes in this tab (storage events only fire cross-tab). */
const THEME_EVENT = "themechange";

type ThemeContextProps = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "dark" | "light";
};

const ThemeContext = React.createContext<ThemeContextProps>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
});

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const { subscribe, getSnapshot } = React.useMemo(
    () => ({
      subscribe: (callback: () => void) => {
        window.addEventListener(THEME_EVENT, callback);
        window.addEventListener("storage", callback);
        return () => {
          window.removeEventListener(THEME_EVENT, callback);
          window.removeEventListener("storage", callback);
        };
      },
      getSnapshot: (): Theme => (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? defaultTheme,
    }),
    [defaultTheme],
  );

  const theme = React.useSyncExternalStore(subscribe, getSnapshot, () => "system" as Theme);

  // Subscribe to the OS color-scheme preference for "system" themes.
  const system = React.useSyncExternalStore(
    React.useMemo(
      () => (callback: () => void) => {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        media.addEventListener("change", callback);
        return () => media.removeEventListener("change", callback);
      },
      [],
    ),
    () => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
    () => "light" as const,
  );

  const resolvedTheme: "dark" | "light" = theme === "system" ? system : theme;

  // Synchronize the external system (document root) with the current theme.
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = React.useCallback((t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
