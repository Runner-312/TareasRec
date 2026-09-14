import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, Download, CheckCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import api, { fmtMoney } from "@/lib/api";

const downloadBlob = (data, filename) => {
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export default function PayoutExport() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["payout-export"],
    queryFn: () => api.get("/admin/payments/export").then((r) => r.data),
  });

  const download = useMutation({
    mutationFn: () => api.get("/admin/payments/export.xlsx", { responseType: "blob" }),
    onSuccess: (r) => {
      downloadBlob(r.data, `binance_pay_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Excel de Binance Pay descargado");
    },
    onError: () => toast.error("No hay pagos listos para exportar"),
  });

  const markAll = useMutation({
    mutationFn: () => api.post("/admin/payments/mark-all"),
    onSuccess: (r) => {
      toast.success(`${r.data.marked} pago(s) marcados como realizados`);
      qc.invalidateQueries();
    },
    onError: () => toast.error("No se pudieron marcar los pagos"),
  });

  if (!data) return null;
  const issues = data.rows.filter((r) => !r.ready);

  return (
    <div className="bg-[#0B132B] rounded-2xl p-4 text-white space-y-3" data-testid="payout-export-card">
      <div className="flex items-start gap-3">
        <FileSpreadsheet className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">Pago masivo con Binance Pay</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Lunes 23:00 (España). Descarga el Excel con la plantilla oficial, súbelo en Binance Pay → Enviar a varios y listo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-800/60 rounded-xl p-3" data-testid="payout-ready-count">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Miembros listos</p>
          <p className="font-mono text-lg font-bold text-emerald-400">{data.ready_count}</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-3" data-testid="payout-ready-total">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Total {data.currency}</p>
          <p className="font-mono text-lg font-bold text-emerald-400">{fmtMoney(data.ready_total)}</p>
        </div>
      </div>

      {data.rows.length > 0 && (
        <div className="space-y-1.5" data-testid="payout-rows">
          {data.rows.map((r) => (
            <div key={r.worker_id} data-testid={`payout-row-${r.worker_id}`} className="flex items-center gap-2 text-xs bg-slate-800/40 rounded-lg px-3 py-2">
              <span className="flex-1 font-semibold truncate">{r.name}</span>
              <span className="font-mono text-slate-300 truncate max-w-[110px]">{r.binance_pay_id || "—"}</span>
              <span className={`font-mono font-bold ${r.ready ? "text-emerald-400" : "text-amber-400"}`}>{fmtMoney(r.total)}</span>
            </div>
          ))}
        </div>
      )}

      {issues.length > 0 && (
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3" data-testid="payout-issues">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200">
            No se incluirán: {issues.map((r) => `${r.name} (${r.issue.toLowerCase()})`).join(", ")}. Agrega el Binance Pay ID en Miembros.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          data-testid="payout-download-button"
          onClick={() => download.mutate()}
          disabled={download.isPending || data.ready_count === 0}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold rounded-xl py-3 transition-all disabled:opacity-40"
        >
          <Download className="w-4 h-4" /> Descargar Excel
        </button>
        <button
          data-testid="payout-mark-all-button"
          onClick={() => { if (window.confirm(`¿Marcar como pagados los ${data.ready_count} miembros del Excel?`)) markAll.mutate(); }}
          disabled={markAll.isPending || data.ready_count === 0}
          className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white text-xs font-bold rounded-xl py-3 transition-all disabled:opacity-40"
        >
          <CheckCheck className="w-4 h-4" /> Marcar todos pagados
        </button>
      </div>
    </div>
  );
}
