import { themeShowcase, useTheme } from "../../context/ThemeContext.jsx";

export default function ThemeToggle() {
  const { availableThemes, theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-white/20 bg-white/10 px-4 py-3 text-white/80 backdrop-blur-md">
      <span className="text-[10px] font-semibold uppercase tracking-[0.45em] text-white/60">Tema</span>
      <div className="flex gap-3">
        {availableThemes.map((item) => {
          const info = themeShowcase[item] || { label: item, preview: "from-[#1a1a1a] to-[#0f0f0f]", accent: "#16C1F3" };
          const isActive = item === theme;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setTheme(item)}
              className={`relative flex-1 overflow-hidden rounded-2xl border transition focus:outline-none ${
                isActive ? "border-white/50" : "border-white/15 hover:border-white/35"
              }`}
              aria-pressed={isActive}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${info.preview} opacity-90`} />
              {isActive && <div className="absolute inset-0 bg-white/10" />}
              <div className="relative z-10 flex flex-col items-center gap-1 px-5 py-4 text-xs font-medium uppercase tracking-[0.35em]">
                <span>{info.label}</span>
                <span
                  className="h-1 w-8 rounded-full"
                  style={{ background: info.accent }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
