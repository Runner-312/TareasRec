import { Trophy } from "lucide-react";
import RankingList from "@/components/RankingList";

export default function RankSection({ data, userId }) {
  return (
    <section className="fade-up">
      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-amber-500" /> Rankings
      </h2>
      <h3 className="text-sm font-bold text-slate-700 mb-2">Ranking de la semana</h3>
      <p className="text-[11px] text-slate-400 mb-2">Define los bonos: 1ro +30%, 2do +20%, 3ro +10%.</p>
      <RankingList items={data.weekly} testId="employee-weekly-ranking" highlightId={userId} />
      <h3 className="text-sm font-bold text-slate-700 mt-5 mb-2">Ranking global (histórico)</h3>
      <p className="text-[11px] text-slate-400 mb-2">Horas totales desde el inicio, incluyendo meses anteriores. Sin premios.</p>
      <RankingList items={data.global} testId="employee-global-ranking" highlightId={userId} />
    </section>
  );
}
