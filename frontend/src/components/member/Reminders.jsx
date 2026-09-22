import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlarmClock, Send, Check } from "lucide-react";
import { toast } from "sonner";
import api, { fmtDate } from "@/lib/api";
import { caracasNow } from "@/lib/week";

const pad = (n) => String(n).padStart(2, "0");

function DailyCountdown({ registeredToday }) {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    const tick = () => {
      const now = caracasNow();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const ms = midnight - now;
      setLeft(now.getHours() >= 18 ? ms : null);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  if (registeredToday || left === null) return null;
  const h = Math.floor(left / 3600000), m = Math.floor((left % 3600000) / 60000), s = Math.floor((left % 60000) / 1000);
  return (
    <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-300/60 px-3 py-2 text-rose-700 dark:text-rose-300" data-testid="daily-countdown">
      <AlarmClock className="w-4 h-4 shrink-0 animate-pulse" />
      <p className="text-xs font-semibold flex-1">Reporte de hoy pendiente</p>
      <span className="font-mono text-sm font-extrabold tabular-nums" data-testid="daily-countdown-time">{pad(h)}:{pad(m)}:{pad(s)}</span>
    </div>
  );
}

function WeeklyReport({ info }) {
  const qc = useQueryClient();
  const done = useMutation({
    mutationFn: () => api.post("/me/weekly-report-done"),
    onSuccess: () => {
      toast.success("¡Listo! Recordatorio cerrado");
      qc.invalidateQueries({ queryKey: ["my-dashboard"] });
    },
    onError: () => toast.error("No se pudo guardar"),
  });
  if (!info?.due || info.done) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl bg-violet-500/10 border border-violet-300/60 px-3 py-2 text-violet-800 dark:text-violet-200" data-testid="weekly-report-notice">
      <Send className="w-4 h-4 shrink-0" />
      <p className="text-xs font-semibold flex-1 leading-snug">
        Reporte semanal: envía por Telegram a Wuilber la captura de la semana {fmtDate(info.prev_week_start)}–{fmtDate(info.prev_week_end)} y pide tu bono extra.
      </p>
      <button data-testid="weekly-report-done-button" onClick={() => done.mutate()} disabled={done.isPending} className="flex items-center gap-1 text-[11px] font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-2.5 py-1.5 active:scale-95 transition disabled:opacity-50">
        <Check className="w-3 h-3" strokeWidth={3} /> Hecho
      </button>
    </div>
  );
}

export default function Reminders({ registeredToday, weeklyReport }) {
  return (
    <div className="space-y-2" data-testid="reminders">
      <DailyCountdown registeredToday={registeredToday} />
      <WeeklyReport info={weeklyReport} />
    </div>
  );
}
