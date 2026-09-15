import { Target, PartyPopper } from "lucide-react";

export default function GoalCard({ week: w, name }) {
  const progress = Math.min(100, Math.round((w.minutes / w.goal_minutes) * 100));
  const remH = Math.floor(w.remaining_minutes / 60);
  const remM = w.remaining_minutes % 60;
  const remaining = remH > 0 || remM > 0 ? `faltan ${remH > 0 ? `${remH} h ` : ""}${remM} min` : "falta muy poco";

  return (
    <section className="fade-up bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
        <Target className="w-5 h-5 text-sky-500" /> Meta semanal: 10 horas
      </h2>
      <div className="mt-4 h-3.5 bg-slate-100 rounded-full overflow-hidden" data-testid="goal-progress-bar">
        <div
          className={`h-full rounded-full transition-all duration-700 ${w.qualifies ? "bg-emerald-500" : "bg-sky-500"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs font-bold text-slate-500 mt-2 text-right">{progress}%</p>
      {w.qualifies ? (
        <div className="mt-3 flex items-start gap-2.5 bg-emerald-50 rounded-xl p-3.5" data-testid="motivation-success">
          <PartyPopper className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-emerald-800">
            ¡Felicidades, {name}! Superaste las 10 horas esta semana. Tu pago está activado{w.bonus_pct > 0 ? ` y llevas un bono del ${Math.round(w.bonus_pct * 100)}% por tu puesto en el ranking` : ""}. ¡Sigue así!
          </p>
        </div>
      ) : (
        <div className="mt-3 flex items-start gap-2.5 bg-sky-50 rounded-xl p-3.5" data-testid="motivation-pending">
          <Target className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-sky-800">
            ¡Vas muy bien, {name}! Te {remaining} para alcanzar las 10 horas y activar tu pago del martes. ¡Tú puedes lograrlo!
          </p>
        </div>
      )}
    </section>
  );
}
