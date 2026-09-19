"use client";

import React, { useEffect, useState } from "react";

const THEME_KEY = "game-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = storedTheme === "dark" || storedTheme === "light"
      ? storedTheme
      : prefersDark ? "dark" : "light";
    applyTheme(resolved);
    setTheme(resolved);
    setMounted(true);
  }, []);

  const applyTheme = (t: "light" | "dark") => {
    document.documentElement.classList.toggle("dark", t === "dark");
    document.documentElement.style.colorScheme = t;
  };

  const onToggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
    window.localStorage.setItem(THEME_KEY, next);
  };

  if (!mounted) {
    return (
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full opacity-0" />
    );
  }

  return (
    <button
      type="button"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={onToggle}
      className="group inline-flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border)",
        color: "var(--fg-muted)",
      }}
    >
      <span className="text-base transition-transform duration-300 group-hover:rotate-12">
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
    </button>
  );
}
