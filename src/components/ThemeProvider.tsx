
"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { themes } from '@/lib/themes';

type Theme = "light" | "dark" | "system";

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [appTheme, setAppTheme] = useState('red');
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const handleStorageChange = () => {
      const storedTheme = localStorage.getItem("daily-planner-pro-theme") as Theme | null;
      const storedAppTheme = localStorage.getItem("daily-planner-pro-app-theme") as string | null;
      setTheme(storedTheme || "dark");
      setAppTheme(storedAppTheme || 'red');
    };
    
    handleStorageChange(); // Initial load

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('theme-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('theme-updated', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    let currentTheme: "light" | "dark";

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      currentTheme = systemTheme;
    } else {
      currentTheme = theme;
    }
    
    setResolvedTheme(currentTheme);
    
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(currentTheme);
    localStorage.setItem("daily-planner-pro-theme", theme);
  }, [theme]);
  
  useEffect(() => {
    const themeClass = themes.find(t => t.name === appTheme)?.className || 'theme-red';
    const root = window.document.documentElement;
    
    themes.forEach(t => root.classList.remove(t.className));
    root.classList.add(themeClass);
    localStorage.setItem("daily-planner-pro-app-theme", appTheme);
  }, [appTheme]);


  const value = {
    theme,
    setTheme,
    resolvedTheme,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
