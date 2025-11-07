import { useTheme } from "../../context/ThemeContext.jsx";

export default function ThemeToggle() {
  const { availableThemes, theme, setTheme } = useTheme();
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white/70">
      <span>Theme</span>
      <select
        className="rounded-full bg-transparent px-2 py-1 text-white focus:outline-none"
        value={theme}
        onChange={(event) => setTheme(event.target.value)}
      >
        {availableThemes.map((item) => (
          <option key={item} value={item} className="text-slate-900">
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}
