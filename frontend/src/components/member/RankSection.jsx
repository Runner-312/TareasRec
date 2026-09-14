import { Trophy } from "lucide-react";
import RankingList from "@/components/RankingList";

export default function RankSection({ data, userId }) {
  const w = data.week;
  return (
    <section className="fade-up">
      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-amber-500" /> Tu posición
      </h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center" data-testid="my-weekly-rank">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Ranking semanal</p>
          <p className="font-mono text-3xl font-extrabold text-sky-600">{w.rank ? `#${w.rank}` : "—"}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center" data-testid="my-global-rank">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Ranking global</p>
          <p className="font-mono text-3xl font-extrabold text-slate-800">{data.global_rank ? `#${data.global_rank}` : "—"}</p>
        </div>
      </div>
      <h3 className="text-sm font-bold text-slate-700 mb-2">Ranking de la semana</h3>
      <RankingList items={data.weekly} testId="employee-weekly-ranking" highlightId={userId} />
      <h3 className="text-sm font-bold text-slate-700 mt-5 mb-2">Ranking global</h3>
      <RankingList items={data.global} testId="employee-global-ranking" highlightId={userId} />
    </section>
  );
}
