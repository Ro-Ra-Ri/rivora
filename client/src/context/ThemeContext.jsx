import { createContext, useContext, useEffect, useState } from "react";
import {
  isSoundEnabled,
  playClick,
  setSoundEnabledStorage,
} from "../utils/soundEffects";

const ThemeContext = createContext(null);

const STORAGE_KEY = "rivora_theme";

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") {
        return saved;
      }
    } catch {
      // Abaikan jika localStorage tidak tersedia
    }
    return "dark";
  });

  const [soundEnabled, setSoundEnabled] = useState(() => isSoundEnabled());

  const isDark = theme === "dark";

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Abaikan jika localStorage tidak tersedia
    }
  }, [theme, isDark]);

  function setTheme(nextTheme) {
    setThemeState(nextTheme);
    playClick();
  }

  function toggleTheme() {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
    playClick();
  }

  function toggleSound() {
    setSoundEnabled((prev) => {
      const next = !prev;
      setSoundEnabledStorage(next);
      if (next) {
        setTimeout(() => playClick(), 20);
      }
      return next;
    });
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        setTheme,
        toggleTheme,
        soundEnabled,
        toggleSound,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme harus dipakai di dalam ThemeProvider");
  }
  return context;
}
