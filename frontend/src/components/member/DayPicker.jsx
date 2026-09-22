const DOW = ["Mié", "Jue", "Vie", "Sáb", "Dom", "Lun", "Mar"];

const dayClass = ({ active, done, future }) => {
  if (active) return "border-emerald-400 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-400";
  if (done) return "border-emerald-100 bg-emerald-50/60 text-emerald-700";
  if (future) return "border-slate-100 text-slate-300";
  return "border-slate-100 bg-slate-50 text-slate-600";
};

export const dayLabel = (days, iso) => DOW[days.findIndex((d) => d.date === iso)];

export default function DayPicker({ days, dayMinutes, today, selected, onSelect }) {
  return (
    <div className="grid grid-cols-7 gap-1.5" data-testid="entry-day-picker">
      {days.map((d, i) => {
        const future = d.date > today;
        const done = !!dayMinutes[d.date];
        const active = d.date === selected;
        return (
          <button
            key={d.date}
            type="button"
            data-testid={`entry-day-${d.date}`}
            data-selected={active || undefined}
            disabled={future}
            onClick={() => onSelect(d.date)}
            className={`rounded-xl py-2 flex flex-col items-center gap-0.5 border transition-all active:scale-95 ${dayClass({ active, done, future })}`}
          >
            <span className="text-[10px] font-semibold">{DOW[i]}</span>
            <span className="font-mono font-extrabold text-base leading-none">{Number(d.date.slice(-2))}</span>
            <span className="text-[9px] font-mono font-bold h-3">{done ? `${dayMinutes[d.date]}m` : ""}</span>
          </button>
        );
      })}
    </div>
  );
}
