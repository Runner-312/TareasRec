import { Check, Banknote } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const TONE = {
  cycle: "",
  past: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200",
  future: "bg-sky-50 text-sky-400 border border-dashed border-sky-200 dark:bg-sky-950/30 dark:border-sky-800",
  none: "text-slate-500",
};

const TONE_DOT = {
  cycle: "bg-sky-500",
  past: "bg-sky-100 border border-sky-300",
  future: "bg-sky-50 border border-dashed border-sky-300",
};

const POP = {
  kgen: { cls: "bg-emerald-500 text-white", sub: "text-emerald-50", accent: "text-emerald-100" },
  bonus: { cls: "bg-amber-400 text-amber-950", sub: "text-amber-900", accent: "text-amber-900" },
  default: { cls: "bg-[#0B132B] text-white", sub: "text-slate-300", accent: "text-sky-300" },
};

const daysBetween = (a, b) => Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000);

const cycleStyle = (iso, today) => {
  const ago = daysBetween(iso, today);
  if (ago <= 0) return { className: "bg-sky-500 text-white dark:bg-sky-600", style: undefined };
  const alpha = Math.max(0.42, 1 - ago * 0.11);
  const textClass = alpha < 0.65 ? "text-sky-900 dark:text-sky-100" : "text-white";
  return { className: textClass, style: { backgroundColor: `rgba(14, 165, 233, ${alpha.toFixed(2)})` } };
};

const minutesText = (info) => {
  if (!info.minutes) return "Sin minutos registrados este día";
  return `Grabaste ${info.minutes} min este día${info.reviewed ? " · revisado ✓" : ""}`;
};

export default function DayCell({ iso, info, today, focusStart, inFocus, anim, open, onOpenChange }) {
  const isToday = iso === today;
  const cyc = info.tone === "cycle" ? cycleStyle(iso, today) : null;
  const pop = POP[info.pop] || POP.default;
  const wave = inFocus && anim > 0;
  const style = { ...(cyc?.style || {}) };
  if (wave) style.animationDelay = `${daysBetween(focusStart, iso) * 60}ms`;
  const classes = [
    "aspect-square w-full flex flex-col items-center justify-center rounded-lg text-xs font-semibold relative leading-none transition-transform active:scale-95",
    cyc ? cyc.className : TONE[info.tone],
    isToday ? "ring-2 ring-sky-500 ring-offset-1 dark:ring-offset-slate-900" : "",
    inFocus && !isToday ? "outline outline-1 outline-sky-400/60" : "",
    wave ? "week-wave" : "",
  ].join(" ");
  const longDate = new Date(`${iso}T12:00:00`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          key={wave ? `${iso}-${anim}` : iso}
          data-testid={`calendar-day-${iso}`}
          data-tone={info.tone}
          data-pop={info.pop || undefined}
          data-focus={inFocus ? "true" : undefined}
          style={style}
          className={classes}
        >
          <span>{Number(iso.slice(-2))}</span>
          {info.upcoming && (
            <Banknote data-testid={`calendar-payicon-${iso}`} className={`w-3 h-3 mt-0.5 ${info.pop === "kgen" ? "text-emerald-500" : "text-amber-500"}`} strokeWidth={2.5} />
          )}
          {info.minutes ? (
            <span data-testid={`calendar-minutes-${iso}`} className="text-[8px] font-mono font-bold opacity-70 mt-0.5 flex items-center gap-0.5">
              {info.minutes}m{info.reviewed && <Check data-testid={`calendar-reviewed-${iso}`} className="w-2 h-2" strokeWidth={3} />}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className={`w-60 rounded-xl p-3 border-none shadow-xl ${pop.cls}`} data-testid="calendar-day-popover" data-pop={info.pop || "default"}>
        <div className="flex items-center gap-2 mb-1">
          {info.pop ? <Banknote className="w-4 h-4" /> : <span className={`w-3 h-3 rounded ${TONE_DOT[info.tone] || "bg-slate-500"}`} />}
          <p className="text-xs font-bold">{info.title}</p>
        </div>
        <p className={`text-[11px] capitalize ${pop.sub}`}>{longDate}</p>
        <p className={`text-[11px] mt-1 ${pop.sub}`}>{info.text}</p>
        <p className={`text-[11px] mt-2 font-mono font-bold ${pop.accent}`}>{minutesText(info)}</p>
      </PopoverContent>
    </Popover>
  );
}
