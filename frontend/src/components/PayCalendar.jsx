import { useState } from "react";
import { ChevronLeft, ChevronRight, Banknote } from "lucide-react";
import { toISODate } from "@/lib/week";

const DOW = ["L", "M", "X", "J", "V", "S", "D"];

export default function PayCalendar({ weekStart, weekEnd, payday }) {
  const today = toISODate(new Date());
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const shift = (n) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));

  const year = month.getFullYear();
  const mon = month.getMonth();
  const first = new Date(year, mon, 1);
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toISODate(new Date(year, mon, d)));

  const title = month.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  return (
    <div data-testid="payment-calendar-grid" className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <button data-testid="calendar-prev-month" onClick={() => shift(-1)} className="p-2 rounded-lg hover:bg-slate-100 active:scale-95 transition">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <span className="font-bold text-slate-800 capitalize text-sm">{title}</span>
        <button data-testid="calendar-next-month" onClick={() => shift(1)} className="p-2 rounded-lg hover:bg-slate-100 active:scale-95 transition">
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {DOW.map((d) => (
          <div key={d} className="text-[10px] font-bold text-slate-400 uppercase py-1">{d}</div>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <div key={`x-${i}`} />;
          const inCycle = iso >= weekStart && iso <= weekEnd;
          const isPayday = iso === payday;
          const isToday = iso === today;
          return (
            <div
              key={iso}
              data-testid={isPayday ? "calendar-payday" : inCycle ? `calendar-cycle-day` : `calendar-day`}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-semibold relative ${
                isPayday
                  ? "bg-amber-400 text-amber-950"
                  : inCycle
                  ? "bg-sky-100 text-sky-700"
                  : "text-slate-500"
              } ${isToday ? "ring-2 ring-sky-500 ring-offset-1" : ""}`}
            >
              {Number(iso.slice(-2))}
              {isPayday && <Banknote className="w-3 h-3 mt-0.5" />}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 mt-4 text-[11px] text-slate-500 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-sky-100 border border-sky-300" /> Días que cuentan (Mié–Mar)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-400" /> Día de pago (Lunes)
        </span>
      </div>
    </div>
  );
}
