import { quoteFor } from "@/lib/quotes";

export default function GoalCard({ week: w, userId, todayISO }) {
  const progress = Math.min(100, Math.round((w.minutes / w.goal_minutes) * 100));
  const remH = Math.floor(w.remaining_minutes / 60);
  const remM = w.remaining_minutes % 60;
  const quote = quoteFor(userId || "x", todayISO);
  return (
    <section className="fade-up px-1" data-testid="goal-section">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
        <span>Meta semanal · 10 h</span>
        <span data-testid="goal-progress-label">
          {w.qualifies ? "¡Meta superada!" : `Faltan ${remH > 0 ? `${remH} h ` : ""}${remM} min`} · <span className="font-mono font-bold text-slate-700">{progress}%</span>
        </span>
      </div>
      <div className="h-1 w-full bg-slate-200/80 rounded-full overflow-hidden" data-testid="goal-progress-bar">
        <div className={`h-full rounded-full transition-all duration-700 ${w.qualifies ? "bg-emerald-500" : "bg-sky-500"}`} style={{ width: `${progress}%` }} />
      </div>
      <figure className="mt-5 text-center px-4" data-testid="daily-quote">
        <blockquote className="text-sm italic font-light text-slate-900 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          “{quote.q}”
        </blockquote>
        <figcaption className="mt-1.5 text-xs font-bold text-amber-500" data-testid="daily-quote-author">— {quote.a}</figcaption>
      </figure>
    </section>
  );
}
