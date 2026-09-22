import { useCallback, useEffect, useState } from "react";
import { BarChart3, Clock3, Delete, ShieldCheck, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/App";
import ThemeToggle from "@/components/ThemeToggle";
import FlyingBills from "@/components/FlyingBills";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];
const BENEFITS = [
  { icon: Clock3, title: "Registra en segundos", copy: "Guarda tus minutos y la captura del día." },
  { icon: BarChart3, title: "Sigue tu avance", copy: "Consulta horas, meta semanal y posición." },
  { icon: ShieldCheck, title: "Acceso seguro", copy: "Tu código personal protege tu información." },
];

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
      }, 500);
    } finally {
      setLoading(false);
    }
  }, [login, navigate]);

  const press = useCallback((key) => {
    if (loading || error) return;
    if (key === "del") {
      setPin((current) => current.slice(0, -1));
      return;
    }
    if (!key || pin.length >= 4) return;
    const next = pin + key;
    setPin(next);
    if (next.length === 4) doLogin(next);
  }, [doLogin, error, loading, pin]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (/^\d$/.test(event.key)) press(event.key);
      if (event.key === "Backspace" || event.key === "Delete") press("del");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [press]);

  return (
    <div className="min-h-screen bg-[#0B132B] relative overflow-hidden">
      <FlyingBills />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(14,165,233,0.16),transparent_32%),radial-gradient(circle_at_82%_78%,rgba(16,185,129,0.1),transparent_28%)]" />
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20"><ThemeToggle /></div>

      <main className="relative z-10 min-h-screen max-w-6xl mx-auto px-5 sm:px-8 py-6 lg:py-10 grid lg:grid-cols-[1.1fr_0.9fr] items-center gap-12">
        <section className="hidden lg:block max-w-xl fade-up" aria-label="Información de TareasREC">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3.5 py-2 text-xs font-bold text-sky-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Gestión de grabaciones
          </div>
          <h1 className="mt-6 text-6xl font-extrabold tracking-tight text-white leading-[1.02]">
            Registra. Avanza.<br /><span className="text-sky-400">Cobra.</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-300 max-w-lg">
            Todo tu trabajo, tus metas y tus pagos en un solo lugar. Claro para el equipo, simple para administrar.
          </p>
          <div className="mt-10 grid gap-4">
            {BENEFITS.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="text-sm text-slate-400">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="w-full max-w-sm mx-auto lg:max-w-md fade-up" aria-labelledby="login-title">
          <div className="rounded-[28px] border border-white/10 bg-[#111B35]/90 shadow-2xl shadow-black/20 backdrop-blur-xl px-5 py-6 sm:px-9 sm:py-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
                <Video className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.24em] text-sky-400">Acceso del equipo</p>
              <h2 id="login-title" className="mt-1 text-3xl font-extrabold text-white tracking-tight" data-testid="login-title">TareasREC</h2>
              <p className="text-sm text-slate-400 mt-1">Ingresa tu código personal de 4 dígitos</p>
            </div>

            <div
              className={`flex justify-center gap-4 my-7 ${error ? "pin-shake" : ""}`}
              data-testid="pin-dots"
              role="status"
              aria-live="polite"
              aria-label={error ? "Código incorrecto" : `${pin.length} de 4 dígitos ingresados`}
            >
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  data-testid={`pin-dot-${i}`}
                  className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                    pin.length > i ? "bg-sky-400 border-sky-400 scale-110 shadow-[0_0_0_4px_rgba(56,189,248,0.12)]" : "bg-slate-800 border-slate-600"
                  } ${error ? "!bg-red-400 !border-red-400" : ""}`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-3" data-testid="pin-keypad" aria-busy={loading}>
              {KEYS.map((key, index) => key === "" ? (
                <div key={`empty-${index}`} aria-hidden="true" />
              ) : (
                <button
                  key={key}
                  type="button"
                  data-testid={key === "del" ? "pin-key-delete" : `pin-key-${key}`}
                  onClick={() => press(key)}
                  disabled={loading || error}
                  aria-label={key === "del" ? "Borrar último dígito" : `Dígito ${key}`}
                  className="h-14 sm:h-16 rounded-2xl bg-[#1B284D] text-white text-xl sm:text-2xl font-bold font-mono hover:bg-[#24355f] focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111B35] active:scale-95 transition-all duration-150 flex items-center justify-center border border-white/[0.06] disabled:opacity-60"
                >
                  {key === "del" ? <Delete className="w-5 h-5 sm:w-6 sm:h-6" /> : key}
                </button>
              ))}
            </div>

            <div className="mt-5 min-h-5 text-center" aria-live="polite">
              {loading ? (
                <p className="text-xs font-semibold text-sky-300">Verificando acceso…</p>
              ) : error ? (
                <p className="text-xs font-semibold text-red-300">Código incorrecto. Inténtalo de nuevo.</p>
              ) : (
                <p className="text-xs text-slate-500">También puedes usar el teclado numérico.</p>
              )}
            </div>
          </div>
          <p className="mt-5 text-center text-xs text-slate-500">
            ¿Necesitas ayuda con tu código? Contacta al administrador.
          </p>
        </section>
      </main>
    </div>
  );
}
