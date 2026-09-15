import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Delete, Video } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/App";
import ThemeToggle from "@/components/ThemeToggle";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const doLogin = useCallback(async (code) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { code });
      login(data.token, data.user);
      toast.success(`¡Bienvenido, ${data.user.name}!`);
      navigate(data.user.role === "admin" ? "/admin" : "/panel", { replace: true });
    } catch (e) {
      setError(true);
      toast.error(e.response?.data?.detail || "Código incorrecto");
      setTimeout(() => {
        setPin("");
        setError(false);
      }, 450);
    } finally {
      setLoading(false);
    }
  }, [login, navigate]);

  const press = (k) => {
    if (loading) return;
    if (k === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (!k || pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) doLogin(next);
  };

  return (
    <div className="min-h-screen bg-[#0B132B] flex flex-col items-center justify-center px-6 py-10 relative">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="fade-up flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/30 mb-4">
          <Video className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight" data-testid="login-title">TareasREC</h1>
        <p className="text-sm text-slate-400 mt-1 font-medium">Ingresa tu código de 4 dígitos</p>
      </div>

      <div className={`flex gap-4 mb-10 ${error ? "pin-shake" : ""}`} data-testid="pin-dots">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            data-testid={`pin-dot-${i}`}
            className={`w-4 h-4 rounded-full transition-all duration-200 ${
              pin.length > i ? "bg-sky-400 scale-110" : "bg-slate-700"
            } ${error ? "bg-red-400" : ""}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-xs" data-testid="pin-keypad">
        {KEYS.map((k, i) =>
          k === "" ? (
            <div key={`empty-${i}`} />
          ) : (
            <button
              key={k}
              data-testid={k === "del" ? "pin-key-delete" : `pin-key-${k}`}
              onClick={() => press(k)}
              className="h-16 rounded-2xl bg-[#1C2541] text-white text-2xl font-bold font-mono hover:bg-[#26325a] active:scale-95 transition-all duration-150 flex items-center justify-center border border-slate-700/50"
            >
              {k === "del" ? <Delete className="w-6 h-6" /> : k}
            </button>
          )
        )}
      </div>

      <p className="text-xs text-slate-500 mt-10 text-center max-w-xs">
        ¿No tienes código? Pídele a Wuilber que te asigne uno.
      </p>
    </div>
  );
}
