import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const getInitial = () => localStorage.getItem("theme") === "dark";

export default function ThemeToggle() {
  const [dark, setDark] = useState(getInitial);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      data-testid="theme-toggle-button"
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? "Modo claro" : "Modo oscuro"}
      className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
