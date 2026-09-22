import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { fmtDate } from "@/lib/api";
import { currentWeekStartISO, shiftWeek } from "@/lib/week";

const weekEndOf = (ws) => {
  const d = new Date(`${ws}T12:00:00`);
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
};

export default function EntriesFilters({ workers, workerId, onWorker, week, onWeek, count, pendingCount, loading }) {
  const base = week || currentWeekStartISO();
  const weekLabel = week ? `Semana ${fmtDate(week)} – ${fmtDate(weekEndOf(week))} · toca para ver todas` : "Todas las semanas · toca para filtrar";
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm space-y-2" data-testid="entries-filters">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-sky-500 shrink-0" />
        <select
          data-testid="entries-worker-filter"
          value={workerId}
          onChange={(e) => onWorker(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Todos los miembros</option>
          {(workers || []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button data-testid="entries-week-prev" onClick={() => onWeek(shiftWeek(base, -1))} className="p-2 rounded-lg hover:bg-slate-100 active:scale-95 transition"><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
        <button
          data-testid="entries-week-label"
          onClick={() => onWeek(week ? "" : currentWeekStartISO())}
          className={`flex-1 text-xs font-bold rounded-xl py-2 transition-colors ${week ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          {weekLabel}
        </button>
        <button data-testid="entries-week-next" onClick={() => onWeek(shiftWeek(base, 1))} className="p-2 rounded-lg hover:bg-slate-100 active:scale-95 transition"><ChevronRight className="w-4 h-4 text-slate-600" /></button>
      </div>
      {!loading && (
        <p className="text-[11px] text-slate-400 text-center" data-testid="entries-count">{count} registro(s) · {pendingCount} sin revisar</p>
      )}
    </div>
  );
}
