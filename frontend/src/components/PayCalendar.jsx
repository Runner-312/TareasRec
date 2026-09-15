import { useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { toISODate, shiftWeek } from "@/lib/week";
import { fmtDate } from "@/lib/api";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const DOW = ["L", "M", "X", "J", "V", "S", "D"];

const monthOf = (iso) => {
  const d = new Date(`${iso}T12:00:00`);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

function describeDay(iso, weeks, minutes, reviewed) {
  const payKgen = weeks.find((w) => w.kgen_payday === iso);
  const payBonus = weeks.find((w) => w.bonus_payday === iso);
  const cycle = weeks.find((w) => iso >= w.start && iso <= w.end);
  const tone = cycle ? (cycle.status === "current" ? "cycle" : cycle.status === "future" ? "future" : "past") : "none";
  const extra = payBonus
    ? ` Martes de BONO: aquí se paga el bono ($0.30/h) de la semana ${fmtDate(payBonus.start)} – ${fmtDate(payBonus.end)}${payBonus.paid ? " (ya pagado)" : payBonus.closed && !payBonus.qualifies ? " (no se alcanzaron las 10 h)" : ""}.`
    : payKgen
    ? ` Lunes de KGEN: KGEN paga lo grabado la semana ${fmtDate(payKgen.start)} – ${fmtDate(payKgen.end)}.`
    : "";
  const base = { tone, minutes, reviewed };
  if (!cycle) return { ...base, title: payBonus ? "Martes: pago del bono" : payKgen ? "Lunes: pago de KGEN" : "Día sin actividad", text: extra.trim() || "Este día no forma parte de ninguna semana registrada." };
  const range = `${fmtDate(cycle.start)} – ${fmtDate(cycle.end)}`;
  if (tone === "current") return { ...base, title: "Semana en curso", text: `Cuenta para la semana ${range}. KGEN paga el lunes ${fmtDate(cycle.kgen_payday)} y el bono el martes ${fmtDate(cycle.bonus_payday)}.${extra}` };
  if (tone === "future") return { ...base, title: "Próxima semana", text: `Semana ${range}. KGEN pagará el lunes ${fmtDate(cycle.kgen_payday)} y el bono el martes ${fmtDate(cycle.bonus_payday)}.${extra}` };
  return { ...base, title: "Semana pasada", text: `Semana ${range}${cycle.paid ? " · bono pagado" : cycle.qualifies ? ` · bono se paga el martes ${fmtDate(cycle.bonus_payday)}` : " · no se alcanzaron las 10 h"}.${extra}` };
}

const TONE = {
  cycle: "bg-sky-500 text-white dark:bg-sky-600",
  past: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200",
  future: "bg-sky-50 text-sky-400 border border-dashed border-sky-200 dark:bg-sky-950/30 dark:border-sky-800",
  none: "text-slate-500",
};

const TONE_DOT = {
  cycle: "bg-sky-500", past: "bg-sky-100 border border-sky-300", future: "bg-sky-50 border border-dashed border-sky-300",
};

const COLUMN_TABS = { 0: { label: "KGEN", cls: "border-emerald-400 bg-emerald-400 text-emerald-950", testId: "calendar-kgen-column" }, 1: { label: "BONO", cls: "border-amber-400 bg-amber-400 text-amber-950", testId: "calendar-bono-column" } };
const colStyle = (i) => ({ left: `calc(${i} * (100% - 6 * 0.25rem) / 7 + ${i} * 0.25rem - 3px)`, width: "calc((100% - 6 * 0.25rem) / 7 + 6px)" });

export default function PayCalendar({ weeks = [], dayMinutes = {}, dayReviewed = [], currentWeekStart }) {
  const today = toISODate(new Date());
  const [focusWeek, setFocusWeek] = useState(currentWeekStart);
  const [month, setMonth] = useState(() => monthOf(currentWeekStart));
  const [open, setOpen] = useState(null);

  const moveWeek = (n) => {
    const next = shiftWeek(focusWeek, n);
    setFocusWeek(next);
    setMonth(monthOf(next));
  };
  const focusEnd = weeks.find((w) => w.start === focusWeek)?.end || shiftWeek(focusWeek, 0).replace(/(\d{4}-\d{2}-)(\d{2})$/, (_, p, d) => {
    const dt = new Date(`${focusWeek}T12:00:00`);
    dt.setDate(dt.getDate() + 6);
    return toISODate(dt);
  });
  const focus = { start: focusWeek };

  const year = month.getFullYear();
  const mon = month.getMonth();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const lead = (new Date(year, mon, 1).getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toISODate(new Date(year, mon, d)));
  const title = month.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  return (
    <div data-testid="payment-calendar-grid" className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <button data-testid="calendar-prev-month" onClick={() => setMonth(new Date(year, mon - 1, 1))} className="p-2 rounded-lg hover:bg-slate-100 active:scale-95 transition">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <span className="font-bold text-slate-800 capitalize text-sm">{title}</span>
        <button data-testid="calendar-next-month" onClick={() => setMonth(new Date(year, mon + 1, 1))} className="p-2 rounded-lg hover:bg-slate-100 active:scale-95 transition">
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>
      <div className="flex items-center justify-between mb-3 bg-slate-50 rounded-xl px-2 py-1.5">
        <button data-testid="calendar-prev-week" onClick={() => moveWeek(-1)} className="text-[11px] font-bold text-sky-600 px-2 py-1 rounded-lg hover:bg-sky-50 active:scale-95 transition">← Semana</button>
        <span className="text-[11px] font-bold text-slate-600" data-testid="calendar-focus-week">
          Mié {fmtDate(focus.start)}{focusEnd ? ` – Mar ${fmtDate(focusEnd)}` : ""}
        </span>
        <button data-testid="calendar-next-week" onClick={() => moveWeek(1)} className="text-[11px] font-bold text-sky-600 px-2 py-1 rounded-lg hover:bg-sky-50 active:scale-95 transition">Semana →</button>
      </div>

      <div className="relative pt-1">
        {[0, 1].map((i) => (
          <div key={i} data-testid={COLUMN_TABS[i].testId} className={`absolute top-0 bottom-0 rounded-lg border-2 pointer-events-none ${COLUMN_TABS[i].cls.split(" ")[0]}`} style={colStyle(i)}>
            <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-extrabold tracking-wider px-1.5 py-0.5 rounded-md leading-none ${COLUMN_TABS[i].cls}`}>{COLUMN_TABS[i].label}</span>
          </div>
        ))}
      <div className="grid grid-cols-7 gap-1 text-center pt-1.5 pb-1">
        {DOW.map((d) => (
          <div key={d} className="text-[10px] font-bold text-slate-400 uppercase py-1">{d}</div>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <div key={`x-${i}`} />;
          const info = describeDay(iso, weeks, dayMinutes[iso], dayReviewed.includes(iso));
          const isToday = iso === today;
          const inFocus = focusEnd && iso >= focus.start && iso <= focusEnd;
          return (
            <Popover key={iso} open={open === iso} onOpenChange={(o) => setOpen(o ? iso : null)}>
              <PopoverTrigger asChild>
                <button
                  data-testid={`calendar-day-${iso}`}
                  data-tone={info.tone}
                  className={`aspect-square w-full flex flex-col items-center justify-center rounded-lg text-xs font-semibold relative leading-none transition-transform active:scale-95 ${TONE[info.tone]} ${
                    isToday ? "ring-2 ring-sky-500 ring-offset-1 dark:ring-offset-slate-900" : ""
                  } ${inFocus && !isToday ? "outline outline-1 outline-sky-400/60" : ""}`}
                >
                  <span>{Number(iso.slice(-2))}</span>
                  {info.minutes ? (
                    <span data-testid={`calendar-minutes-${iso}`} className="text-[8px] font-mono font-bold opacity-70 mt-0.5 flex items-center gap-0.5">
                      {info.minutes}m{info.reviewed && <Check data-testid={`calendar-reviewed-${iso}`} className="w-2 h-2" strokeWidth={3} />}
                    </span>
                  ) : null}
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" className="w-60 rounded-xl p-3 bg-[#0B132B] text-white border-none shadow-xl" data-testid="calendar-day-popover">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-3 h-3 rounded ${TONE_DOT[info.tone] || "bg-slate-500"}`} />
                  <p className="text-xs font-bold">{info.title}</p>
                </div>
                <p className="text-[11px] text-slate-300 capitalize">{new Date(`${iso}T12:00:00`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</p>
                <p className="text-[11px] text-slate-300 mt-1">{info.text}</p>
                <p className="text-[11px] mt-2 font-mono font-bold text-sky-300">
                  {info.minutes ? `Grabaste ${info.minutes} min este día${info.reviewed ? " · revisado ✓" : ""}` : "Sin minutos registrados este día"}
                </p>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-4 text-[11px] text-slate-500 font-medium" data-testid="calendar-legend">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-sky-500" /> Semana en curso (Mié–Mar)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-sky-100 border border-sky-300" /> Semanas pasadas</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-sky-50 border border-dashed border-sky-300" /> Próxima semana</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-emerald-400" /> Columna KGEN: lunes de pago</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-amber-400" /> Columna BONO: martes de pago</span>
        <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-sky-600" strokeWidth={3} /> Registro revisado por Wuilber</span>
      </div>
    </div>
  );
}
