
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
  const [theme, setTheme] = useState<Theme>(
    () => (typeof window !== 'undefined' ? localStorage.getItem("daily-planner-pro-theme") as Theme : null) || "dark"
  );
  const [appTheme, setAppTheme] = useState(
     () => (typeof window !== 'undefined' ? localStorage.getItem("daily-planner-pro-app-theme") : null) || 'purple'
  );
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent | CustomEvent) => {
      if (event instanceof StorageEvent && event.key === 'daily-planner-pro-theme') {
        setTheme(event.newValue as Theme || 'dark');
      }
      if ((event instanceof StorageEvent && event.key === 'daily-planner-pro-app-theme') || (event instanceof CustomEvent && event.type === 'theme-updated')) {
        setAppTheme(localStorage.getItem('daily-planner-pro-app-theme') || 'purple');
      }
    };
    
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
      currentTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
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
    const themeClass = themes.find(t => t.name === appTheme)?.className || 'theme-purple';
    const root = window.document.documentElement;
    
    // Remove all possible theme classes before adding the new one
    themes.forEach(t => root.classList.remove(t.className));
    root.classList.add(themeClass);
    
    // This is set by AppContext, so we don't need to set it here
    // localStorage.setItem("daily-planner-pro-app-theme", appTheme);
  }, [appTheme]);


  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
        localStorage.setItem("daily-planner-pro-theme", newTheme);
        setTheme(newTheme);
    },
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
