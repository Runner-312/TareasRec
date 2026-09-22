import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, Banknote } from "lucide-react";
import { toISODate, shiftWeek, todayCaracasISO } from "@/lib/week";
import { fmtDate } from "@/lib/api";
import DayCell from "@/components/calendar/DayCell";
import { describeDay } from "@/components/calendar/describeDay";

const DOW = ["L", "M", "X", "J", "V", "S", "D"];
const COLUMN_TABS = [
  { label: "KGEN", border: "border-emerald-400", tab: "bg-emerald-400 text-emerald-950", testId: "calendar-kgen-column" },
  { label: "BONO", border: "border-amber-400", tab: "bg-amber-400 text-amber-950", testId: "calendar-bono-column" },
];
const LEGEND = [
  { swatch: <span className="w-3 h-3 rounded bg-sky-500" />, text: "Semana en curso (los días pasados se aclaran)" },
  { swatch: <span className="w-3 h-3 rounded bg-sky-100 border border-sky-300" />, text: "Semanas pasadas" },
  { swatch: <span className="w-3 h-3 rounded bg-sky-50 border border-dashed border-sky-300" />, text: "Próxima semana" },
  { swatch: <span className="w-3 h-3 rounded border-2 border-emerald-400" />, text: "Columna KGEN: lunes de pago" },
  { swatch: <span className="w-3 h-3 rounded border-2 border-amber-400" />, text: "Columna BONO: martes de pago" },
  { swatch: <Check className="w-3 h-3 text-sky-600" strokeWidth={3} />, text: "Registro revisado por Wuilber" },
  { swatch: <Banknote className="w-3 h-3 text-emerald-500" />, text: "Próximo día de pago" },
];

const monthOf = (iso) => {
  const d = new Date(`${iso}T12:00:00`);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};
const addDays = (iso, n) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return toISODate(d);
};
const colStyle = (i) => ({ left: `calc(${i} * (100% - 6 * 0.25rem) / 7 + ${i} * 0.25rem - 3px)`, width: "calc((100% - 6 * 0.25rem) / 7 + 6px)" });

const monthCells = (month) => {
  const year = month.getFullYear();
  const mon = month.getMonth();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const lead = (new Date(year, mon, 1).getDay() + 6) % 7;
  const cells = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toISODate(new Date(year, mon, d)));
  return cells;
};

function ColumnFrames() {
  return COLUMN_TABS.map((c, i) => (
    <div key={c.label} data-testid={c.testId} className={`absolute top-0 bottom-0 rounded-lg border-2 pointer-events-none ${c.border}`} style={colStyle(i)}>
      <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-extrabold tracking-wider px-1.5 py-0.5 rounded-md leading-none ${c.tab}`}>{c.label}</span>
    </div>
  ));
}

export default function PayCalendar({ weeks = [], dayMinutes = {}, dayReviewed = [], currentWeekStart }) {
  const today = todayCaracasISO();
  const [focusWeek, setFocusWeek] = useState(currentWeekStart);
  const [month, setMonth] = useState(() => monthOf(currentWeekStart));
  const [open, setOpen] = useState(null);
  const [anim, setAnim] = useState(0);
  const focusEnd = addDays(focusWeek, 6);

  const moveWeek = (n) => {
    const next = shiftWeek(focusWeek, n);
    setFocusWeek(next);
    setMonth(monthOf(next));
    setAnim((a) => a + 1);
  };
  const moveMonth = (n) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  const title = month.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  return (
    <div data-testid="payment-calendar-grid" className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <button data-testid="calendar-prev-month" onClick={() => moveMonth(-1)} className="p-2 rounded-lg hover:bg-slate-100 active:scale-95 transition"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
        <span className="font-bold text-slate-800 capitalize text-sm">{title}</span>
        <button data-testid="calendar-next-month" onClick={() => moveMonth(1)} className="p-2 rounded-lg hover:bg-slate-100 active:scale-95 transition"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
      </div>
      <div className="flex items-center justify-between mb-3 bg-slate-50 rounded-xl px-2 py-1.5">
        <button data-testid="calendar-prev-week" onClick={() => moveWeek(-1)} className="text-[11px] font-bold text-sky-600 px-2 py-1 rounded-lg hover:bg-sky-50 active:scale-95 transition">← Semana</button>
        <span className="text-[11px] font-bold text-slate-600" data-testid="calendar-focus-week">Mié {fmtDate(focusWeek)} – Mar {fmtDate(focusEnd)}</span>
        <button data-testid="calendar-next-week" onClick={() => moveWeek(1)} className="text-[11px] font-bold text-sky-600 px-2 py-1 rounded-lg hover:bg-sky-50 active:scale-95 transition">Semana →</button>
      </div>

      <div className="relative pt-1">
        <ColumnFrames />
        <div className="grid grid-cols-7 gap-1 text-center pt-1.5 pb-1">
          {DOW.map((d) => <div key={d} className="text-[10px] font-bold text-slate-400 uppercase py-1">{d}</div>)}
          {monthCells(month).map((iso, i) =>
            iso ? (
              <DayCell
                key={iso}
                iso={iso}
                today={today}
                info={describeDay(iso, weeks, dayMinutes[iso], dayReviewed.includes(iso), today)}
                focusStart={focusWeek}
                inFocus={iso >= focusWeek && iso <= focusEnd}
                anim={anim}
                open={open === iso}
                onOpenChange={(o) => setOpen(o ? iso : null)}
              />
            ) : (
              <div key={`pad-${i}`} />
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-4 text-[11px] text-slate-500 font-medium" data-testid="calendar-legend">
        {LEGEND.map((l) => <span key={l.text} className="flex items-center gap-1.5">{l.swatch} {l.text}</span>)}
      </div>
    </div>
  );
}
