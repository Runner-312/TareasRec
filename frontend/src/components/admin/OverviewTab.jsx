import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleDollarSign, Clock3, Wallet } from "lucide-react";
import { toast } from "sonner";
import api, { fmtDate, fmtMoney, fmtMinutes } from "@/lib/api";
import PayoutExport from "@/components/admin/PayoutExport";
import ExtraBonusCard from "@/components/admin/ExtraBonusCard";
import ManualPayout from "@/components/admin/ManualPayout";

export default function OverviewTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["overview"],
    queryFn: () => api.get("/admin/overview").then((response) => response.data),
  });

  const pay = useMutation({
    mutationFn: (payment) => api.post("/admin/payments", { worker_id: payment.worker_id, week_start: payment.week_start }),
    onSuccess: () => {
      toast.success("Pago marcado como realizado");
      qc.invalidateQueries();
    },
    onError: () => toast.error("No se pudo registrar el pago"),
  });

  if (isLoading || !data) return <OverviewSkeleton />;

  return (
    <div className="space-y-6 fade-up">
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" aria-label="Indicadores principales">
        <MetricCard
          testId="total-paid-card"
          icon={Wallet}
          label="Total pagado"
          value={fmtMoney(data.total_paid)}
          tone="emerald"
          dark
        />
        <MetricCard
          testId="total-pending-card"
          icon={CircleDollarSign}
          label="Pendiente por pagar"
          value={fmtMoney(data.pending_total)}
          tone="amber"
        />
        <div className="col-span-2 lg:col-span-1 bg-sky-50 border border-sky-100 rounded-2xl p-4 sm:p-5 flex items-center gap-3" data-testid="current-week-card">
          <span className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
            <Clock3 className="w-5 h-5 text-sky-600" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-sky-700 font-bold">Semana en curso · Mié–Mar</p>
            <p className="font-mono text-lg sm:text-xl font-bold text-sky-700 truncate">{fmtMinutes(data.current_week.minutes)}</p>
            <p className="text-xs text-sky-700/70">grabados por el equipo</p>
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 items-start">
        <ExtraBonusCard />
      <PayoutExport />
      <ManualPayout />

        <div>
          <div className="flex items-end justify-between gap-3 mb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Pagos pendientes</h2>
              <p className="text-xs text-slate-500">Semanas cerradas listas para liquidar</p>
            </div>
            {data.pending.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">{data.pending.length}</span>
            )}
          </div>

          {data.pending.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-7 text-center" data-testid="no-pending-message">
              <span className="mx-auto w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </span>
              <p className="mt-3 font-bold text-sm text-slate-800">Todo al día</p>
              <p className="mt-1 text-xs text-slate-500">No hay pagos pendientes en este momento.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.pending.map((payment) => (
                <div key={`${payment.worker_id}-${payment.week_start}`} data-testid={`pending-payment-${payment.worker_id}-${payment.week_start}`} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-800 truncate">{payment.name}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {fmtDate(payment.week_start)} – {fmtDate(payment.week_end)} · {fmtMinutes(payment.minutes)}
                      </p>
                      {payment.rank <= 3 && <p className="mt-1 text-[11px] text-amber-600 font-bold">Puesto #{payment.rank} · bono +{payment.rank === 1 ? 30 : payment.rank === 2 ? 20 : 10}%</p>}
                    </div>
                    <p className="font-mono font-bold text-slate-900 shrink-0">{fmtMoney(payment.total)}</p>
                  </div>
                  <button
                    data-testid={`mark-paid-button-${payment.worker_id}-${payment.week_start}`}
                    onClick={() => pay.mutate(payment)}
                    disabled={pay.isPending}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white text-xs font-bold rounded-xl py-2.5 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Marcar como pagado
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, tone, dark, testId }) {
  const colors = tone === "emerald"
    ? { icon: "text-emerald-400", bubble: "bg-emerald-400/10", value: "text-emerald-400" }
    : { icon: "text-amber-500", bubble: "bg-amber-50", value: "text-amber-600" };

  return (
    <div className={`${dark ? "bg-[#0B132B] text-white border-slate-800" : "bg-white border-slate-100"} rounded-2xl border p-4 sm:p-5 shadow-sm`} data-testid={testId}>
      <span className={`w-9 h-9 rounded-xl ${colors.bubble} flex items-center justify-center`}><Icon className={`w-5 h-5 ${colors.icon}`} /></span>
      <p className={`mt-3 text-[10px] sm:text-[11px] uppercase tracking-wider font-bold ${dark ? "text-slate-400" : "text-slate-400"}`}>{label}</p>
      <p className={`font-mono text-xl sm:text-2xl font-bold ${colors.value}`}>{value}</p>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Cargando resumen">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[0, 1, 2].map((item) => <div key={item} className={`${item === 2 ? "col-span-2 lg:col-span-1" : ""} h-36 rounded-2xl bg-slate-200/70`} />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-56 rounded-2xl bg-slate-200/70" />
        <div className="h-44 rounded-2xl bg-slate-200/70" />
      </div>
    </div>
  );
}
