import { createContext, useContext, useEffect, useMemo, useState } from "react";

const palettes = {
  midnight: {
    name: "Midnight Pulse",
    background: "from-[#030712] via-[#0b1b3b] to-[#06142f]",
    accent: "#16C1F3",
    primary: "#086AD8",
    glow: "rgba(22,193,243,0.35)",
    card: "bg-white/10 backdrop-blur-xl border border-white/15"
  },
  nebula: {
    name: "Nebula Neon",
    background: "from-[#050718] via-[#0f1b3d] to-[#1b2350]",
    accent: "#9D7BFF",
    primary: "#5B30F6",
    glow: "rgba(157,123,255,0.3)",
    card: "bg-[#0f1430]/80 backdrop-blur-xl border border-[#3a3f63]/60"
  },
  daylight: {
    name: "Daylight Gradient",
    background: "from-[#f5fbff] via-[#e8f3ff] to-[#d9ecff]",
    accent: "#0EA5E9",
    primary: "#2563EB",
    glow: "rgba(37,99,235,0.18)",
    card: "bg-white/60 backdrop-blur-xl border border-white/70"
  }
};

const ThemeContext = createContext({
  theme: "midnight",
  palette: palettes.midnight,
  availableThemes: Object.keys(palettes),
  setTheme: () => {}
});

export function ThemeProvider({ initialTheme = "midnight", children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return initialTheme;
    const stored = window.localStorage.getItem("wheels-theme");
    return stored && palettes[stored] ? stored : initialTheme;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("wheels-theme", theme);
    }
  }, [theme]);

  const palette = useMemo(() => palettes[theme] || palettes.midnight, [theme]);
  const value = useMemo(
    () => ({ theme, palette, availableThemes: Object.keys(palettes), setTheme }),
    [theme, palette]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
