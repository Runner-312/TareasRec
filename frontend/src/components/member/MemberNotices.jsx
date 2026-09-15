import { Flame, Wallet } from "lucide-react";

export default function MemberNotices({ streak, binancePayId }) {
  return (
    <div className="space-y-3 fade-up">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3" data-testid="streak-card">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${streak > 0 ? "bg-orange-100" : "bg-slate-100"}`}>
          <Flame className={`w-6 h-6 ${streak > 0 ? "text-orange-500" : "text-slate-400"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Racha diaria</p>
          <p className="font-bold text-sm text-slate-800" data-testid="streak-value">
            {streak > 0 ? `${streak} ${streak === 1 ? "día seguido" : "días seguidos"} registrando` : "Sin racha activa"}
          </p>
          <p className="text-[11px] text-slate-400">
            {streak >= 7 ? "¡Imparable! Una semana completa sin fallar." : streak > 0 ? "Registra hoy para mantenerla viva." : "Registra tus minutos hoy y empieza una racha."}
          </p>
        </div>
      </div>

      {!binancePayId && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3" data-testid="binance-missing-notice">
          <Wallet className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-amber-800">Falta tu Binance Pay ID</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Aún no tenemos tu Binance Pay ID para pagarte el bono. Envíaselo a Wuilber para que lo registre y tus pagos lleguen sin retrasos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
