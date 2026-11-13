"use client";

import * as React from "react";

/**
 * Minimal next-themes replacement (next-themes renders an inline <script>
 * inside the React tree, which React 19.3 refuses to execute on the client).
 * The no-flash script lives in the server root layout instead.
 */

type Theme = "dark" | "light" | "system";
const STORAGE_KEY = "theme";

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
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<"dark" | "light">("light");

  const apply = React.useCallback((t: Theme) => {
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const resolved = t === "system" ? system : t;
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.style.colorScheme = resolved;
    setResolvedTheme(resolved);
  }, []);

  React.useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? defaultTheme;
    setThemeState(stored);
    apply(stored);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const current = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? defaultTheme;
      if (current === "system") apply("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [apply, defaultTheme]);

  const setTheme = React.useCallback(
    (t: Theme) => {
      localStorage.setItem(STORAGE_KEY, t);
      setThemeState(t);
      apply(t);
    },
    [apply],
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
