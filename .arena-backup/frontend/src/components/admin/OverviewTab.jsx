import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleDollarSign, Wallet, Clock } from "lucide-react";
import { toast } from "sonner";
import api, { fmtMoney, fmtMinutes, fmtDate } from "@/lib/api";
import PayoutExport from "@/components/admin/PayoutExport";

export default function OverviewTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["overview"],
    queryFn: () => api.get("/admin/overview").then((r) => r.data),
  });

  const pay = useMutation({
    mutationFn: (p) => api.post("/admin/payments", { worker_id: p.worker_id, week_start: p.week_start }),
    onSuccess: () => {
      toast.success("Pago marcado como realizado");
      qc.invalidateQueries();
    },
    onError: () => toast.error("No se pudo registrar el pago"),
  });

  if (isLoading) return <p className="text-center text-slate-400 py-10 text-sm">Cargando resumen…</p>;

  return (
    <div className="space-y-5 fade-up">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0B132B] rounded-2xl p-4 text-white" data-testid="total-paid-card">
          <Wallet className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total pagado</p>
          <p className="font-mono text-2xl font-bold text-emerald-400">{fmtMoney(data.total_paid)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm" data-testid="total-pending-card">
          <CircleDollarSign className="w-5 h-5 text-amber-500 mb-2" />
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Pendiente por pagar</p>
          <p className="font-mono text-2xl font-bold text-amber-600">{fmtMoney(data.pending_total)}</p>
        </div>
      </div>

      <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex items-center gap-3" data-testid="current-week-card">
        <Clock className="w-5 h-5 text-sky-600 shrink-0" />
        <div>
          <p className="text-xs text-sky-700 font-semibold">Semana en curso (Mié–Mar)</p>
          <p className="font-mono text-lg font-bold text-sky-700">{fmtMinutes(data.current_week.minutes)} grabados por el equipo</p>
        </div>
      </div>

      <PayoutExport />

      <div>
        <h3 className="font-bold text-slate-800 mb-3 text-base">Pagos pendientes de semanas cerradas</h3>
        {data.pending.length === 0 && (
          <p className="text-sm text-slate-400 bg-white rounded-2xl border border-slate-100 p-5 text-center" data-testid="no-pending-message">
            No hay pagos pendientes. ¡Todo al día!
          </p>
        )}
        <div className="space-y-2">
          {data.pending.map((p) => (
            <div key={`${p.worker_id}-${p.week_start}`} data-testid={`pending-payment-${p.worker_id}-${p.week_start}`} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-800 truncate">{p.name}</p>
                  <p className="text-xs text-slate-400 font-medium">
                    Semana {fmtDate(p.week_start)} – {fmtDate(p.week_end)} · {fmtMinutes(p.minutes)}
                    {p.rank <= 3 && <span className="text-amber-600 font-bold"> · #{p.rank} (+{p.rank === 1 ? 30 : p.rank === 2 ? 20 : 10}%)</span>}
                  </p>
                </div>
                <p className="font-mono font-bold text-slate-800">{fmtMoney(p.total)}</p>
              </div>
              <button
                data-testid={`mark-paid-button-${p.worker_id}-${p.week_start}`}
                onClick={() => pay.mutate(p)}
                disabled={pay.isPending}
                className="mt-3 w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold rounded-xl py-2.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Marcar como pagado
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
