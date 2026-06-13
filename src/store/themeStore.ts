"use client"

import { create } from "zustand"

type Theme = "light" | "dark"

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "dark",
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme)
      document.documentElement.classList.toggle("dark", theme === "dark")
    }
    set({ theme })
  },
  toggleTheme: () => {
    const current = get().theme
    const next = current === "dark" ? "light" : "dark"
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", next)
      document.documentElement.classList.toggle("dark", next === "dark")
    }
    set({ theme: next })
  },
}))
