import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, CheckCircle2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import api, { fmtMoney, fmtMinutes, fmtDate } from "@/lib/api";
import { currentWeekStartISO, shiftWeek } from "@/lib/week";
import WeekChart from "@/components/WeekChart";

const bonusLabel = (rank) => (rank === 1 ? "+30%" : rank === 2 ? "+20%" : rank === 3 ? "+10%" : null);

export default function StatsTab() {
  const [ws, setWs] = useState(currentWeekStartISO());
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["week", ws],
    queryFn: () => api.get("/admin/week", { params: { start: ws } }).then((r) => r.data),
  });

  const togglePaid = useMutation({
    mutationFn: (row) =>
      row.paid
        ? api.delete("/admin/payments", { params: { worker_id: row.id, week_start: ws } })
        : api.post("/admin/payments", { worker_id: row.id, week_start: ws }),
    onSuccess: (_, row) => {
      toast.success(row.paid ? "Pago revertido" : "Pago marcado");
      qc.invalidateQueries({ queryKey: ["week"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
    },
    onError: () => toast.error("No se pudo actualizar el pago"),
  });

  return (
    <div className="space-y-5 fade-up">
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 p-2 shadow-sm">
        <button data-testid="prev-week-button" onClick={() => setWs(shiftWeek(ws, -1))} className="flex items-center gap-1 text-xs font-bold text-sky-600 px-3 py-2 rounded-xl hover:bg-sky-50 active:scale-95 transition-all">
          <ChevronLeft className="w-4 h-4" /> Anterior
        </button>
        <div className="text-center">
          <p className="text-xs font-bold text-slate-800" data-testid="week-range-label">
            {data ? `${fmtDate(data.week_start)} – ${fmtDate(data.week_end)}` : "…"}
          </p>
          {data?.is_current && <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">Semana actual</span>}
        </div>
        <button
          data-testid="next-week-button"
          onClick={() => setWs(shiftWeek(ws, 1))}
          disabled={data?.is_current}
          className="flex items-center gap-1 text-xs font-bold text-sky-600 px-3 py-2 rounded-xl hover:bg-sky-50 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          Siguiente <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {isLoading || !data ? (
        <p className="text-center text-slate-400 py-10 text-sm">Cargando estadísticas…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3" data-testid="week-stats-cards">
            <Stat label="Minutos totales" value={fmtMinutes(data.totals.minutes)} mono />
            <Stat label="Promedio diario" value={fmtMinutes(data.totals.avg_per_day)} mono />
            <Stat label="Miembros activos" value={data.totals.active_workers} mono />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Minutos por día (Mié → Mar)</p>
            <WeekChart days={data.days} workers={data.workers_chart} />
            <p className="text-[11px] text-slate-400 mt-2">La línea gruesa celeste es el total del equipo; las delgadas, cada miembro.</p>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-3 text-base">Detalle por miembro</h3>
            <div className="space-y-2" data-testid="week-workers-table">
              {data.table.map((r) => (
                <div key={r.id} data-testid={`week-worker-row-${r.id}`} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-800 truncate">
                        {r.rank && <span className="text-sky-600 font-mono mr-1">#{r.rank}</span>}
                        {r.name}
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        {fmtMinutes(r.minutes)} · {r.hours} h
                        {r.qualifies
                          ? <span className="text-emerald-600 font-bold"> · Supera 10 h{bonusLabel(r.rank) ? ` · Bono ${bonusLabel(r.rank)}` : ""}</span>
                          : <span className="text-slate-400"> · No llega a 10 h</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-slate-800">{fmtMoney(r.total)}</p>
                      {r.bonus > 0 && <p className="text-[10px] text-amber-600 font-semibold">base {fmtMoney(r.base)} + bono {fmtMoney(r.bonus)}</p>}
                    </div>
                  </div>
                  {r.total > 0 && (
                    <button
                      data-testid={`toggle-paid-${r.id}`}
                      onClick={() => togglePaid.mutate(r)}
                      className={`mt-2.5 w-full flex items-center justify-center gap-1.5 text-[11px] font-bold rounded-xl py-2 transition-all active:scale-95 ${
                        r.paid ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-900 text-sky-400 border border-sky-500/30 hover:bg-slate-800"
                      }`}
                    >
                      {r.paid ? <><Undo2 className="w-3.5 h-3.5" /> Pagada — deshacer</> : <><CheckCircle2 className="w-3.5 h-3.5" /> Marcar como pagada</>}
                    </button>
                  )}
                </div>
              ))}
              {data.table.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Aún no has agregado miembros.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, mono }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
      <p className={`text-lg font-bold text-slate-800 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
