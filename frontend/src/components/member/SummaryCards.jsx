import { Clock, Wallet, History, Gift } from "lucide-react";
import { fmtMoney, fmtMinutes } from "@/lib/api";

export default function SummaryCards({ week: w, rates, estimate, globalMinutes, historicalMinutes }) {
  const bonusShown = w.qualifies ? w.estimated_total : estimate.bonus_if_goal;
  return (
    <section className="fade-up">
      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3">Tus horas y tu saldo</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0B132B] rounded-2xl p-4" data-testid="employee-hours-card">
          <Clock className="w-5 h-5 text-sky-400 mb-2" />
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Horas esta semana</p>
          <p className="font-mono text-xl font-bold text-sky-400">{w.hours} h</p>
          <p className="text-[11px] text-slate-500">{fmtMinutes(w.minutes)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm" data-testid="employee-kgen-card">
          <Wallet className="w-5 h-5 text-emerald-500 mb-2" />
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">KGEN · lunes</p>
          <p className="font-mono text-xl font-bold text-emerald-600" data-testid="employee-kgen-amount">{fmtMoney(estimate.kgen)}</p>
          <p className="text-[11px] text-slate-400">{w.hours} h × {fmtMoney(rates.kgen_rate)}/h</p>
        </div>
        <div className={`col-span-2 rounded-2xl p-4 border shadow-sm flex items-center gap-3 ${w.qualifies ? "bg-amber-50 border-amber-200" : "bg-white border-slate-100"}`} data-testid="employee-balance-card">
          <Gift className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">BONO · martes {w.qualifies ? "" : "(estimado)"}</p>
            <p className="text-[11px] text-slate-400">
              {w.qualifies
                ? w.bonus > 0
                  ? `${w.hours} h × ${fmtMoney(rates.bonus_rate)}/h + ${Math.round(w.bonus_pct * 100)}% por tu puesto`
                  : `${w.hours} h × ${fmtMoney(rates.bonus_rate)}/h · ¡meta superada!`
                : `${w.hours} h × ${fmtMoney(rates.bonus_rate)}/h · se activa al superar 10 h`}
            </p>
          </div>
          <p className={`font-mono text-xl font-bold ${w.qualifies ? "text-amber-600" : "text-slate-500"}`} data-testid="employee-bonus-amount">{fmtMoney(bonusShown)}</p>
        </div>
        <div className="col-span-2 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3" data-testid="employee-total-hours-card">
          <History className="w-5 h-5 text-slate-500 shrink-0" />
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Horas totales (histórico)</p>
            <p className="text-[11px] text-slate-400">{historicalMinutes > 0 ? `Incluye ${fmtMinutes(historicalMinutes)} de meses anteriores` : "Todo lo que has grabado desde que empezaste"}</p>
          </div>
          <p className="font-mono text-xl font-bold text-slate-800">{Math.round((globalMinutes / 60) * 100) / 100} h</p>
        </div>
      </div>
    </section>
  );
}
