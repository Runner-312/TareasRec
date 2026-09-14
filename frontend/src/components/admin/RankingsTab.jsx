import { useQuery } from "@tanstack/react-query";
import { Trophy, Globe } from "lucide-react";
import api from "@/lib/api";
import RankingList from "@/components/RankingList";

export default function RankingsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["rankings"],
    queryFn: () => api.get("/admin/rankings").then((r) => r.data),
  });

  if (isLoading) return <p className="text-center text-slate-400 py-10 text-sm">Cargando rankings…</p>;

  return (
    <div className="space-y-6 fade-up">
      <section>
        <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" /> Ranking semanal
        </h3>
        <p className="text-xs text-slate-400 mb-3">Los 3 primeros reciben bono: 1ro +30%, 2do +20%, 3ro +10%.</p>
        <RankingList items={data.weekly} testId="weekly-ranking-list" />
      </section>
      <section>
        <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
          <Globe className="w-5 h-5 text-sky-500" /> Ranking global (histórico)
        </h3>
        <p className="text-xs text-slate-400 mb-3">Horas totales de todo el tiempo, incluyendo las horas históricas cargadas. Sin premios.</p>
        <RankingList items={data.global} testId="global-ranking-list" />
      </section>
    </div>
  );
}
